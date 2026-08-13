from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import OpenApiResponse, OpenApiTypes, extend_schema
from django.db.models import Sum
from core.models import Fazenda, Safra
from referencias.models import (
    Cultura, TipoIrrigacao, StatusCultivo, ResistenciaFerrugem,
    TipoItem, GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida
)
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Terceirizado, TurmaTerceirizada,
    Produto, EstoqueMovimento, TransferenciaAtivo, LocacaoMaquina,
    ManutencaoMaquina, Fornecedor
)
from cadastros.serializers import (
    TalhaoSerializer, EstimativaProducaoTalhaoSerializer,
    MaquinaSerializer, CustoMensalMaquinaSerializer,
    FuncionarioSerializer, SalarioMensalSerializer,
    TerceirizadoSerializer, TurmaTerceirizadaSerializer,
    ProdutoSerializer, EstoqueMovimentoSerializer,
    TransferenciaAtivoSerializer, LocacaoMaquinaSerializer,
    ManutencaoMaquinaSerializer, FornecedorSerializer
)


class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet base que aplica automaticamente a autenticação obrigatória
    e fornece filtros padrão para soft-delete (ativo=True).
    """
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        from planejamento.views import setup_tenant_context
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        qs = self.queryset
        model = qs.model

        if hasattr(model, 'fazenda'):
            if model.__name__ == 'Produto':
                from django.db.models import Q
                qs = qs.filter(Q(fazenda__isnull=True) | Q(fazenda__ativo=True, fazenda__proprietario__ativo=True))
            else:
                qs = qs.filter(fazenda__ativo=True, fazenda__proprietario__ativo=True)
        elif hasattr(model, 'talhao'):
            qs = qs.filter(talhao__fazenda__ativo=True, talhao__fazenda__proprietario__ativo=True)
        elif hasattr(model, 'maquina'):
            qs = qs.filter(maquina__fazenda__ativo=True, maquina__fazenda__proprietario__ativo=True)
        elif hasattr(model, 'funcionario'):
            qs = qs.filter(funcionario__fazenda__ativo=True, funcionario__fazenda__proprietario__ativo=True)
        elif hasattr(model, 'origem'):
            qs = qs.filter(origem__ativo=True, origem__proprietario__ativo=True)

        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        if incluir_inativos or is_detail:
            return qs
        return qs.filter(ativo=True)

    def perform_destroy(self, instance):
        # Soft delete mandatório
        instance.ativo = False
        instance.save()

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method in ['GET', 'HEAD']:
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response


class TalhaoViewSet(BaseTenantViewSet):
    queryset = Talhao.objects.all()
    serializer_class = TalhaoSerializer

    def get_queryset(self):
        # Filtra talhões pertencentes às fazendas permitidas do usuário
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class EstimativaProducaoTalhaoViewSet(BaseTenantViewSet):
    queryset = EstimativaProducaoTalhao.objects.all()
    serializer_class = EstimativaProducaoTalhaoSerializer

    def get_queryset(self):
        # Filtra estimativas vinculadas à safra ativa e fazendas permitidas
        qs = super().get_queryset().filter(
            talhao__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs


class MaquinaViewSet(BaseTenantViewSet):
    queryset = Maquina.objects.all()
    serializer_class = MaquinaSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class CustoMensalMaquinaViewSet(BaseTenantViewSet):
    queryset = CustoMensalMaquina.objects.all()
    serializer_class = CustoMensalMaquinaSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            maquina__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs


class FuncionarioViewSet(BaseTenantViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class SalarioMensalViewSet(BaseTenantViewSet):
    queryset = SalarioMensal.objects.all()
    serializer_class = SalarioMensalSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            funcionario__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs


class TerceirizadoViewSet(BaseTenantViewSet):
    queryset = Terceirizado.objects.all()
    serializer_class = TerceirizadoSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class TurmaTerceirizadaViewSet(BaseTenantViewSet):
    queryset = TurmaTerceirizada.objects.all()
    serializer_class = TurmaTerceirizadaSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


class ProdutoViewSet(BaseTenantViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer

    def get_queryset(self):
        from django.db.models import Q
        # Filtra produtos pertencentes às fazendas permitidas ou globais
        qs = super().get_queryset().filter(
            Q(fazenda__in=self.request.fazendas_permitidas) | Q(fazenda__isnull=True)
        )
        if self.request.safra_ativa:
            qs = qs.filter(Q(safra=self.request.safra_ativa) | Q(safra__isnull=True))
        return qs

    @action(detail=False, methods=['post'], url_path='copiar-safra')
    def copiar_safra(self, request):
        safra_origem_id = request.data.get('safra_origem_id')
        safra_destino_id = request.data.get('safra_destino_id') or (request.safra_ativa.id if request.safra_ativa else None)
        carregar_estoque = request.data.get('carregar_estoque', False)

        if not safra_origem_id or not safra_destino_id:
            return Response(
                {"detail": "Informe safra_origem_id e safra_destino_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            safra_origem = Safra.objects.get(id=safra_origem_id)
            safra_destino = Safra.objects.get(id=safra_destino_id)
        except Safra.DoesNotExist:
            return Response(
                {"detail": "Safra de origem ou destino não encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Buscar todos os produtos ativos da safra de origem
        produtos_origem = Produto.objects.filter(safra=safra_origem, ativo=True)
        count = 0
        
        for p in produtos_origem:
            saldo = 0
            if carregar_estoque:
                # Calcular o saldo do produto na safra de origem
                entradas = EstoqueMovimento.objects.filter(
                    fazenda=safra_origem.fazenda, safra=safra_origem, produto=p, tipo_movimento='ENTRADA', ativo=True
                ).aggregate(total=Sum('quantidade'))['total'] or 0
                saidas = EstoqueMovimento.objects.filter(
                    fazenda=safra_origem.fazenda, safra=safra_origem, produto=p, tipo_movimento='SAIDA', ativo=True
                ).aggregate(total=Sum('quantidade'))['total'] or 0
                ajustes = EstoqueMovimento.objects.filter(
                    fazenda=safra_origem.fazenda, safra=safra_origem, produto=p, tipo_movimento='AJUSTE', ativo=True
                ).aggregate(total=Sum('quantidade'))['total'] or 0
                transf_enviadas = EstoqueMovimento.objects.filter(
                    origem_transferencia=safra_origem.fazenda, safra=safra_origem, produto=p, tipo_movimento='TRANSFERENCIA', ativo=True
                ).aggregate(total=Sum('quantidade'))['total'] or 0
                transf_recebidas = EstoqueMovimento.objects.filter(
                    destino_transferencia=safra_origem.fazenda, safra=safra_origem, produto=p, tipo_movimento='TRANSFERENCIA', ativo=True
                ).aggregate(total=Sum('quantidade'))['total'] or 0
                
                saldo = (entradas + ajustes + transf_recebidas) - (saidas + transf_enviadas)

            # Evitar duplicar se já existir produto com o mesmo nome comercial na safra de destino
            prod_destino = Produto.objects.filter(
                fazenda=safra_destino.fazenda,
                safra=safra_destino,
                nome_comercial=p.nome_comercial,
                ativo=True
            ).first()

            if not prod_destino:
                # Clonar produto
                prod_destino = Produto(
                    fazenda=safra_destino.fazenda,
                    safra=safra_destino,
                    codigo=p.codigo,
                    nome_comercial=p.nome_comercial,
                    unidade=p.unidade,
                    classificacao=p.classificacao,
                    grupo_quimico=p.grupo_quimico,
                    concentracao=p.concentracao,
                    periodo_carencia=p.periodo_carencia,
                    alvo=p.alvo,
                    recomendacoes_tecnicas=p.recomendacoes_tecnicas,
                    valor_unitario=p.valor_unitario
                )
                prod_destino.save()
                count += 1

            # Transportar saldo físico se positivo e solicitado
            if carregar_estoque and saldo > 0:
                # Verificar se já existe lançamento de SALDO ANTERIOR para esse produto
                if not EstoqueMovimento.objects.filter(
                    fazenda=safra_destino.fazenda,
                    safra=safra_destino,
                    produto=prod_destino,
                    documento_referencia='SALDO ANTERIOR',
                    ativo=True
                ).exists():
                    EstoqueMovimento.objects.create(
                        fazenda=safra_destino.fazenda,
                        safra=safra_destino,
                        produto=prod_destino,
                        tipo_movimento='ENTRADA',
                        quantidade=saldo,
                        valor_unitario=0.0000,
                        valor_total=0.00,
                        data_movimento=safra_destino.data_inicio,
                        documento_referencia='SALDO ANTERIOR',
                        observacao=f'TRANSPORTE AUTOMÁTICO DE SALDO DA SAFRA ANTERIOR ({safra_origem.nome}).'
                    )

        return Response({"detail": f"{count} produtos copiados com sucesso para a safra {safra_destino.nome}."})


class EstoqueMovimentoViewSet(BaseTenantViewSet):
    queryset = EstoqueMovimento.objects.all()
    serializer_class = EstoqueMovimentoSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tipo = serializer.validated_data.get('tipo_movimento')
        produto = serializer.validated_data.get('produto')
        quantidade = serializer.validated_data.get('quantidade')
        
        fazenda = serializer.validated_data.get('fazenda')
        safra = serializer.validated_data.get('safra')

        # Se for transferência, a fazenda de origem é a fazenda do contexto
        if tipo == 'TRANSFERENCIA':
            origem = serializer.validated_data.get('origem_transferencia')
            destino = serializer.validated_data.get('destino_transferencia')
            if not origem or not destino:
                return Response(
                    {"detail": "Transferência exige fazenda de origem e destino."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if origem == destino:
                return Response(
                    {"detail": "As fazendas de origem e destino devem ser diferentes."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if origem.proprietario != destino.proprietario:
                return Response(
                    {"detail": "As fazendas devem pertencer ao mesmo proprietário."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            fazenda = origem

        warning_msg = None
        if tipo in ['SAIDA', 'TRANSFERENCIA']:
            # Calcular saldo atual
            saldo = self.calcular_saldo_produto(fazenda, safra, produto)
            if saldo < quantidade:
                # Alerta dinâmico (não bloqueante)
                warning_msg = f"Atenção: Saldo insuficiente de {produto.nome_comercial} para esta operação. Saldo atual: {saldo}."

        if tipo == 'TRANSFERENCIA':
            from django.db import transaction
            origem = serializer.validated_data.get('origem_transferencia')
            destino = serializer.validated_data.get('destino_transferencia')
            
            # Buscar safra ativa da fazenda destino
            safra_destino = Safra.objects.filter(fazenda=destino, ativa=True, ativo=True).first()
            if not safra_destino:
                return Response(
                    {"detail": "A fazenda de destino não possui uma safra ativa."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Buscar ou clonar produto no destino
            produto_destino = Produto.objects.filter(
                fazenda=destino,
                safra=safra_destino,
                nome_comercial=produto.nome_comercial,
                ativo=True
            ).first()
            if not produto_destino:
                produto_destino = Produto.objects.create(
                    fazenda=destino,
                    safra=safra_destino,
                    codigo=produto.codigo,
                    nome_comercial=produto.nome_comercial,
                    unidade=produto.unidade,
                    classificacao=produto.classificacao,
                    grupo_quimico=produto.grupo_quimico,
                    concentracao=produto.concentracao,
                    periodo_carencia=produto.periodo_carencia,
                    alvo=produto.alvo,
                    recomendacoes_tecnicas=produto.recomendacoes_tecnicas
                )

            with transaction.atomic():
                outflow = serializer.save(
                    fazenda=origem,
                    safra=safra,
                    produto=produto,
                    tipo_movimento='TRANSFERENCIA'
                )
                
                inflow = EstoqueMovimento.objects.create(
                    fazenda=destino,
                    safra=safra_destino,
                    produto=produto_destino,
                    tipo_movimento='TRANSFERENCIA',
                    quantidade=quantidade,
                    valor_unitario=serializer.validated_data.get('valor_unitario', 0),
                    valor_total=serializer.validated_data.get('valor_total', 0) or (quantidade * serializer.validated_data.get('valor_unitario', 0)),
                    data_movimento=serializer.validated_data.get('data_movimento'),
                    documento_referencia=serializer.validated_data.get('documento_referencia'),
                    origem_transferencia=origem,
                    destino_transferencia=destino,
                    observacao=serializer.validated_data.get('observacao'),
                    transferencia_vinculada=outflow
                )
                
                outflow.transferencia_vinculada = inflow
                outflow.save()
                
            response_data = self.get_serializer(outflow).data
        else:
            self.perform_create(serializer)
            response_data = serializer.data

        headers = self.get_success_headers(response_data)
        if warning_msg:
            response_data['warning'] = warning_msg

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()
        if instance.transferencia_vinculada and instance.transferencia_vinculada.ativo:
            instance.transferencia_vinculada.ativo = False
            instance.transferencia_vinculada.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.tipo_movimento == 'TRANSFERENCIA' and instance.transferencia_vinculada:
            linked = instance.transferencia_vinculada
            
            # Se o produto mudou, precisamos encontrar ou clonar o produto correto no destino
            if instance.produto.nome_comercial != linked.produto.nome_comercial:
                produto_destino = Produto.objects.filter(
                    fazenda=linked.fazenda,
                    safra=linked.safra,
                    nome_comercial=instance.produto.nome_comercial,
                    ativo=True
                ).first()
                if not produto_destino:
                    produto_destino = Produto.objects.create(
                        fazenda=linked.fazenda,
                        safra=linked.safra,
                        codigo=instance.produto.codigo,
                        nome_comercial=instance.produto.nome_comercial,
                        unidade=instance.produto.unidade,
                        classificacao=instance.produto.classificacao,
                        grupo_quimico=instance.produto.grupo_quimico,
                        concentracao=instance.produto.concentracao,
                        periodo_carencia=instance.produto.periodo_carencia,
                        alvo=instance.produto.alvo,
                        recomendacoes_tecnicas=instance.produto.recomendacoes_tecnicas
                    )
                linked.produto = produto_destino

            linked.quantidade = instance.quantidade
            linked.valor_unitario = instance.valor_unitario
            linked.valor_total = instance.valor_total
            linked.data_movimento = instance.data_movimento
            linked.observacao = instance.observacao
            linked.save()

    def calcular_saldo_produto(self, fazenda, safra, produto):
        entradas = EstoqueMovimento.objects.filter(
            fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='ENTRADA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        saidas = EstoqueMovimento.objects.filter(
            fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='SAIDA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        ajustes = EstoqueMovimento.objects.filter(
            fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='AJUSTE', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        transf_enviadas = EstoqueMovimento.objects.filter(
            origem_transferencia=fazenda, safra=safra, produto=produto, tipo_movimento='TRANSFERENCIA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        transf_recebidas = EstoqueMovimento.objects.filter(
            destino_transferencia=fazenda, safra=safra, produto=produto, tipo_movimento='TRANSFERENCIA', ativo=True
        ).aggregate(total=Sum('quantidade'))['total'] or 0

        return (entradas + ajustes + transf_recebidas) - (saidas + transf_enviadas)


class EstoqueSaldoViewSet(viewsets.ViewSet):
    """
    ViewSet somente leitura para consulta consolidada de saldos de estoque por produto
    na fazenda e safra do contexto ativo.
    """
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        from planejamento.views import setup_tenant_context
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    @extend_schema(
        tags=["Cadastros"],
        responses={200: OpenApiResponse(response=OpenApiTypes.OBJECT)},
        summary="Saldos de estoque por produto",
    )
    def list(self, request):
        fazenda = request.fazenda_ativa
        safra = request.safra_ativa

        # Se não houver contexto ativo de fazenda/safra, retorna vazio ou erro conforme regras
        if not fazenda or not safra:
            return Response([])

        # Listar todos os produtos que possuem movimentos na safra/fazenda ou simplesmente todos os produtos cadastrados
        produtos = Produto.objects.filter(ativo=True)
        saldos = []

        for p in produtos:
            # Calcular o saldo
            entradas = EstoqueMovimento.objects.filter(
                fazenda=fazenda, safra=safra, produto=p, tipo_movimento='ENTRADA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            saidas = EstoqueMovimento.objects.filter(
                fazenda=fazenda, safra=safra, produto=p, tipo_movimento='SAIDA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            ajustes = EstoqueMovimento.objects.filter(
                fazenda=fazenda, safra=safra, produto=p, tipo_movimento='AJUSTE', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            transf_enviadas = EstoqueMovimento.objects.filter(
                origem_transferencia=fazenda, safra=safra, produto=p, tipo_movimento='TRANSFERENCIA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            transf_recebidas = EstoqueMovimento.objects.filter(
                destino_transferencia=fazenda, safra=safra, produto=p, tipo_movimento='TRANSFERENCIA', ativo=True
            ).aggregate(total=Sum('quantidade'))['total'] or 0

            saldo_final = (entradas + ajustes + transf_recebidas) - (saidas + transf_enviadas)

            # Só retorna produtos que já tiveram algum movimento ou opcionalmente todos
            if (entradas or saidas or ajustes or transf_enviadas or transf_recebidas):
                saldos.append({
                    "produto_id": p.id,
                    "produto_nome": p.nome_comercial,
                    "unidade_sigla": p.unidade.sigla,
                    "saldo": float(saldo_final),
                    "alerta_insuficiente": saldo_final < 0
                })

        return Response(saldos)


class TransferenciaAtivoViewSet(BaseTenantViewSet):
    queryset = TransferenciaAtivo.objects.all()
    serializer_class = TransferenciaAtivoSerializer

    def get_queryset(self):
        from django.db.models import Q
        return super().get_queryset().filter(
            Q(origem__in=self.request.fazendas_permitidas) | Q(destino__in=self.request.fazendas_permitidas)
        )


class LocacaoMaquinaViewSet(BaseTenantViewSet):
    queryset = LocacaoMaquina.objects.all()
    serializer_class = LocacaoMaquinaSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs

    @action(detail=True, methods=['post'])
    def encerrar(self, request, pk=None):
        from django.core.exceptions import ValidationError
        from django.utils.dateparse import parse_date
        from cadastros.services import encerrar_locacao_maquina

        locacao = self.get_object()
        try:
            locacao = encerrar_locacao_maquina(
                locacao,
                quantidade_final=request.data.get('quantidade_final'),
                valor_final=request.data.get('valor_final'),
                data_encerramento=parse_date(request.data.get('data_encerramento', '')),
                data_vencimento=parse_date(request.data.get('data_vencimento', '')),
            )
        except (ValidationError, ValueError) as exc:
            mensagem = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'detail': mensagem}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(locacao).data)

    @action(detail=True, methods=['post'])
    def prorrogar(self, request, pk=None):
        from django.core.exceptions import ValidationError
        from django.utils.dateparse import parse_date
        from cadastros.services import prorrogar_locacao_maquina

        locacao = self.get_object()
        try:
            locacao = prorrogar_locacao_maquina(
                locacao,
                nova_data_fim=parse_date(request.data.get('nova_data_fim', '')),
            )
        except (ValidationError, ValueError) as exc:
            mensagem = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'detail': mensagem}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(locacao).data)


class ManutencaoMaquinaViewSet(BaseTenantViewSet):
    queryset = ManutencaoMaquina.objects.all()
    serializer_class = ManutencaoMaquinaSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            maquina__fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)

        maquina_id = self.request.query_params.get('maquina')
        if maquina_id:
            qs = qs.filter(maquina_id=maquina_id)

        return qs

    def perform_create(self, serializer):
        if 'safra' not in serializer.validated_data and self.request.safra_ativa:
            serializer.save(safra=self.request.safra_ativa)
        else:
            serializer.save()


class FornecedorViewSet(BaseTenantViewSet):
    queryset = Fornecedor.objects.all()
    serializer_class = FornecedorSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )


