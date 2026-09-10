from decimal import Decimal
from django.db import transaction, models
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

def obter_necessidades_compra_planejamento(fazenda, safra):
    """
    Consolida as demandas de todos os insumos de planejamentos ativos para a mesma safra e fazenda,
    retornando o cálculo de estoque, quantidade ordenada em compras reais aprovadas e o déficit real a comprar.
    """
    if not fazenda or not safra:
        return []

    # 1. Limpar pedidos de compra legados de planejamento (de_planejamento=True OU fornecedor PLANEJAMENTO)
    PedidoCompra.objects.filter(fazenda=fazenda, safra=safra).filter(
        models.Q(de_planejamento=True) | models.Q(fornecedor__nome__icontains="PLANEJAMENTO")
    ).delete()

    # 2. Sumarizar as quantidades planejadas de todos os planejamentos ativos da fazenda e safra
    insumos_planejados = ItemInsumoOSPlanejado.objects.filter(
        ordem_servico_planejada__planejamento__fazenda=fazenda,
        ordem_servico_planejada__planejamento__safra=safra,
        ativo=True,
        ordem_servico_planejada__ativo=True,
        ordem_servico_planejada__planejamento__ativo=True
    ).values('produto').annotate(total_planejado=Sum('quantidade_planejada'))

    planned_map = {item['produto']: Decimal(str(item['total_planejado'])) for item in insumos_planejados if item['produto']}

    # 3. Sumarizar quantidade encomendada em pedidos de compra REAIS (de_planejamento=False) aprovados
    approved_items = ItemPedidoCompra.objects.filter(
        pedido_compra__fazenda=fazenda,
        pedido_compra__safra=safra,
        pedido_compra__de_planejamento=False,
        pedido_compra__status='APROVADO',
        ativo=True,
        pedido_compra__ativo=True
    ).exclude(pedido_compra__fornecedor__nome__icontains="PLANEJAMENTO").values('produto').annotate(total_ordenado=Sum('quantidade'))

    ordered_map = {item['produto']: Decimal(str(item['total_ordenado'])) for item in approved_items if item['produto']}

    resultado = []
    for prod_id, Q_planejado in planned_map.items():
        try:
            produto = Produto.objects.select_related('unidade', 'classificacao').get(id=prod_id)
        except Produto.DoesNotExist:
            continue

        Q_estoque = obter_saldo_estoque(fazenda, safra, produto)
        Q_ordenado = ordered_map.get(prod_id, Decimal('0.0000'))

        deficit = max(Decimal('0.0000'), Q_planejado - Q_estoque - Q_ordenado)

        last_movement = EstoqueMovimento.objects.filter(
            produto=produto,
            tipo_movimento='ENTRADA',
            ativo=True
        ).order_by('-data_movimento', '-id').first()

        preco_estimado = last_movement.valor_unitario if last_movement else Decimal('0.0000')

        resultado.append({
            "produto_id": produto.id,
            "produto_nome": produto.nome_comercial,
            "produto_codigo": produto.codigo,
            "unidade_sigla": produto.unidade.sigla if produto.unidade else "un",
            "classificacao_nome": produto.classificacao.nome if produto.classificacao else "Outros",
            "quantidade_planejada": float(Q_planejado),
            "quantidade_estoque": float(Q_estoque),
            "quantidade_ordenada": float(Q_ordenado),
            "deficit": float(deficit),
            "valor_unitario_estimado": float(preco_estimado),
            "valor_total_deficit_estimado": float(deficit * preco_estimado)
        })

    # Ordenar por déficit decrescente e nome comercial
    resultado.sort(key=lambda x: (-x['deficit'], x['produto_nome']))
    return resultado

def atualizar_pedido_compra_planejamento(fazenda, safra):
    """
    Função de compatibilidade que remove quaisquer pedidos de compra rascunho fictícios de planejamento.
    """
    if not fazenda or not safra:
        return
    PedidoCompra.objects.filter(fazenda=fazenda, safra=safra).filter(
        models.Q(de_planejamento=True) | models.Q(fornecedor__nome__icontains="PLANEJAMENTO")
    ).delete()


