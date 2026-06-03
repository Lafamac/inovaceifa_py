from rest_framework import serializers
from cadastros.models import Talhao
from cadastros.serializers import FuncionarioSerializer, MaquinaSerializer, ProdutoSerializer, TalhaoSerializer
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
    tipo_operacao_nome = serializers.CharField(source='tipo_operacao.nome', read_only=True)
    talhoes_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    talhoes_detalhe = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'fazenda', 'safra', 'tipo_operacao', 'tipo_operacao_nome', 'data_inicio_real',
            'data_fim_real', 'data_inicio_planejada', 'data_fim_planejada',
            'status', 'observacao', 'origem_planejada', 'talhoes', 'insumos',
            'apontamentos', 'auditorias', 'talhoes_ids', 'talhoes_detalhe',
            'ativo', 'created_at', 'updated_at'
        ]

    def get_talhoes_detalhe(self, obj):
        talhoes = [pt.talhao for pt in obj.talhoes.filter(ativo=True)]
        return TalhaoSerializer(talhoes, many=True).data

    def create(self, validated_data):
        talhoes_ids = validated_data.pop('talhoes_ids', [])
        os_real = OrdemServico.objects.create(**validated_data)
        
        for t_id in talhoes_ids:
            try:
                talhao = Talhao.objects.get(id=t_id, ativo=True)
                OrdemServicoTalhao.objects.create(
                    ordem_servico=os_real,
                    talhao=talhao
                )
            except Talhao.DoesNotExist:
                pass
        return os_real

    def update(self, instance, validated_data):
        talhoes_ids = validated_data.pop('talhoes_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if talhoes_ids is not None:
            instance.talhoes.all().delete()
            for t_id in talhoes_ids:
                try:
                    talhao = Talhao.objects.get(id=t_id, ativo=True)
                    OrdemServicoTalhao.objects.create(
                        ordem_servico=instance,
                        talhao=talhao
                    )
                except Talhao.DoesNotExist:
                    pass
        return instance
