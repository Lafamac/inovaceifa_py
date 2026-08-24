from rest_framework import serializers
from cadastros.serializers import ProdutoSerializer
from .models import PedidoCompra, ItemPedidoCompra, ContasAPagar, PedidoVenda, ContasAReceber

class ItemPedidoCompraSerializer(serializers.ModelSerializer):
    produto_detalhe = ProdutoSerializer(source='produto', read_only=True)
    produto_nome = serializers.ReadOnlyField(source='produto.nome_comercial')
    pedido_compra = serializers.PrimaryKeyRelatedField(
        queryset=PedidoCompra.objects.all(),
        required=False
    )

    class Meta:
        model = ItemPedidoCompra
        fields = '__all__'
        read_only_fields = ['valor_total']


class PedidoCompraSerializer(serializers.ModelSerializer):
    itens = ItemPedidoCompraSerializer(many=True, required=False)
    fornecedor_nome = serializers.ReadOnlyField(source='fornecedor.nome')
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = PedidoCompra
        fields = '__all__'
        read_only_fields = ['valor_total']

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        pedido = PedidoCompra.objects.create(**validated_data)
        for item_data in itens_data:
            ItemPedidoCompra.objects.create(pedido_compra=pedido, **item_data)
        return pedido

    def update(self, instance, validated_data):
        itens_data = validated_data.pop('itens', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if itens_data is not None:
            instance.itens.all().delete()
            for item_data in itens_data:
                ItemPedidoCompra.objects.create(pedido_compra=instance, **item_data)
            
            from django.db.models import Sum
            total = instance.itens.filter(ativo=True).aggregate(total=Sum('valor_total'))['total'] or 0
            instance.valor_total = total
            instance.save()
            
        return instance


class ContasAPagarSerializer(serializers.ModelSerializer):
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = ContasAPagar
        fields = '__all__'


class PedidoVendaSerializer(serializers.ModelSerializer):
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = PedidoVenda
        fields = '__all__'
        read_only_fields = ['valor_total']


class ContasAReceberSerializer(serializers.ModelSerializer):
    safra_nome = serializers.ReadOnlyField(source='safra.nome')

    class Meta:
        model = ContasAReceber
        fields = '__all__'

