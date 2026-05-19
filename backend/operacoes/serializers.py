from rest_framework import serializers
from cadastros.serializers import FuncionarioSerializer, MaquinaSerializer, ProdutoSerializer
from .models import (
    OrdemServico, OrdemServicoTalhao, ItemInsumoOSReal,
    ApontamentoOperacao, ApontamentoInsumo, ApontamentoMaquina,
    ApontamentoFuncionario, AuditoriaOrdemServico
)

class ApontamentoInsumoSerializer(serializers.ModelSerializer):
    produto_detalhe = ProdutoSerializer(source='produto', read_only=True)

    class Meta:
        model = ApontamentoInsumo
        fields = '__all__'

class ApontamentoMaquinaSerializer(serializers.ModelSerializer):
    maquina_detalhe = MaquinaSerializer(source='maquina', read_only=True)

    class Meta:
        model = ApontamentoMaquina
        fields = '__all__'

class ApontamentoFuncionarioSerializer(serializers.ModelSerializer):
    funcionario_detalhe = FuncionarioSerializer(source='funcionario', read_only=True)

    class Meta:
        model = ApontamentoFuncionario
        fields = '__all__'

class ApontamentoOperacaoSerializer(serializers.ModelSerializer):
    insumos = ApontamentoInsumoSerializer(many=True, read_only=True)
    maquinas = ApontamentoMaquinaSerializer(many=True, read_only=True)
    funcionarios = ApontamentoFuncionarioSerializer(many=True, read_only=True)

    class Meta:
        model = ApontamentoOperacao
        fields = '__all__'

class AuditoriaOrdemServicoSerializer(serializers.ModelSerializer):
    tipo_desvio_display = serializers.CharField(source='get_tipo_desvio_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AuditoriaOrdemServico
        fields = '__all__'

class OrdemServicoTalhaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServicoTalhao
        fields = '__all__'

class ItemInsumoOSRealSerializer(serializers.ModelSerializer):
    produto_detalhe = ProdutoSerializer(source='produto', read_only=True)

    class Meta:
        model = ItemInsumoOSReal
        fields = '__all__'

class OrdemServicoSerializer(serializers.ModelSerializer):
    talhoes = OrdemServicoTalhaoSerializer(many=True, read_only=True)
    insumos = ItemInsumoOSRealSerializer(many=True, read_only=True)
    apontamentos = ApontamentoOperacaoSerializer(many=True, read_only=True)
    auditorias = AuditoriaOrdemServicoSerializer(many=True, read_only=True)

    class Meta:
        model = OrdemServico
        fields = '__all__'
