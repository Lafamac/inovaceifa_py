from rest_framework import serializers
from core.models import Fazenda, Safra
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Terceirizado, TurmaTerceirizada,
    Produto, EstoqueMovimento, TransferenciaAtivo, LocacaoMaquina,
    ManutencaoMaquina
)

class EstimativaProducaoTalhaoSerializer(serializers.ModelSerializer):
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = EstimativaProducaoTalhao
        fields = '__all__'


class TalhaoSerializer(serializers.ModelSerializer):
    tipo_irrigacao_nome = serializers.ReadOnlyField(source='tipo_irrigacao.nome')
    cultura_nome = serializers.ReadOnlyField(source='cultura.nome')
    resistencia_ferrugem_nome = serializers.ReadOnlyField(source='resistencia_ferrugem.nome')
    status_cultivo_nome = serializers.ReadOnlyField(source='status_cultivo.nome')
    estimativas = EstimativaProducaoTalhaoSerializer(many=True, read_only=True)

    class Meta:
        model = Talhao
        fields = '__all__'


class CustoMensalMaquinaSerializer(serializers.ModelSerializer):
    maquina_codigo = serializers.ReadOnlyField(source='maquina.codigo')
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = CustoMensalMaquina
        fields = '__all__'


class MaquinaSerializer(serializers.ModelSerializer):
    tipo_nome = serializers.ReadOnlyField(source='tipo.nome')
    custos_mensais = CustoMensalMaquinaSerializer(many=True, read_only=True)

    class Meta:
        model = Maquina
        fields = '__all__'


class SalarioMensalSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.ReadOnlyField(source='funcionario.nome')
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = SalarioMensal
        fields = '__all__'


class FuncionarioSerializer(serializers.ModelSerializer):
    grupo_trabalhador_nome = serializers.ReadOnlyField(source='grupo_trabalhador.nome')
    salarios = SalarioMensalSerializer(many=True, read_only=True)

    class Meta:
        model = Funcionario
        fields = '__all__'


class TerceirizadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Terceirizado
        fields = '__all__'


class TurmaTerceirizadaSerializer(serializers.ModelSerializer):
    integrantes_detalhe = TerceirizadoSerializer(many=True, read_only=True, source='integrantes')

    class Meta:
        model = TurmaTerceirizada
        fields = '__all__'


class ProdutoSerializer(serializers.ModelSerializer):
    unidade_nome = serializers.ReadOnlyField(source='unidade.nome')
    unidade_sigla = serializers.ReadOnlyField(source='unidade.sigla')
    classificacao_nome = serializers.ReadOnlyField(source='classificacao.nome')
    grupo_quimico_nome = serializers.ReadOnlyField(source='grupo_quimico.nome')

    class Meta:
        model = Produto
        fields = '__all__'


class EstoqueMovimentoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.ReadOnlyField(source='produto.nome_comercial')
    produto_unidade_sigla = serializers.ReadOnlyField(source='produto.unidade.sigla')
    fazenda_nome = serializers.ReadOnlyField(source='fazenda.nome')
    fazenda_sigla = serializers.ReadOnlyField(source='fazenda.sigla')
    origem_transferencia_nome = serializers.ReadOnlyField(source='origem_transferencia.nome')
    destino_transferencia_nome = serializers.ReadOnlyField(source='destino_transferencia.nome')

    fazenda = serializers.PrimaryKeyRelatedField(queryset=Fazenda.objects.all(), required=False)
    safra = serializers.PrimaryKeyRelatedField(queryset=Safra.objects.all(), required=False)

    class Meta:
        model = EstoqueMovimento
        fields = '__all__'

    def validate(self, attrs):
        tipo = attrs.get('tipo_movimento')
        
        if tipo == 'TRANSFERENCIA':
            origem = attrs.get('origem_transferencia')
            destino = attrs.get('destino_transferencia')
            if not origem or not destino:
                raise serializers.ValidationError("Transferência exige fazenda de origem e destino.")
            if origem == destino:
                raise serializers.ValidationError("As fazendas de origem e destino devem ser diferentes.")
            if origem.proprietario != destino.proprietario:
                raise serializers.ValidationError("As fazendas devem pertencer ao mesmo proprietário.")
            
            # Auto-populate fazenda for origin (outflow) record
            attrs['fazenda'] = origem
            
            # If safra is not provided, populate it from request context or origin farm
            if not attrs.get('safra'):
                request = self.context.get('request')
                if request and getattr(request, 'safra_ativa', None):
                    attrs['safra'] = request.safra_ativa
                else:
                    safra_origem = Safra.objects.filter(fazenda=origem, ativa=True, ativo=True).first()
                    if not safra_origem:
                        raise serializers.ValidationError("A fazenda de origem não possui uma safra ativa.")
                    attrs['safra'] = safra_origem
        else:
            if not attrs.get('fazenda'):
                raise serializers.ValidationError({"fazenda": "Este campo é obrigatório."})
            if not attrs.get('safra'):
                raise serializers.ValidationError({"safra": "Este campo é obrigatório."})
                
        return attrs


class TransferenciaAtivoSerializer(serializers.ModelSerializer):
    maquina_codigo = serializers.ReadOnlyField(source='maquina.codigo')
    maquina_descricao = serializers.ReadOnlyField(source='maquina.descricao')
    funcionario_nome = serializers.ReadOnlyField(source='funcionario.nome')
    origem_nome = serializers.ReadOnlyField(source='origem.nome')
    destino_nome = serializers.ReadOnlyField(source='destino.nome')

    class Meta:
        model = TransferenciaAtivo
        fields = '__all__'


class LocacaoMaquinaSerializer(serializers.ModelSerializer):
    maquina_codigo = serializers.ReadOnlyField(source='maquina.codigo')
    maquina_descricao = serializers.ReadOnlyField(source='maquina.descricao')
    safra_nome = serializers.ReadOnlyField(source='safra.nome')
    fazenda_nome = serializers.ReadOnlyField(source='fazenda.nome')

    class Meta:
        model = LocacaoMaquina
        fields = '__all__'


class ManutencaoMaquinaSerializer(serializers.ModelSerializer):
    maquina_codigo = serializers.ReadOnlyField(source='maquina.codigo')
    maquina_descricao = serializers.ReadOnlyField(source='maquina.descricao')
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = ManutencaoMaquina
        fields = '__all__'

