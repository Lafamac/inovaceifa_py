from rest_framework import viewsets
from referencias.models import (
    Cultura, TipoItem, StatusCultivo, TipoIrrigacao, ResistenciaFerrugem,
    StatusOrdemServico, Modalidade, TipoRateio, ContaGerencial, TipoDestinacao,
    GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida,
    AtividadeEducampo, CriterioRateio, TipoOperacao, TipoMaquina
)
from referencias.serializers import (
    CulturaSerializer, TipoItemSerializer, StatusCultivoSerializer,
    TipoIrrigacaoSerializer, ResistenciaFerrugemSerializer,
    StatusOrdemServicoSerializer, ModalidadeSerializer, TipoRateioSerializer,
    ContaGerencialSerializer, TipoDestinacaoSerializer,
    GrupoTrabalhadorSerializer, ClassificacaoProdutoSerializer,
    GrupoQuimicoSerializer, UnidadeMedidaSerializer,
    AtividadeEducampoSerializer, CriterioRateioSerializer, TipoOperacaoSerializer, TipoMaquinaSerializer
)
from referencias.permissions import IsSuperUsuarioOrReadOnly

class BaseReferenciaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperUsuarioOrReadOnly]

    def get_queryset(self):
        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        
        queryset = self.queryset
        if not (incluir_inativos or is_detail):
            queryset = queryset.filter(ativo=True)
        return queryset

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

class CulturaViewSet(BaseReferenciaViewSet):
    queryset = Cultura.objects.all()
    serializer_class = CulturaSerializer

class TipoItemViewSet(BaseReferenciaViewSet):
    queryset = TipoItem.objects.all()
    serializer_class = TipoItemSerializer

class StatusCultivoViewSet(BaseReferenciaViewSet):
    queryset = StatusCultivo.objects.all()
    serializer_class = StatusCultivoSerializer

class TipoIrrigacaoViewSet(BaseReferenciaViewSet):
    queryset = TipoIrrigacao.objects.all()
    serializer_class = TipoIrrigacaoSerializer

class ResistenciaFerrugemViewSet(BaseReferenciaViewSet):
    queryset = ResistenciaFerrugem.objects.all()
    serializer_class = ResistenciaFerrugemSerializer

class StatusOrdemServicoViewSet(BaseReferenciaViewSet):
    queryset = StatusOrdemServico.objects.all()
    serializer_class = StatusOrdemServicoSerializer

class ModalidadeViewSet(BaseReferenciaViewSet):
    queryset = Modalidade.objects.all()
    serializer_class = ModalidadeSerializer

class TipoRateioViewSet(BaseReferenciaViewSet):
    queryset = TipoRateio.objects.all()
    serializer_class = TipoRateioSerializer

class ContaGerencialViewSet(BaseReferenciaViewSet):
    queryset = ContaGerencial.objects.all()
    serializer_class = ContaGerencialSerializer

class TipoDestinacaoViewSet(BaseReferenciaViewSet):
    queryset = TipoDestinacao.objects.all()
    serializer_class = TipoDestinacaoSerializer

class GrupoTrabalhadorViewSet(BaseReferenciaViewSet):
    queryset = GrupoTrabalhador.objects.all()
    serializer_class = GrupoTrabalhadorSerializer

class ClassificacaoProdutoViewSet(BaseReferenciaViewSet):
    queryset = ClassificacaoProduto.objects.all()
    serializer_class = ClassificacaoProdutoSerializer

class GrupoQuimicoViewSet(BaseReferenciaViewSet):
    queryset = GrupoQuimico.objects.all()
    serializer_class = GrupoQuimicoSerializer

class UnidadeMedidaViewSet(BaseReferenciaViewSet):
    queryset = UnidadeMedida.objects.all()
    serializer_class = UnidadeMedidaSerializer

class AtividadeEducampoViewSet(BaseReferenciaViewSet):
    queryset = AtividadeEducampo.objects.all()
    serializer_class = AtividadeEducampoSerializer

class CriterioRateioViewSet(BaseReferenciaViewSet):
    queryset = CriterioRateio.objects.all()
    serializer_class = CriterioRateioSerializer

class TipoOperacaoViewSet(BaseReferenciaViewSet):
    queryset = TipoOperacao.objects.all()
    serializer_class = TipoOperacaoSerializer

class TipoMaquinaViewSet(BaseReferenciaViewSet):
    queryset = TipoMaquina.objects.all()
    serializer_class = TipoMaquinaSerializer
