from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from core.models import Safra
from cadastros.models import EstoqueMovimento
from financeiro.models import PedidoCompra, ItemPedidoCompra
from planejamento.models import ItemInsumoOSPlanejado, OrdemServicoPlanejada, PlanejamentoSafra
from planejamento.services import atualizar_pedido_compra_planejamento

@receiver(post_save, sender=ItemInsumoOSPlanejado)
@receiver(post_delete, sender=ItemInsumoOSPlanejado)
def insumo_planejado_changed(sender, instance, **kwargs):
    if instance.ordem_servico_planejada and instance.ordem_servico_planejada.planejamento:
        atualizar_pedido_compra_planejamento(
            instance.ordem_servico_planejada.planejamento.fazenda,
            instance.ordem_servico_planejada.planejamento.safra
        )

@receiver(post_save, sender=OrdemServicoPlanejada)
@receiver(post_delete, sender=OrdemServicoPlanejada)
def os_planejada_changed(sender, instance, **kwargs):
    # Se a OS planejada foi inativada (soft delete), inativa também os insumos dela
    if not getattr(instance, 'ativo', True):
        instance.insumos.filter(ativo=True).update(ativo=False)

    if instance.planejamento:
        atualizar_pedido_compra_planejamento(
            instance.planejamento.fazenda,
            instance.planejamento.safra
        )

@receiver(post_save, sender=PlanejamentoSafra)
@receiver(post_delete, sender=PlanejamentoSafra)
def planejamento_safra_changed(sender, instance, **kwargs):
    # Se o planejamento foi inativado, inativa recursivamente as OSs planejadas relacionadas
    if not getattr(instance, 'ativo', True):
        for os in instance.ordens_servico.filter(ativo=True):
            os.ativo = False
            os.save()  # Isso disparará o signal os_planejada_changed para inativar os insumos dela
            
    atualizar_pedido_compra_planejamento(instance.fazenda, instance.safra)

@receiver(post_save, sender=EstoqueMovimento)
@receiver(post_delete, sender=EstoqueMovimento)
def estoque_movimento_changed(sender, instance, **kwargs):
    if instance.tipo_movimento == 'TRANSFERENCIA':
        if instance.origem_transferencia:
            atualizar_pedido_compra_planejamento(instance.origem_transferencia, instance.safra)
        if instance.destino_transferencia:
            safra_dest = Safra.objects.filter(fazenda=instance.destino_transferencia, ativa=True, ativo=True).first()
            if safra_dest:
                atualizar_pedido_compra_planejamento(instance.destino_transferencia, safra_dest)
    else:
        atualizar_pedido_compra_planejamento(instance.fazenda, instance.safra)

@receiver(post_save, sender=PedidoCompra)
@receiver(post_delete, sender=PedidoCompra)
def pedido_compra_changed(sender, instance, **kwargs):
    if getattr(instance, 'de_planejamento', False):
        return
    atualizar_pedido_compra_planejamento(instance.fazenda, instance.safra)

@receiver(post_save, sender=ItemPedidoCompra)
@receiver(post_delete, sender=ItemPedidoCompra)
def item_pedido_compra_changed(sender, instance, **kwargs):
    if instance.pedido_compra and getattr(instance.pedido_compra, 'de_planejamento', False):
        return
    if instance.pedido_compra:
        atualizar_pedido_compra_planejamento(instance.pedido_compra.fazenda, instance.pedido_compra.safra)
