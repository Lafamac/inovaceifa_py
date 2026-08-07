from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from referencias.models import UnidadeMedida, ClassificacaoProduto
from cadastros.models import Produto, EstoqueMovimento, Fornecedor
from financeiro.models import PedidoCompra, ItemPedidoCompra
from planejamento.models import ItemInsumoOSPlanejado

def obter_ou_criar_produto_ad_hoc(nome_comercial, fazenda, safra, unidade_sigla=None):
    """
    Busca ou cria dinamicamente um produto ad-hoc/novo no cadastro de produtos.
    """
    nome_comercial = nome_comercial.strip().upper()
    if not unidade_sigla:
        unidade_sigla = "un"
    
    unidade, _ = UnidadeMedida.objects.get_or_create(
        sigla=unidade_sigla.lower(),
        defaults={"nome": "Unidade"}
    )
    classificacao, _ = ClassificacaoProduto.objects.get_or_create(
        nome="Outros"
    )
    
    produto = Produto.objects.filter(
        nome_comercial=nome_comercial,
        fazenda=fazenda,
        safra=safra,
        ativo=True
    ).first()
    
    if not produto:
        count = Produto.objects.filter(ativo=True).count() + 1
        codigo = f"ADHOC-{count}"
        produto = Produto.objects.create(
            nome_comercial=nome_comercial,
            fazenda=fazenda,
            safra=safra,
            unidade=unidade,
            classificacao=classificacao,
            codigo=codigo
        )
    return produto

def obter_saldo_estoque(fazenda, safra, produto):
    """
    Calcula o saldo atual de estoque de um produto para a fazenda e safra fornecidas.
    """
    entradas = EstoqueMovimento.objects.filter(
        fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='ENTRADA', ativo=True
    ).aggregate(total=Sum('quantidade'))['total'] or Decimal('0.0000')

    saidas = EstoqueMovimento.objects.filter(
        fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='SAIDA', ativo=True
    ).aggregate(total=Sum('quantidade'))['total'] or Decimal('0.0000')

    ajustes = EstoqueMovimento.objects.filter(
        fazenda=fazenda, safra=safra, produto=produto, tipo_movimento='AJUSTE', ativo=True
    ).aggregate(total=Sum('quantidade'))['total'] or Decimal('0.0000')

    transf_enviadas = EstoqueMovimento.objects.filter(
        origem_transferencia=fazenda, safra=safra, produto=produto, tipo_movimento='TRANSFERENCIA', ativo=True
    ).aggregate(total=Sum('quantidade'))['total'] or Decimal('0.0000')

    transf_recebidas = EstoqueMovimento.objects.filter(
        destino_transferencia=fazenda, safra=safra, produto=produto, tipo_movimento='TRANSFERENCIA', ativo=True
    ).aggregate(total=Sum('quantidade'))['total'] or Decimal('0.0000')

    return (entradas + ajustes + transf_recebidas) - (saidas + transf_enviadas)

def atualizar_pedido_compra_planejamento(fazenda, safra):
    """
    Consolida as demandas de todos os planejamentos ativos para a mesma safra e fazenda,
    gerando ou atualizando um pedido de compra em status RASCUNHO com a quantidade deficitária.
    """
    if not fazenda or not safra:
        return

    with transaction.atomic():
        # 1. Obter ou criar o Fornecedor de Planejamento
        fornecedor, _ = Fornecedor.objects.get_or_create(
            nome="FORNECEDOR PLANEJAMENTO",
            fazenda=fazenda,
            defaults={"ativo": True}
        )

        # 2. Buscar ou criar o Pedido de Compra de Planejamento (status RASCUNHO)
        pedido, created = PedidoCompra.objects.get_or_create(
            fazenda=fazenda,
            safra=safra,
            de_planejamento=True,
            status='RASCUNHO',
            defaults={
                "fornecedor": fornecedor,
                "data_pedido": timezone.now().date(),
                "valor_total": Decimal('0.00')
            }
        )

        # 3. Sumarizar as quantidades planejadas de todos os planejamentos da mesma fazenda e safra
        insumos_planejados = ItemInsumoOSPlanejado.objects.filter(
            ordem_servico_planejada__planejamento__fazenda=fazenda,
            ordem_servico_planejada__planejamento__safra=safra,
            ativo=True,
            ordem_servico_planejada__ativo=True,
            ordem_servico_planejada__planejamento__ativo=True
        ).values('produto').annotate(total_planejado=Sum('quantidade_planejada'))

        planned_map = {item['produto']: Decimal(str(item['total_planejado'])) for item in insumos_planejados if item['produto']}

        # 4. Calcular o total já encomendado em outros pedidos aprovados
        approved_items = ItemPedidoCompra.objects.filter(
            pedido_compra__fazenda=fazenda,
            pedido_compra__safra=safra,
            pedido_compra__status='APROVADO',
            ativo=True,
            pedido_compra__ativo=True
        ).values('produto').annotate(total_ordenado=Sum('quantidade'))

        ordered_map = {item['produto']: Decimal(str(item['total_ordenado'])) for item in approved_items if item['produto']}

        # 5. Processar cada produto planejado
        processed_product_ids = set()
        for prod_id, Q_planejado in planned_map.items():
            try:
                produto = Produto.objects.get(id=prod_id)
            except Produto.DoesNotExist:
                continue

            # Obter estoque atual e quantidade já aprovada em compras
            Q_estoque = obter_saldo_estoque(fazenda, safra, produto)
            Q_ordenado = ordered_map.get(prod_id, Decimal('0.0000'))

            # Déficit = Q_planejado - Q_estoque - Q_ordenado
            deficit = Q_planejado - Q_estoque - Q_ordenado

            if deficit > Decimal('0.0000'):
                processed_product_ids.add(prod_id)
                item, item_created = ItemPedidoCompra.objects.get_or_create(
                    pedido_compra=pedido,
                    produto=produto,
                    defaults={
                        "quantidade": deficit,
                        "valor_unitario": Decimal('0.0000'),
                        "valor_total": Decimal('0.00')
                    }
                )
                if not item_created:
                    item.quantidade = deficit
                    item.save()
                else:
                    # Tenta obter o último valor unitário do estoque para preencher o preço estimado
                    last_movement = EstoqueMovimento.objects.filter(
                        produto=produto,
                        tipo_movimento='ENTRADA',
                        ativo=True
                    ).order_by('-data_movimento', '-id').first()
                    if last_movement:
                        item.valor_unitario = last_movement.valor_unitario
                    else:
                        item.valor_unitario = Decimal('0.0000')
                    item.save()
            else:
                # Se o déficit deixou de existir (ex: entrada de estoque), remove do pedido
                ItemPedidoCompra.objects.filter(pedido_compra=pedido, produto=produto).delete()

        # 6. Remover produtos da compra consolidada que não estão mais planejados
        ItemPedidoCompra.objects.filter(pedido_compra=pedido).exclude(produto_id__in=processed_product_ids).delete()

        # 7. Atualizar valor total do pedido
        # A própria regra de save do ItemPedidoCompra atualiza o total, mas chamamos explicitamente para garantir
        total_value = pedido.itens.filter(ativo=True).aggregate(total=Sum('valor_total'))['total'] or Decimal('0.00')
        pedido.valor_total = total_value
        pedido.save()

        # 8. Se o pedido de compra consolidado ficar vazio, podemos excluí-lo
        if not pedido.itens.filter(ativo=True).exists():
            pedido.delete()
