from rest_framework import serializers
from core.models import Fazenda, Safra
from referencias.models import TipoOperacao, GrupoTrabalhador, CriterioRateio, ContaGerencial
from cadastros.models import Talhao, Produto
from cadastros.serializers import TalhaoSerializer, ProdutoSerializer
from planejamento.models import (
    PlanejamentoSafra, OrdemServicoPlanejada, OrdemServicoPlanejadaTalhao,
    ItemInsumoOSPlanejado, ParametroOperacionalOS, PlanejamentoMaoObraTerceiros,
    PlanejamentoAdubo, PlanejamentoRateio
)

class ItemInsumoOSPlanejadoSerializer(serializers.ModelSerializer):
    produto_detalhe = ProdutoSerializer(source='produto', read_only=True)
    quantidade_planejada = serializers.DecimalField(max_digits=12, decimal_places=4, required=False)

    class Meta:
        model = ItemInsumoOSPlanejado
        fields = ['id', 'produto', 'produto_detalhe', 'dose_planejada', 'quantidade_planejada']


class ParametroOperacionalOSSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametroOperacionalOS
        fields = ['id', 'velocidade_planejada', 'pressao_planejada', 'vazao_planejada', 'tipo_bico']


class PlanejamentoMaoObraTerceirosSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanejamentoMaoObraTerceiros
        fields = ['id', 'grupo_trabalhador', 'valor_planejado', 'observacao']


class OrdemServicoPlanejadaSerializer(serializers.ModelSerializer):
    insumos = ItemInsumoOSPlanejadoSerializer(many=True, required=False)
    parametros = ParametroOperacionalOSSerializer(many=True, required=False)
    mao_obra_terceiros = PlanejamentoMaoObraTerceirosSerializer(many=True, required=False)
    talhoes_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    talhoes_detalhe = serializers.SerializerMethodField(read_only=True)
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    trator_codigo = serializers.CharField(source='trator.codigo', read_only=True)
    trator_nome = serializers.CharField(source='trator.descricao', read_only=True)
    implemento_codigo = serializers.CharField(source='implemento.codigo', read_only=True)
    implemento_nome = serializers.CharField(source='implemento.descricao', read_only=True)
    terceirizado_nome = serializers.CharField(source='terceirizado.nome', read_only=True)
    turma_nome = serializers.CharField(source='turma.nome', read_only=True)

    class Meta:
        model = OrdemServicoPlanejada
        fields = [
            'id', 'planejamento', 'tipo_operacao', 'data_inicio_planejada',
            'data_fim_planejada', 'observacao', 'insumos', 'parametros',
            'mao_obra_terceiros', 'talhoes_ids', 'talhoes_detalhe',
            'funcionario', 'trator', 'implemento', 'terceirizado', 'turma',
            'funcionario_nome', 'trator_codigo', 'trator_nome', 'implemento_codigo',
            'implemento_nome', 'terceirizado_nome', 'turma_nome', 'valor_planejado_turma', 'usar_turma'
        ]

    def get_talhoes_detalhe(self, obj):
        talhoes = [pt.talhao for pt in obj.talhoes.filter(ativo=True)]
        return TalhaoSerializer(talhoes, many=True).data

    def create(self, validated_data):
        planejamento = validated_data.get('planejamento')
        if planejamento.aprovado:
            raise serializers.ValidationError("Este planejamento já está Aprovado e não pode ser editado.")

        talhoes_ids = validated_data.pop('talhoes_ids', [])
        insumos_data = validated_data.pop('insumos', [])
        parametros_data = validated_data.pop('parametros', [])
        mao_obra_data = validated_data.pop('mao_obra_terceiros', [])

        os_planejada = OrdemServicoPlanejada.objects.create(**validated_data)

        # 1. Vincular talões
        for t_id in talhoes_ids:
            try:
                talhao = Talhao.objects.get(id=t_id, ativo=True)
                OrdemServicoPlanejadaTalhao.objects.create(
                    ordem_servico_planejada=os_planejada,
                    talhao=talhao
                )
            except Talhao.DoesNotExist:
                pass

        # 2. Criar insumos
        total_area = sum(pt.talhao.area for pt in os_planejada.talhoes.filter(ativo=True))
        for insumo in insumos_data:
            qty = insumo.get('quantidade_planejada')
            if qty is None or qty <= 0:
                qty = insumo.get('dose_planejada') * total_area
            ItemInsumoOSPlanejado.objects.create(
                ordem_servico_planejada=os_planejada,
                produto=insumo.get('produto'),
                dose_planejada=insumo.get('dose_planejada'),
                quantidade_planejada=qty
            )

        # 3. Criar parâmetros
        for p in parametros_data:
            ParametroOperacionalOS.objects.create(ordem_servico_planejada=os_planejada, **p)

        # 4. Criar mão de obra
        for mo in mao_obra_data:
            PlanejamentoMaoObraTerceiros.objects.create(ordem_servico_planejada=os_planejada, **mo)

        return os_planejada

    def update(self, instance, validated_data):
        if instance.planejamento.aprovado:
            raise serializers.ValidationError("Este planejamento já está Aprovado e não pode ser editado.")

        talhoes_ids = validated_data.pop('talhoes_ids', None)
        insumos_data = validated_data.pop('insumos', None)
        
        instance.tipo_operacao = validated_data.get('tipo_operacao', instance.tipo_operacao)
        instance.data_inicio_planejada = validated_data.get('data_inicio_planejada', instance.data_inicio_planejada)
        instance.data_fim_planejada = validated_data.get('data_fim_planejada', instance.data_fim_planejada)
        instance.observacao = validated_data.get('observacao', instance.observacao)
        instance.funcionario = validated_data.get('funcionario', instance.funcionario)
        instance.trator = validated_data.get('trator', instance.trator)
        instance.implemento = validated_data.get('implemento', instance.implemento)
        instance.terceirizado = validated_data.get('terceirizado', instance.terceirizado)
        instance.turma = validated_data.get('turma', instance.turma)
        instance.valor_planejado_turma = validated_data.get('valor_planejado_turma', instance.valor_planejado_turma)
        instance.usar_turma = validated_data.get('usar_turma', instance.usar_turma)
        instance.save()

        if talhoes_ids is not None:
            instance.talhoes.all().delete()
            for t_id in talhoes_ids:
                try:
                    talhao = Talhao.objects.get(id=t_id, ativo=True)
                    OrdemServicoPlanejadaTalhao.objects.create(
                        ordem_servico_planejada=instance,
                        talhao=talhao
                    )
                except Talhao.DoesNotExist:
                    pass

        if insumos_data is not None:
            instance.insumos.all().delete()
            total_area = sum(pt.talhao.area for pt in instance.talhoes.filter(ativo=True))
            for insumo in insumos_data:
                qty = insumo.get('quantidade_planejada')
                if qty is None or qty <= 0:
                    qty = insumo.get('dose_planejada') * total_area
                ItemInsumoOSPlanejado.objects.create(
                    ordem_servico_planejada=instance,
                    produto=insumo.get('produto'),
                    dose_planejada=insumo.get('dose_planejada'),
                    quantidade_planejada=qty
                )

        return instance

    def validate(self, attrs):
        data_inicio = attrs.get('data_inicio_planejada')
        data_fim = attrs.get('data_fim_planejada')

        if data_inicio is None and self.instance:
            data_inicio = self.instance.data_inicio_planejada
        if data_fim is None and self.instance:
            data_fim = self.instance.data_fim_planejada

        if data_inicio and data_fim and data_fim < data_inicio:
            raise serializers.ValidationError({
                "data_fim_planejada": "A data do término planejado não pode ser menor que a data de início planejado."
            })

        valor_turma = attrs.get('valor_planejado_turma')
        if valor_turma is not None and valor_turma < 0:
            raise serializers.ValidationError({
                "valor_planejado_turma": "O valor planejado para a turma não pode ser negativo."
            })

        return attrs



