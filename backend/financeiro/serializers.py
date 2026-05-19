from rest_framework import serializers
from cadastros.serializers import ProdutoSerializer
from .models import PedidoCompra, ItemPedidoCompra, ContasAPagar

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
