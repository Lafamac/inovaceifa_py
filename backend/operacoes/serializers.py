from rest_framework import serializers
from cadastros.models import Talhao
from cadastros.serializers import FuncionarioSerializer, MaquinaSerializer, ProdutoSerializer, TalhaoSerializer, TurmaTerceirizadaSerializer
from .models import (
    OrdemServico, OrdemServicoTalhao, ItemInsumoOSReal,
    ApontamentoOperacao, ApontamentoInsumo, ApontamentoMaquina,
    ApontamentoFuncionario, AuditoriaOrdemServico,
    GastoRateioRealizado, RateioTalhao, AbastecimentoMaquina,
    RateioOperacional, ApontamentoTurma
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

class ApontamentoTurmaSerializer(serializers.ModelSerializer):
    turma_detalhe = TurmaTerceirizadaSerializer(source='turma', read_only=True)

    class Meta:
        model = ApontamentoTurma
        fields = '__all__'

class ApontamentoOperacaoSerializer(serializers.ModelSerializer):
    insumos = ApontamentoInsumoSerializer(many=True, read_only=True)
    maquinas = ApontamentoMaquinaSerializer(many=True, read_only=True)
    funcionarios = ApontamentoFuncionarioSerializer(many=True, read_only=True)
    turmas = ApontamentoTurmaSerializer(many=True, read_only=True)

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


class RateioTalhaoSerializer(serializers.ModelSerializer):
    talhao_codigo = serializers.CharField(source='talhao.codigo', read_only=True)
    talhao_nome = serializers.CharField(source='talhao.nome', read_only=True)

    class Meta:
        model = RateioTalhao
        fields = '__all__'


class GastoRateioRealizadoSerializer(serializers.ModelSerializer):
    criterio_rateio_nome = serializers.CharField(source='criterio_rateio.nome', read_only=True)
    conta_gerencial_nome = serializers.CharField(source='conta_gerencial.nome', read_only=True)
    rateios_talhoes = RateioTalhaoSerializer(many=True, read_only=True)
    talhoes_dados = serializers.JSONField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = GastoRateioRealizado
        fields = [
            'id', 'fazenda', 'safra', 'criterio_rateio', 'criterio_rateio_nome',
            'conta_gerencial', 'conta_gerencial_nome', 'valor', 'data_gasto',
            'observacao', 'rateios_talhoes', 'talhoes_dados', 'ativo',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        talhoes_dados = validated_data.pop('talhoes_dados', None)
        gasto = GastoRateioRealizado.objects.create(**validated_data)
        from .services import calcular_e_salvar_rateio_realizado
        calcular_e_salvar_rateio_realizado(gasto, dados_talhoes=talhoes_dados)
        return gasto

    def update(self, instance, validated_data):
        talhoes_dados = validated_data.pop('talhoes_dados', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        from .services import calcular_e_salvar_rateio_realizado
        calcular_e_salvar_rateio_realizado(instance, dados_talhoes=talhoes_dados)
        return instance


class AbastecimentoMaquinaSerializer(serializers.ModelSerializer):
    maquina_codigo = serializers.CharField(source='maquina.codigo', read_only=True)
    maquina_descricao = serializers.CharField(source='maquina.descricao', read_only=True)
    combustivel_nome = serializers.CharField(source='combustivel.nome_comercial', read_only=True)

    class Meta:
        model = AbastecimentoMaquina
        fields = '__all__'


class RateioOperacionalSerializer(serializers.ModelSerializer):
    fazenda_rateio_nome = serializers.CharField(source='fazenda_rateio.nome', read_only=True, allow_null=True)
    atividade_educampo_nome = serializers.CharField(source='atividade_educampo.nome', read_only=True)
    funcionario_plan_nome = serializers.CharField(source='funcionario_plan.nome', read_only=True, allow_null=True)
    funcionario_real_nome = serializers.CharField(source='funcionario_real.nome', read_only=True, allow_null=True)
    trator_plan_codigo = serializers.CharField(source='trator_plan.codigo', read_only=True, allow_null=True)
    trator_real_codigo = serializers.CharField(source='trator_real.codigo', read_only=True, allow_null=True)
    implemento_plan_codigo = serializers.CharField(source='implemento_plan.codigo', read_only=True, allow_null=True)
    implemento_real_codigo = serializers.CharField(source='implemento_real.codigo', read_only=True, allow_null=True)
    combustivel_plan_nome = serializers.CharField(source='combustivel_plan.nome_comercial', read_only=True, allow_null=True)
    combustivel_real_nome = serializers.CharField(source='combustivel_real.nome_comercial', read_only=True, allow_null=True)

    class Meta:
        model = RateioOperacional
        fields = '__all__'