class PlanejamentoAduboSerializer(serializers.ModelSerializer):
    quantidade_planejada = serializers.DecimalField(max_digits=12, decimal_places=4, required=False)

    class Meta:
        model = PlanejamentoAdubo
        fields = [
            'id', 'planejamento', 'talhao', 'produto', 'cobertura',
            'data_planejada', 'dose_planejada', 'quantidade_planejada'
        ]

    def create(self, validated_data):
        planejamento = validated_data.get('planejamento')
        if planejamento.aprovado:
            raise serializers.ValidationError("Este planejamento já está Aprovado e não pode ser editado.")

        qty = validated_data.get('quantidade_planejada')
        talhao = validated_data.get('talhao')
        if qty is None or qty <= 0:
            qty = validated_data.get('dose_planejada') * talhao.area
            validated_data['quantidade_planejada'] = qty

        return super().create(validated_data)


class PlanejamentoRateioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanejamentoRateio
        fields = ['id', 'planejamento', 'criterio_rateio', 'conta_gerencial', 'valor_planejado', 'observacao']

    def create(self, validated_data):
        planejamento = validated_data.get('planejamento')
        if planejamento.aprovado:
            raise serializers.ValidationError("Este planejamento já está Aprovado e não pode ser editado.")
        return super().create(validated_data)


class PlanejamentoSafraSerializer(serializers.ModelSerializer):
    ordens_servico = OrdemServicoPlanejadaSerializer(many=True, read_only=True)
    adubacoes = PlanejamentoAduboSerializer(many=True, read_only=True)
    rateios = PlanejamentoRateioSerializer(many=True, read_only=True)

    class Meta:
        model = PlanejamentoSafra
        fields = [
            'id', 'fazenda', 'safra', 'descricao', 'aprovado',
            'data_planejamento', 'observacao', 'ordens_servico',
            'adubacoes', 'rateios'
        ]

    def update(self, instance, validated_data):
        if instance.aprovado:
            raise serializers.ValidationError("Este planejamento já está Aprovado e não pode ser editado.")
        return super().update(instance, validated_data)
