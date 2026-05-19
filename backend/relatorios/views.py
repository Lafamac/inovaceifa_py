from datetime import date
from django.db.models import Sum, Q, Avg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.models import Fazenda, Safra
from planejamento.views import setup_tenant_context
from planejamento.models import PlanejamentoSafra, PlanejamentoRateio, PlanejamentoMaoObraTerceiros, PlanejamentoAdubo, ItemInsumoOSPlanejado
from financeiro.models import ContasAPagar, ContasAReceber, ItemPedidoCompra
from cadastros.models import EstoqueMovimento, Talhao, Funcionario
from operacoes.models import OrdemServico, OrdemServicoTalhao, ApontamentoFuncionario, ApontamentoOperacao

class BaseRelatorioView(APIView):
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    def get_selected_fazenda(self, request):
        fazenda_id = request.query_params.get('fazenda_id')
        if fazenda_id:
            try:
                fazenda = request.fazendas_permitidas.filter(id=fazenda_id, ativo=True).first()
                if not fazenda:
                    return None, "Fazenda informada não existe ou acesso não permitido."
                return fazenda, None
            except ValueError:
                return None, "ID de Fazenda inválido."
        
        if not getattr(request, 'fazenda_ativa', None):
            return None, "Selecione uma fazenda ativa ou passe o parâmetro 'fazenda_id'."
        
        return request.fazenda_ativa, None


class ComparativoSafraView(BaseRelatorioView):
    """
    Compara o custo planejado vs real para todas as safras da fazenda selecionada.
    """
    def get(self, request):
        fazenda, error = self.get_selected_fazenda(request)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar safras da fazenda
        safras = Safra.objects.filter(fazenda=fazenda, ativo=True).order_by('data_inicio')
        
        comparativos = []
        for safra in safras:
            # 1. Custo Real (Contas a Pagar pagas + pendentes, exceto CANCELADAS)
            real_qs = ContasAPagar.objects.filter(safra=safra, ativo=True).exclude(status='CANCELADO')
            total_real = real_qs.aggregate(total=Sum('valor'))['total'] or 0.00

            # Categorização de custo Real baseada na descrição e pedido_compra
            real_insumos = real_qs.filter(
                Q(pedido_compra__isnull=False) | 
                Q(descricao__icontains='insumo') | 
                Q(descricao__icontains='adubo') | 
                Q(descricao__icontains='defensivo') |
                Q(descricao__icontains='compra')
            ).aggregate(total=Sum('valor'))['total'] or 0.00
            
            real_mao_obra = real_qs.filter(
                Q(descricao__icontains='mão de obra') | 
                Q(descricao__icontains='mao de obra') | 
                Q(descricao__icontains='trabalhador') | 
                Q(descricao__icontains='salario') | 
                Q(descricao__icontains='funcionario') | 
                Q(descricao__icontains='terceiro') |
                Q(descricao__icontains='serviço') |
                Q(descricao__icontains='servico')
            ).aggregate(total=Sum('valor'))['total'] or 0.00
            
            real_outros = float(total_real) - float(real_insumos) - float(real_mao_obra)
            if real_outros < 0:
                real_outros = 0.00

            # 2. Custo Planejado
            planejamento = PlanejamentoSafra.objects.filter(safra=safra, ativo=True).first()
            
            total_plan = 0.00
            plan_insumos = 0.00
            plan_mao_obra = 0.00
            plan_outros = 0.00
            
            if planejamento:
                # Rateios/Administrativo
                plan_outros = PlanejamentoRateio.objects.filter(planejamento=planejamento, ativo=True).aggregate(total=Sum('valor_planejado'))['total'] or 0.00
                plan_outros = float(plan_outros)
                
                # Mão de obra de terceiros planejada
                plan_mao_obra = PlanejamentoMaoObraTerceiros.objects.filter(ordem_servico_planejada__planejamento=planejamento, ativo=True).aggregate(total=Sum('valor_planejado'))['total'] or 0.00
                plan_mao_obra = float(plan_mao_obra)
                
                # Buscar preço médio dos produtos
                product_prices = {}
                movs = EstoqueMovimento.objects.filter(safra=safra, tipo_movimento='ENTRADA', ativo=True).values('produto_id').annotate(avg_price=Avg('valor_unitario'))
                for m in movs:
                    product_prices[m['produto_id']] = m['avg_price']
                    
                missing_pids = []
                adubos_qs = PlanejamentoAdubo.objects.filter(planejamento=planejamento, ativo=True)
                for ad in adubos_qs:
                    if ad.produto_id not in product_prices:
                        missing_pids.append(ad.produto_id)
                        
                insumos_qs = ItemInsumoOSPlanejado.objects.filter(ordem_servico_planejada__planejamento=planejamento, ativo=True)
                for ins in insumos_qs:
                    if ins.produto_id not in product_prices:
                        missing_pids.append(ins.produto_id)
                        
                if missing_pids:
                    purchases = ItemPedidoCompra.objects.filter(produto_id__in=missing_pids, ativo=True).values('produto_id').annotate(avg_price=Avg('valor_unitario'))
                    for p in purchases:
                        product_prices[p['produto_id']] = p['avg_price']
                        
                # Adubo Planejado
                for ad in adubos_qs:
                    price = product_prices.get(ad.produto_id, 0.00)
                    plan_insumos += float(ad.quantidade_planejada) * float(price)
                    
                # OS Insumo Planejado
                for ins in insumos_qs:
                    price = product_prices.get(ins.produto_id, 0.00)
                    plan_insumos += float(ins.quantidade_planejada) * float(price)
                    
                total_plan = float(plan_insumos) + float(plan_mao_obra) + float(plan_outros)

            comparativos.append({
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "ativa": safra.ativa,
                "total_planejado": round(float(total_plan), 2),
                "total_real": round(float(total_real), 2),
                "breakdown": {
                    "planejado": {
                        "insumos": round(float(plan_insumos), 2),
                        "mao_obra": round(float(plan_mao_obra), 2),
                        "outros": round(float(plan_outros), 2)
                    },
                    "real": {
                        "insumos": round(float(real_insumos), 2),
                        "mao_obra": round(float(real_mao_obra), 2),
                        "outros": round(float(real_outros), 2)
                    }
                }
            })
            
        return Response({
            "fazenda_id": fazenda.id,
            "fazenda_nome": fazenda.nome,
            "comparativos": comparativos
        }, status=status.HTTP_200_OK)


