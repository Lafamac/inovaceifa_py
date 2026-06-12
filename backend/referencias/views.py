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

class CulturaViewSet(viewsets.ModelViewSet):
    queryset = Cultura.objects.filter(ativo=True)
    serializer_class = CulturaSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class TipoItemViewSet(viewsets.ModelViewSet):
    queryset = TipoItem.objects.filter(ativo=True)
    serializer_class = TipoItemSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class StatusCultivoViewSet(viewsets.ModelViewSet):
    queryset = StatusCultivo.objects.filter(ativo=True)
    serializer_class = StatusCultivoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class TipoIrrigacaoViewSet(viewsets.ModelViewSet):
    queryset = TipoIrrigacao.objects.filter(ativo=True)
    serializer_class = TipoIrrigacaoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class ResistenciaFerrugemViewSet(viewsets.ModelViewSet):
    queryset = ResistenciaFerrugem.objects.filter(ativo=True)
    serializer_class = ResistenciaFerrugemSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class StatusOrdemServicoViewSet(viewsets.ModelViewSet):
    queryset = StatusOrdemServico.objects.filter(ativo=True)
    serializer_class = StatusOrdemServicoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class ModalidadeViewSet(viewsets.ModelViewSet):
    queryset = Modalidade.objects.filter(ativo=True)
    serializer_class = ModalidadeSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class TipoRateioViewSet(viewsets.ModelViewSet):
    queryset = TipoRateio.objects.filter(ativo=True)
    serializer_class = TipoRateioSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class ContaGerencialViewSet(viewsets.ModelViewSet):
    queryset = ContaGerencial.objects.filter(ativo=True)
    serializer_class = ContaGerencialSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class TipoDestinacaoViewSet(viewsets.ModelViewSet):
    queryset = TipoDestinacao.objects.filter(ativo=True)
    serializer_class = TipoDestinacaoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class GrupoTrabalhadorViewSet(viewsets.ModelViewSet):
    queryset = GrupoTrabalhador.objects.filter(ativo=True)
    serializer_class = GrupoTrabalhadorSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class ClassificacaoProdutoViewSet(viewsets.ModelViewSet):
    queryset = ClassificacaoProduto.objects.filter(ativo=True)
    serializer_class = ClassificacaoProdutoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class GrupoQuimicoViewSet(viewsets.ModelViewSet):
    queryset = GrupoQuimico.objects.filter(ativo=True)
    serializer_class = GrupoQuimicoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class UnidadeMedidaViewSet(viewsets.ModelViewSet):
    queryset = UnidadeMedida.objects.filter(ativo=True)
    serializer_class = UnidadeMedidaSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class AtividadeEducampoViewSet(viewsets.ModelViewSet):
    queryset = AtividadeEducampo.objects.filter(ativo=True)
    serializer_class = AtividadeEducampoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class CriterioRateioViewSet(viewsets.ModelViewSet):
    queryset = CriterioRateio.objects.filter(ativo=True)
    serializer_class = CriterioRateioSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class TipoOperacaoViewSet(viewsets.ModelViewSet):
    queryset = TipoOperacao.objects.filter(ativo=True)
    serializer_class = TipoOperacaoSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]

class TipoMaquinaViewSet(viewsets.ModelViewSet):
    queryset = TipoMaquina.objects.filter(ativo=True)
    serializer_class = TipoMaquinaSerializer
    permission_classes = [IsSuperUsuarioOrReadOnly]
