from django.db import models
from core.models import BaseModel, Fazenda, Safra
from cadastros.models import Produto

class PedidoCompra(BaseModel):
    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('APROVADO', 'Aprovado'),
        ('RECEBIDO', 'Recebido'),
        ('CANCELADO', 'Cancelado'),
    ]

    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='pedidos_compra')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='pedidos_compra')
    fornecedor = models.CharField(max_length=255)
    data_pedido = models.DateField()
    valor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='RASCUNHO')

    class Meta:
        verbose_name = "Pedido de Compra"
        verbose_name_plural = "Pedidos de Compra"

    def __str__(self):
        return f"Pedido {self.id} - {self.fornecedor} ({self.status})"


class ItemPedidoCompra(BaseModel):
    pedido_compra = models.ForeignKey(PedidoCompra, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.DecimalField(max_digits=12, decimal_places=4)
    valor_unitario = models.DecimalField(max_digits=12, decimal_places=4)
    valor_total = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        verbose_name = "Item do Pedido de Compra"
        verbose_name_plural = "Itens do Pedido de Compra"

    def save(self, *args, **kwargs):
        self.valor_total = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)
        # Atualizar o valor total do pedido pai
        total = self.pedido_compra.itens.filter(ativo=True).aggregate(total=models.Sum('valor_total'))['total'] or 0
        self.pedido_compra.valor_total = total
        self.pedido_compra.save()

    def __str__(self):
        return f"{self.quantidade} {self.produto.nome_comercial} no Pedido {self.pedido_compra.id}"


class ContasAPagar(BaseModel):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('CANCELADO', 'Cancelado'),
    ]

    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='contas_a_pagar')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='contas_a_pagar')
    pedido_compra = models.ForeignKey(PedidoCompra, on_delete=models.SET_NULL, null=True, blank=True, related_name='contas_a_pagar')
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDENTE')

    class Meta:
        verbose_name = "Contas a Pagar"
        verbose_name_plural = "Contas a Pagar"

    def __str__(self):
        return f"Contas a Pagar: {self.descricao} - R$ {self.valor} ({self.status})"


class PedidoVenda(BaseModel):
    TIPO_PRODUTO_CHOICES = [
        ('CAFE', 'Café'),
        ('CEREAIS', 'Cereais'),
        ('SUCATA', 'Sucata'),
        ('OUTROS', 'Outros'),
    ]

    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('CONFIRMADO', 'Confirmado'),
        ('ENTREGUE', 'Entregue'),
        ('CANCELADO', 'Cancelado'),
    ]

    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='pedidos_venda')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='pedidos_venda')
    cliente = models.CharField(max_length=255)
    data_venda = models.DateField()
    tipo_produto = models.CharField(max_length=50, choices=TIPO_PRODUTO_CHOICES)
    quantidade_sacas = models.DecimalField(max_digits=12, decimal_places=2)
    preco_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    valor_total = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='RASCUNHO')

    class Meta:
        verbose_name = "Pedido de Venda"
        verbose_name_plural = "Pedidos de Venda"

    def save(self, *args, **kwargs):
        self.valor_total = self.quantidade_sacas * self.preco_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Venda {self.id} - {self.cliente} ({self.status})"


class ContasAReceber(BaseModel):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('RECEBIDO', 'Recebido'),
        ('CANCELADO', 'Cancelado'),
    ]

    CATEGORIA_RECEITA_CHOICES = [
        ('VENDA_CAFE', 'Venda Café'),
        ('CEREAIS', 'Cereais'),
        ('SUCATA', 'Sucata'),
        ('CUSTEIO_AGRICOLA', 'Custeio Agrícola'),
        ('OUTROS', 'Outros'),
    ]

    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='contas_a_receber')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='contas_a_receber')
    pedido_venda = models.ForeignKey(PedidoVenda, on_delete=models.SET_NULL, null=True, blank=True, related_name='contas_a_receber')
    descricao = models.CharField(max_length=255)
    categoria_receita = models.CharField(max_length=50, choices=CATEGORIA_RECEITA_CHOICES)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data_vencimento = models.DateField()
    data_recebimento = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDENTE')

    class Meta:
        verbose_name = "Contas a Receber"
        verbose_name_plural = "Contas a Receber"

    def __str__(self):
        return f"Contas a Receber: {self.descricao} - R$ {self.valor} ({self.status})"

