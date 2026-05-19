from rest_framework import serializers
from cadastros.serializers import ProdutoSerializer
from .models import PedidoCompra, ItemPedidoCompra, ContasAPagar, PedidoVenda, ContasAReceber

class ItemPedidoCompraSerializer(serializers.ModelSerializer):
    produto_detalhe = ProdutoSerializer(source='produto', read_only=True)

    class Meta:
        model = ItemPedidoCompra
        fields = '__all__'
        read_only_fields = ['valor_total']


class PedidoCompraSerializer(serializers.ModelSerializer):
    itens = ItemPedidoCompraSerializer(many=True, read_only=True)

    class Meta:
        model = PedidoCompra
        fields = '__all__'
        read_only_fields = ['valor_total']


class ContasAPagarSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContasAPagar
        fields = '__all__'


class PedidoVendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoVenda
        fields = '__all__'
        read_only_fields = ['valor_total']


class ContasAReceberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContasAReceber
        fields = '__all__'