class FluxoCaixaView(BaseRelatorioView):
    """
    Fluxo de Caixa projetado vs realizado.
    Filtra por data_inicio e data_fim. Se não informado, usa as datas da safra ativa.
    """
    def get(self, request):
        if not getattr(request, 'safra_ativa', None):
            return Response(
                {"detail": "O cabeçalho X-Safra-ID é obrigatório para acessar este relatório."},
                status=status.HTTP_400_BAD_REQUEST
            )

        safra = request.safra_ativa
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')

        try:
            data_inicio = date.fromisoformat(data_inicio_str) if data_inicio_str else safra.data_inicio
            data_fim = date.fromisoformat(data_fim_str) if data_fim_str else safra.data_fim
        except ValueError:
            return Response(
                {"detail": "Formato de data inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_date = date.today()

        # 1. Contas a Pagar Pagas (Saída Realizada - data_pagamento)
        outflow_real = ContasAPagar.objects.filter(
            safra=safra,
            status='PAGO',
            data_pagamento__range=[data_inicio, data_fim],
            ativo=True
        ).order_by('data_pagamento')

        # 2. Contas a Receber Recebidas (Entrada Realizada - data_recebimento)
        inflow_real = ContasAReceber.objects.filter(
            safra=safra,
            status='RECEBIDO',
            data_recebimento__range=[data_inicio, data_fim],
            ativo=True
        ).order_by('data_recebimento')

        # 3. Contas a Pagar Pendentes (Saída Prevista - data_vencimento)
        outflow_prev = ContasAPagar.objects.filter(
            safra=safra,
            status='PENDENTE',
            data_vencimento__range=[data_inicio, data_fim],
            ativo=True
        ).order_by('data_vencimento')

        # 4. Contas a Receber Pendentes (Entrada Prevista - data_vencimento)
        inflow_prev = ContasAReceber.objects.filter(
            safra=safra,
            status='PENDENTE',
            data_vencimento__range=[data_inicio, data_fim],
            ativo=True
        ).order_by('data_vencimento')

        transacoes = []

        # Adicionar saídas reais
        for x in outflow_real:
            transacoes.append({
                "id": f"pag_real_{x.id}",
                "tipo": "SAIDA",
                "categoria": "Realizado",
                "descricao": x.descricao,
                "valor": float(x.valor),
                "data": x.data_pagamento.isoformat(),
                "data_vencimento": x.data_vencimento.isoformat(),
                "status": "PAGO",
                "atrasado": False
            })

        # Adicionar entradas reais
        for x in inflow_real:
            transacoes.append({
                "id": f"rec_real_{x.id}",
                "tipo": "ENTRADA",
                "categoria": "Realizado",
                "descricao": x.descricao,
                "valor": float(x.valor),
                "data": x.data_recebimento.isoformat(),
                "data_vencimento": x.data_vencimento.isoformat(),
                "status": "RECEBIDO",
                "atrasado": False
            })

        # Adicionar saídas previstas (atrasa se data_vencimento < hoje)
        for x in outflow_prev:
            atrasado = x.data_vencimento < current_date
            transacoes.append({
                "id": f"pag_prev_{x.id}",
                "tipo": "SAIDA",
                "categoria": "Previsto",
                "descricao": x.descricao,
                "valor": float(x.valor),
                "data": x.data_vencimento.isoformat(),
                "data_vencimento": x.data_vencimento.isoformat(),
                "status": "PENDENTE",
                "atrasado": atrasado
            })

        # Adicionar entradas previstas (atrasa se data_vencimento < hoje)
        for x in inflow_prev:
            atrasado = x.data_vencimento < current_date
            transacoes.append({
                "id": f"rec_prev_{x.id}",
                "tipo": "ENTRADA",
                "categoria": "Previsto",
                "descricao": x.descricao,
                "valor": float(x.valor),
                "data": x.data_vencimento.isoformat(),
                "data_vencimento": x.data_vencimento.isoformat(),
                "status": "PENDENTE",
                "atrasado": atrasado
            })

        # Ordenar por data
        transacoes.sort(key=lambda x: x['data'])

        # Totais
        total_entrada_real = sum(t['valor'] for t in transacoes if t['tipo'] == 'ENTRADA' and t['categoria'] == 'Realizado')
        total_saida_real = sum(t['valor'] for t in transacoes if t['tipo'] == 'SAIDA' and t['categoria'] == 'Realizado')
        total_entrada_prev = sum(t['valor'] for t in transacoes if t['tipo'] == 'ENTRADA' and t['categoria'] == 'Previsto')
        total_saida_prev = sum(t['valor'] for t in transacoes if t['tipo'] == 'SAIDA' and t['categoria'] == 'Previsto')

        saldo_realizado = total_entrada_real - total_saida_real
        saldo_projetado = (total_entrada_real + total_entrada_prev) - (total_saida_real + total_saida_prev)

        # Agrupar dados para gráfico mensal
        grouped_chart = {}
        for t in transacoes:
            try:
                # Converter data string de volta para extrair o mês
                d_obj = date.fromisoformat(t['data'])
                m_key = d_obj.strftime('%Y-%m')
                m_label = d_obj.strftime('%b/%Y')
            except Exception:
                continue

            if m_key not in grouped_chart:
                grouped_chart[m_key] = {
                    "mes": m_label,
                    "entradas_realizadas": 0.0,
                    "saidas_realizadas": 0.0,
                    "entradas_previstas": 0.0,
                    "saidas_previstas": 0.0,
                }
            
            if t['tipo'] == 'ENTRADA':
                if t['categoria'] == 'Realizado':
                    grouped_chart[m_key]['entradas_realizadas'] += t['valor']
                else:
                    grouped_chart[m_key]['entradas_previstas'] += t['valor']
            else:
                if t['categoria'] == 'Realizado':
                    grouped_chart[m_key]['saidas_realizadas'] += t['valor']
                else:
                    grouped_chart[m_key]['saidas_previstas'] += t['valor']

        chart_data = sorted([{"key": k, **v} for k, v in grouped_chart.items()], key=lambda x: x['key'])

        return Response({
            "resumo": {
                "entradas_realizadas": round(total_entrada_real, 2),
                "saidas_realizadas": round(total_saida_real, 2),
                "saldo_realizado": round(saldo_realizado, 2),
                "entradas_previstas": round(total_entrada_prev, 2),
                "saidas_previstas": round(total_saida_prev, 2),
                "saldo_projetado": round(saldo_projetado, 2)
            },
            "grafico": chart_data,
            "transacoes": transacoes
        }, status=status.HTTP_200_OK)


class EficienciaOperacionalView(BaseRelatorioView):
    """
    Métricas de eficiência operacional baseadas em horas trabalhadas e talhões executados.
    """
    def get(self, request):
        if not getattr(request, 'safra_ativa', None):
            return Response(
                {"detail": "O cabeçalho X-Safra-ID é obrigatório para acessar este relatório."},
                status=status.HTTP_400_BAD_REQUEST
            )

        safra = request.safra_ativa

        # 1. Total de horas trabalhadas de funcionários próprios
        total_horas = ApontamentoFuncionario.objects.filter(
            apontamento__ordem_servico__safra=safra,
            ativo=True,
            apontamento__ativo=True,
            apontamento__ordem_servico__ativo=True
        ).aggregate(total=Sum('horas_trabalhadas'))['total'] or 0.00

        # 2. Total de hectares trabalhados (Soma de área dos talhões onde as OS estão CONCLUIDAS)
        completed_os = OrdemServico.objects.filter(
            safra=safra,
            status='CONCLUIDA',
            ativo=True
        )

        total_area_executada = 0.00
        for os in completed_os:
            os_talhoes = OrdemServicoTalhao.objects.filter(ordem_servico=os, ativo=True)
            for ost in os_talhoes:
                total_area_executada += float(ost.talhao.area)

        # Hectares únicos que tiveram pelo menos uma atividade concluída
        distinct_talhao_ids = OrdemServicoTalhao.objects.filter(
            ordem_servico__in=completed_os,
            ativo=True
        ).values_list('talhao_id', flat=True).distinct()

        total_area_propria_unica = Talhao.objects.filter(
            id__in=distinct_talhao_ids,
            ativo=True
        ).aggregate(total=Sum('area'))['total'] or 0.00

        # 3. Eficiência Geral (ha/h)
        total_horas_f = float(total_horas)
        total_area_exec_f = float(total_area_executada)
        
        eficiencia_geral = 0.00
        if total_horas_f > 0:
            eficiencia_geral = total_area_exec_f / total_horas_f

        # 4. Quebra por Tipo de Operação
        breakdown = []
        from referencias.models import TipoOperacao
        tipos_operacao = TipoOperacao.objects.filter(ativo=True)

        for tipo in tipos_operacao:
            # Horas na operação específica
            horas_tipo = ApontamentoFuncionario.objects.filter(
                apontamento__ordem_servico__safra=safra,
                apontamento__ordem_servico__tipo_operacao=tipo,
                ativo=True,
                apontamento__ativo=True,
                apontamento__ordem_servico__ativo=True
            ).aggregate(total=Sum('horas_trabalhadas'))['total'] or 0.00
            
            # Área executada específica
            os_tipo = completed_os.filter(tipo_operacao=tipo)
            area_tipo = 0.00
            for os in os_tipo:
                os_talhoes = OrdemServicoTalhao.objects.filter(ordem_servico=os, ativo=True)
                for ost in os_talhoes:
                    area_tipo += float(ost.talhao.area)

            horas_tipo_f = float(horas_tipo)
            area_tipo_f = float(area_tipo)

            if horas_tipo_f > 0 or area_tipo_f > 0:
                eficiencia_tipo = area_tipo_f / horas_tipo_f if horas_tipo_f > 0 else 0.00
                breakdown.append({
                    "tipo_operacao_id": tipo.id,
                    "tipo_operacao_nome": tipo.nome,
                    "horas_trabalhadas": round(horas_tipo_f, 2),
                    "area_trabalhada": round(area_tipo_f, 2),
                    "eficiencia": round(eficiencia_tipo, 2)
                })

        return Response({
            "total_horas_trabalhadas": round(total_horas_f, 2),
            "total_hectares_trabalhados": round(total_area_exec_f, 2),
            "total_hectares_unicos": round(float(total_area_propria_unica), 2),
            "eficiencia_geral": round(eficiencia_geral, 2), # ha/hora
            "breakdown": breakdown
        }, status=status.HTTP_200_OK)
