from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    OrdemServico, ApontamentoOperacao, ApontamentoInsumo,
    ApontamentoMaquina, ApontamentoFuncionario, AuditoriaOrdemServico
)
from .serializers import (
    OrdemServicoSerializer, ApontamentoOperacaoSerializer,
    ApontamentoInsumoSerializer, ApontamentoMaquinaSerializer,
    ApontamentoFuncionarioSerializer, AuditoriaOrdemServicoSerializer
)
from planejamento.views import BaseTenantPlanejamentoViewSet

class OrdemServicoViewSet(BaseTenantPlanejamentoViewSet):
    queryset = OrdemServico.objects.all()
    serializer_class = OrdemServicoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar(self, request, pk=None):
        os = self.get_object()
        if os.status != 'APROVADA':
            return Response({"detail": "OS deve estar aprovada para iniciar."}, status=400)
        os.status = 'EM_EXECUCAO'
        os.save()
        return Response({"status": "Em execução", "id": os.id})

    @action(detail=True, methods=['post'], url_path='concluir')
    def concluir(self, request, pk=None):
        os = self.get_object()
        if os.status != 'EM_EXECUCAO':
            return Response({"detail": "OS deve estar em execução para concluir."}, status=400)
        os.status = 'CONCLUIDA'
        os.save()
        
        # Trigger Auditoria here!
        self._gerar_auditoria(os)

        # Atualizar o estoque com as saídas reais executadas
        from cadastros.models import EstoqueMovimento
        import datetime
        
        # Garantir idempotência: remove saídas anteriores para esta OS
        EstoqueMovimento.objects.filter(
            documento_referencia=f"OS #{os.id}",
            tipo_movimento='SAIDA'
        ).delete()
        
        executado = {}
        for apontamento in os.apontamentos.all():
            for insumo in apontamento.insumos.all():
                executado[insumo.produto.id] = executado.get(insumo.produto.id, 0) + insumo.quantidade_total
        
        data_mov = os.data_fim_real or os.data_fim_planejada or datetime.date.today()
        
        for prod_id, qtd_exec in executado.items():
            if qtd_exec > 0:
                EstoqueMovimento.objects.create(
                    fazenda=os.fazenda,
                    safra=os.safra,
                    produto_id=prod_id,
                    tipo_movimento='SAIDA',
                    quantidade=qtd_exec,
                    data_movimento=data_mov,
                    documento_referencia=f"OS #{os.id}",
                    observacao=f"Saída automática pelo encerramento da OS #{os.id}."
                )
        
        return Response({"status": "Concluída", "id": os.id})

    def _gerar_auditoria(self, os):
        planejado = {item.produto.id: item.quantidade_planejada for item in os.insumos.all()}
        executado = {}
        for apontamento in os.apontamentos.all():
            for insumo in apontamento.insumos.all():
                executado[insumo.produto.id] = executado.get(insumo.produto.id, 0) + insumo.quantidade_total
        
        for prod_id, qtd_exec in executado.items():
            if prod_id not in planejado:
                AuditoriaOrdemServico.objects.create(
                    ordem_servico=os,
                    tipo_desvio='PRODUTO_NAO_PLANEJADO',
                    descricao_desvio=f"Produto não estava na OS."
                )

        for prod_id, qtd_plan in planejado.items():
            qtd_exec = executado.get(prod_id, 0)
            if qtd_plan and qtd_exec > qtd_plan:
                AuditoriaOrdemServico.objects.create(
                    ordem_servico=os,
                    tipo_desvio='SUPERDOSE',
                    descricao_desvio=f"Uso {qtd_exec} vs {qtd_plan} planejado."
                )
            elif qtd_plan and qtd_exec < qtd_plan:
                AuditoriaOrdemServico.objects.create(
                    ordem_servico=os,
                    tipo_desvio='SUBDOSE',
                    descricao_desvio=f"Uso {qtd_exec} vs {qtd_plan} planejado."
                )

class ApontamentoOperacaoViewSet(BaseTenantPlanejamentoViewSet):
    queryset = ApontamentoOperacao.objects.all()
    serializer_class = ApontamentoOperacaoSerializer
    permission_classes = [IsAuthenticated]

class ApontamentoInsumoViewSet(BaseTenantPlanejamentoViewSet):
    queryset = ApontamentoInsumo.objects.all()
    serializer_class = ApontamentoInsumoSerializer
    permission_classes = [IsAuthenticated]

class ApontamentoMaquinaViewSet(BaseTenantPlanejamentoViewSet):
    queryset = ApontamentoMaquina.objects.all()
    serializer_class = ApontamentoMaquinaSerializer
    permission_classes = [IsAuthenticated]

class ApontamentoFuncionarioViewSet(BaseTenantPlanejamentoViewSet):
    queryset = ApontamentoFuncionario.objects.all()
    serializer_class = ApontamentoFuncionarioSerializer
    permission_classes = [IsAuthenticated]

class AuditoriaOrdemServicoViewSet(BaseTenantPlanejamentoViewSet):
    queryset = AuditoriaOrdemServico.objects.all()
    serializer_class = AuditoriaOrdemServicoSerializer
    permission_classes = [IsAuthenticated]
