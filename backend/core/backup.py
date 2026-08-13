import json
import zipfile
import io
from django.db import transaction
from django.core import serializers
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from core.models import Proprietario, Fazenda, Safra
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Terceirizado, TurmaTerceirizada,
    Produto, EstoqueMovimento, TransferenciaAtivo, LocacaoMaquina,
    ManutencaoMaquina, Fornecedor
)
from planejamento.models import (
    PlanejamentoSafra, OrdemServicoPlanejada, OrdemServicoPlanejadaTalhao,
    ItemInsumoOSPlanejado, ParametroOperacionalOS, PlanejamentoMaoObraTerceiros,
    PlanejamentoAdubo, PlanejamentoRateio
)
from operacoes.models import (
    OrdemServico, OrdemServicoTalhao, ItemInsumoOSReal,
    ApontamentoOperacao, ApontamentoInsumo, ApontamentoMaquina,
    ApontamentoFuncionario, ApontamentoTurma, AuditoriaOrdemServico,
    GastoRateioRealizado, RateioTalhao, AbastecimentoMaquina,
    RateioOperacional
)
from financeiro.models import (
    PedidoCompra, ItemPedidoCompra, ContasAPagar,
    PedidoVenda, ContasAReceber
)

def get_backup_querysets(proprietario):
    fazendas = Fazenda.objects.filter(proprietario=proprietario)
    safras = Safra.objects.filter(fazenda__in=fazendas)
    talhoes = Talhao.objects.filter(fazenda__in=fazendas)
    estimativas = EstimativaProducaoTalhao.objects.filter(talhao__in=talhoes)
    maquinas = Maquina.objects.filter(fazenda__in=fazendas)
    custos_maquinas = CustoMensalMaquina.objects.filter(maquina__in=maquinas)
    funcionarios = Funcionario.objects.filter(fazenda__in=fazendas)
    salarios = SalarioMensal.objects.filter(funcionario__in=funcionarios)
    terceirizados = Terceirizado.objects.filter(fazenda__in=fazendas)
    turmas = TurmaTerceirizada.objects.filter(fazenda__in=fazendas)
    produtos = Produto.objects.filter(fazenda__in=fazendas)
    fornecedores = Fornecedor.objects.filter(fazenda__in=fazendas)
    movimentacoes = EstoqueMovimento.objects.filter(fazenda__in=fazendas)
    
    transferencias = TransferenciaAtivo.objects.filter(Q(origem__in=fazendas) | Q(destino__in=fazendas))
    locacoes = LocacaoMaquina.objects.filter(fazenda__in=fazendas)
    manutencoes = ManutencaoMaquina.objects.filter(maquina__in=maquinas)
    
    planejamentos = PlanejamentoSafra.objects.filter(fazenda__in=fazendas)
    ordens_planejadas = OrdemServicoPlanejada.objects.filter(planejamento__in=planejamentos)
    ordens_planejadas_talhoes = OrdemServicoPlanejadaTalhao.objects.filter(ordem_servico_planejada__in=ordens_planejadas)
    item_insumos_planejados = ItemInsumoOSPlanejado.objects.filter(ordem_servico_planejada__in=ordens_planejadas)
    parametro_operacionais = ParametroOperacionalOS.objects.filter(ordem_servico_planejada__in=ordens_planejadas)
    mao_obra_terceiros_planejada = PlanejamentoMaoObraTerceiros.objects.filter(ordem_servico_planejada__in=ordens_planejadas)
    planejamento_adubos = PlanejamentoAdubo.objects.filter(planejamento__in=planejamentos)
    planejamento_rateios = PlanejamentoRateio.objects.filter(planejamento__in=planejamentos)
    
    ordens_servico = OrdemServico.objects.filter(fazenda__in=fazendas)
    ordens_servico_talhoes = OrdemServicoTalhao.objects.filter(ordem_servico__in=ordens_servico)
    item_insumos_reais = ItemInsumoOSReal.objects.filter(ordem_servico__in=ordens_servico)
    apontamentos = ApontamentoOperacao.objects.filter(ordem_servico__in=ordens_servico)
    apontamento_insumos = ApontamentoInsumo.objects.filter(apontamento__in=apontamentos)
    apontamento_maquinas = ApontamentoMaquina.objects.filter(apontamento__in=apontamentos)
    apontamento_funcionarios = ApontamentoFuncionario.objects.filter(apontamento__in=apontamentos)
    apontamento_turmas = ApontamentoTurma.objects.filter(apontamento__in=apontamentos)
    auditorias = AuditoriaOrdemServico.objects.filter(ordem_servico__in=ordens_servico)
    
    gastos_rateio = GastoRateioRealizado.objects.filter(fazenda__in=fazendas)
    rateio_talhoes = RateioTalhao.objects.filter(gasto_rateio__in=gastos_rateio)
    abastecimentos = AbastecimentoMaquina.objects.filter(fazenda__in=fazendas)
    rateios_operacionais = RateioOperacional.objects.filter(Q(fazenda_rateio__in=fazendas) | Q(safra__fazenda__in=fazendas))
    
    pedidos_compra = PedidoCompra.objects.filter(fazenda__in=fazendas)
    item_pedidos_compra = ItemPedidoCompra.objects.filter(pedido_compra__in=pedidos_compra)
    contas_pagar = ContasAPagar.objects.filter(fazenda__in=fazendas)
    pedidos_venda = PedidoVenda.objects.filter(fazenda__in=fazendas)
    contas_receber = ContasAReceber.objects.filter(fazenda__in=fazendas)

    # Return list of querysets in dependency order
    return [
        (Proprietario, Proprietario.objects.filter(id=proprietario.id)),
        (Fazenda, fazendas),
        (Safra, safras),
        (Talhao, talhoes),
        (EstimativaProducaoTalhao, estimativas),
        (Maquina, maquinas),
        (CustoMensalMaquina, custos_maquinas),
        (Funcionario, funcionarios),
        (SalarioMensal, salarios),
        (Terceirizado, terceirizados),
        (TurmaTerceirizada, turmas),
        (Produto, produtos),
        (Fornecedor, fornecedores),
        (PedidoCompra, pedidos_compra),
        (ItemPedidoCompra, item_pedidos_compra),
        (ContasAPagar, contas_pagar),
        (PedidoVenda, pedidos_venda),
        (ContasAReceber, contas_receber),
        (EstoqueMovimento, movimentacoes),
        (TransferenciaAtivo, transferencias),
        (LocacaoMaquina, locacoes),
        (ManutencaoMaquina, manutencoes),
        (PlanejamentoSafra, planejamentos),
        (OrdemServicoPlanejada, ordens_planejadas),
        (OrdemServicoPlanejadaTalhao, ordens_planejadas_talhoes),
        (ItemInsumoOSPlanejado, item_insumos_planejados),
        (ParametroOperacionalOS, parametro_operacionais),
        (PlanejamentoMaoObraTerceiros, mao_obra_terceiros_planejada),
        (PlanejamentoAdubo, planejamento_adubos),
        (PlanejamentoRateio, planejamento_rateios),
        (OrdemServico, ordens_servico),
        (OrdemServicoTalhao, ordens_servico_talhoes),
        (ItemInsumoOSReal, item_insumos_reais),
        (ApontamentoOperacao, apontamentos),
        (ApontamentoInsumo, apontamento_insumos),
        (ApontamentoMaquina, apontamento_maquinas),
        (ApontamentoFuncionario, apontamento_funcionarios),
        (ApontamentoTurma, apontamento_turmas),
        (AuditoriaOrdemServico, auditorias),
        (GastoRateioRealizado, gastos_rateio),
        (RateioTalhao, rateio_talhoes),
        (AbastecimentoMaquina, abastecimentos),
        (RateioOperacional, rateios_operacionais)
    ]

class BackupViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get_owner(self, request):
        user = request.user
        is_super = getattr(user, 'perfil', None) and user.perfil.nivel == 1
        is_proprietario = getattr(user, 'perfil', None) and user.perfil.nivel == 2
        
        if is_proprietario:
            try:
                return Proprietario.objects.get(email__iexact=user.email)
            except Proprietario.DoesNotExist:
                raise PermissionDenied("Não foi encontrado um Proprietário associado ao seu usuário.")
        elif is_super or user.is_superuser:
            safra_id = request.headers.get('X-Safra-ID') or request.META.get('HTTP_X_SAFRA_ID')
            if safra_id:
                try:
                    safra = Safra.objects.get(id=safra_id, ativo=True)
                    return safra.fazenda.proprietario
                except Safra.DoesNotExist:
                    pass
            prop = Proprietario.objects.filter(ativo=True).first()
            if not prop:
                raise PermissionDenied("Nenhum proprietário ativo cadastrado no sistema.")
            return prop
        else:
            fazenda = user.fazendas_permitidas.filter(ativo=True).first()
            if fazenda:
                return fazenda.proprietario
            raise PermissionDenied("Seu usuário não possui fazendas vinculadas para obter o proprietário.")

    def get(self, request, *args, **kwargs):
        owner = self.get_owner(request)
        
        # 1. Update data_ultimo_backup timestamp
        owner.data_ultimo_backup = timezone.now()
        owner.save()
        
        # 2. Get all querysets
        querysets = get_backup_querysets(owner)
        
        # 3. Build flat list of all serialized objects
        all_objs = []
        for model, qs in querysets:
            all_objs.extend(list(qs))
            
        serialized_json = serializers.serialize("json", all_objs, indent=2)
        
        # Create a zip file in memory
        zip_buffer = io.BytesIO()
        owner_slug = owner.nome.lower().replace(' ', '_')
        json_filename = f"backup_{owner_slug}_{owner.id}.json"
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr(json_filename, serialized_json)
            
        # Prepare response as a downloadable zip attachment
        filename = f"backup_{owner_slug}_{owner.id}.zip"
        response = HttpResponse(zip_buffer.getvalue(), content_type="application/zip")
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def post(self, request, *args, **kwargs):
        owner = self.get_owner(request)
        
        if 'file' not in request.FILES:
            return Response({"error": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)
            
        uploaded_file = request.FILES['file']
        
        # Determine if it's a ZIP or a raw JSON file
        if uploaded_file.name.endswith('.zip'):
            try:
                with zipfile.ZipFile(uploaded_file) as zip_file:
                    json_files = [f for f in zip_file.namelist() if f.endswith('.json')]
                    if not json_files:
                        return Response({"error": "Nenhum arquivo JSON encontrado dentro do arquivo ZIP."}, status=status.HTTP_400_BAD_REQUEST)
                    file_content = zip_file.read(json_files[0]).decode('utf-8')
            except Exception as e:
                return Response({"error": f"Falha ao ler o arquivo ZIP: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                file_content = uploaded_file.read().decode('utf-8')
            except Exception as e:
                return Response({"error": f"Falha ao ler o arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = json.loads(file_content)
        except Exception as e:
            return Response({"error": f"Conteúdo do backup inválido (não é um JSON válido): {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not isinstance(data, list):
            return Response({"error": "Formato de backup inválido. Deve ser uma lista de objetos."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                # 1. Delete all existing records for this owner in reverse dependency order
                querysets = get_backup_querysets(owner)
                for model, qs in reversed(querysets):
                    qs.delete()
                    
                # 2. Deserialise and save the uploaded objects
                # Django's deserialize will save them with their original PKs!
                for deserialized_obj in serializers.deserialize("json", file_content):
                    deserialized_obj.save()
                    
            return Response({"success": "Backup restaurado com sucesso!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Falha ao restaurar o backup: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
