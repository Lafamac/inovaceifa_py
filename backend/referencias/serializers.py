from rest_framework import serializers
from referencias.models import (
    Cultura, TipoItem, StatusCultivo, TipoIrrigacao, ResistenciaFerrugem,
    StatusOrdemServico, Modalidade, TipoRateio, ContaGerencial, TipoDestinacao,
    GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida,
    AtividadeEducampo, CriterioRateio, TipoOperacao, TipoMaquina, EncargoFolha
)

class CulturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cultura
        fields = '__all__'

class TipoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoItem
        fields = '__all__'

class StatusCultivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusCultivo
        fields = '__all__'

class TipoIrrigacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoIrrigacao
        fields = '__all__'

class ResistenciaFerrugemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResistenciaFerrugem
        fields = '__all__'

class StatusOrdemServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusOrdemServico
        fields = '__all__'

class ModalidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modalidade
        fields = '__all__'

class TipoRateioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoRateio
        fields = '__all__'

class ContaGerencialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContaGerencial
        fields = '__all__'

class TipoDestinacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDestinacao
        fields = '__all__'

class GrupoTrabalhadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrupoTrabalhador
        fields = '__all__'

class ClassificacaoProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassificacaoProduto
        fields = '__all__'

class GrupoQuimicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrupoQuimico
        fields = '__all__'

class UnidadeMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadeMedida
        fields = '__all__'

class AtividadeEducampoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtividadeEducampo
        fields = '__all__'

class CriterioRateioSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriterioRateio
        fields = '__all__'

class TipoOperacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoOperacao
        fields = '__all__'

class TipoMaquinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMaquina
        fields = '__all__'

class EncargoFolhaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncargoFolha
        fields = '__all__'
