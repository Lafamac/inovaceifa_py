from rest_framework import serializers
from cadastros.models import (
    Talhao, EstimativaProducaoTalhao, Maquina, CustoMensalMaquina,
    Funcionario, SalarioMensal, Terceirizado, TurmaTerceirizada,
    Produto, EstoqueMovimento
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

    class Meta:
        model = EstoqueMovimento
        fields = '__all__'
