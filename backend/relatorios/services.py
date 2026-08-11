from collections import defaultdict
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Avg, Q, Sum

from cadastros.models import (
    CustoMensalMaquina,
    EstimativaProducaoTalhao,
    EstoqueMovimento,
    Produto,
    SalarioMensal,
    Talhao,
    LocacaoMaquina,
)
from core.models import Fazenda
from financeiro.models import ContasAPagar, ContasAReceber, ItemPedidoCompra
from operacoes.models import (
    ApontamentoFuncionario,
    ApontamentoInsumo,
    ApontamentoMaquina,
    OrdemServico,
    OrdemServicoTalhao,
    RateioTalhao,
    RateioOperacional,
)
from planejamento.models import (
    ItemInsumoOSPlanejado,
    OrdemServicoPlanejadaTalhao,
    PlanejamentoAdubo,
    PlanejamentoMaoObraTerceiros,
    PlanejamentoRateio,
    PlanejamentoSafra,
)


ZERO = Decimal("0")


def money(value):
    return float((value or ZERO).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def number(value, places="0.01"):
    return float((value or ZERO).quantize(Decimal(places), rounding=ROUND_HALF_UP))


def month_key(value):
    return f"{value.year:04d}-{value.month:02d}"


def month_label(key):
    year, month = key.split("-")
    return f"{month}/{year}"


def decimal_sum(qs, field):
    return qs.aggregate(total=Sum(field))["total"] or ZERO


def get_average_product_prices(safra):
    prices = {}

    entradas = (
        EstoqueMovimento.objects.filter(safra=safra, tipo_movimento="ENTRADA", ativo=True)
        .values("produto_id")
        .annotate(avg_price=Avg("valor_unitario"))
    )
    for row in entradas:
        prices[row["produto_id"]] = row["avg_price"] or ZERO

    compras = (
        ItemPedidoCompra.objects.filter(pedido_compra__safra=safra, ativo=True, pedido_compra__ativo=True)
        .values("produto_id")
        .annotate(avg_price=Avg("valor_unitario"))
    )
    for row in compras:
        prices.setdefault(row["produto_id"], row["avg_price"] or ZERO)

    return prices


def product_price(prices, produto_id):
    return prices.get(produto_id) or ZERO


def distribute_by_os_talhoes(ordem_servico, value):
    talhoes = list(
        OrdemServicoTalhao.objects.filter(ordem_servico=ordem_servico, ativo=True)
        .select_related("talhao")
    )
    if not talhoes or not value:
        return {}

    total_area = sum((item.talhao.area or ZERO) for item in talhoes)
    if total_area <= ZERO:
        share = value / Decimal(len(talhoes))
        return {item.talhao_id: share for item in talhoes}

    return {item.talhao_id: value * ((item.talhao.area or ZERO) / total_area) for item in talhoes}


def obter_talhoes_alvo_rateio(rateio, safra):
    """
    Retorna a lista de talhões ativos para o rateio operacional.
    Se fazenda_rateio for especificada, retorna talhões ativos dessa fazenda.
    Se for null, retorna talhões ativos de todas as fazendas do proprietário com safra de mesmo nome ativa.
    """
    if rateio.fazenda_rateio:
        return list(Talhao.objects.filter(fazenda=rateio.fazenda_rateio, ativo=True))
    
    # Compartilhado globalmente
    fazendas_alvo = Fazenda.objects.filter(
        proprietario=safra.fazenda.proprietario,
        safras__nome=safra.nome,
        safras__ativa=True,
        safras__ativo=True,
        ativo=True
    ).distinct()
    return list(Talhao.objects.filter(fazenda__in=fazendas_alvo, ativo=True))


def obter_valor_rateio_para_talhao(rateio, safra, talhao, tipo='real'):
    """
    Calcula a fatia do rateio operacional para um talhão específico.
    """
    talhoes_alvo = obter_talhoes_alvo_rateio(rateio, safra)
    if not talhoes_alvo or talhao not in talhoes_alvo:
        return ZERO
        
    total_area = sum((t.area or ZERO) for t in talhoes_alvo)
    
    if rateio.criterio_rateio and rateio.criterio_rateio.nome == "Produção (Sacas)":
        from cadastros.models import EstimativaProducaoTalhao
        estimativas = {
            e.talhao_id: e.estimativa_sacas 
            for e in EstimativaProducaoTalhao.objects.filter(safra=safra, talhao__in=talhoes_alvo, ativo=True)
        }
        total_prod = sum(estimativas.values())
        if total_prod > ZERO:
            proporcao = (estimativas.get(talhao.id) or ZERO) / total_prod
        else:
            proporcao = (talhao.area or ZERO) / total_area if total_area > ZERO else ZERO
    else:
        proporcao = (talhao.area or ZERO) / total_area if total_area > ZERO else ZERO
        
    if tipo == 'real':
        valor_total = (
            (rateio.valor_total_homem_real or ZERO) +
            (rateio.valor_total_maq_real or ZERO) +
            (rateio.valor_total_diesel_real or ZERO) +
            (rateio.valor_total_real or ZERO)
        )
    else:
        valor_total = (
            (rateio.valor_total_homem_plan or ZERO) +
            (rateio.valor_total_maq_plan or ZERO) +
            (rateio.valor_total_diesel_plan or ZERO) +
            (rateio.valor_total_plan or ZERO)
        )
        
    return valor_total * proporcao


def machine_hour_value(maquina, safra, when):
    custo = CustoMensalMaquina.objects.filter(
        maquina=maquina,
        safra=safra,
        mes=when.month,
        ano=when.year,
        ativo=True,
    ).first()
    if not custo or not custo.horas_trabalhadas:
        return ZERO
    if custo.horas_trabalhadas <= ZERO:
        return ZERO
    return ((custo.custo_oficina or ZERO) + (custo.custo_abastecimento or ZERO)) / custo.horas_trabalhadas


def os_real_cost(ordem_servico, prices):
    total = ZERO

    insumos = ApontamentoInsumo.objects.filter(
        apontamento__ordem_servico=ordem_servico,
        apontamento__ativo=True,
        ativo=True,
    )
    for item in insumos:
        total += (item.quantidade_total or ZERO) * product_price(prices, item.produto_id)

    maquinas = ApontamentoMaquina.objects.filter(
        apontamento__ordem_servico=ordem_servico,
        apontamento__ativo=True,
        ativo=True,
    ).select_related("maquina", "apontamento")
    for item in maquinas:
        if item.horimetro_final is None or item.horimetro_inicial is None:
            continue
        horas = item.horimetro_final - item.horimetro_inicial
        if horas > ZERO:
            total += horas * machine_hour_value(item.maquina, ordem_servico.safra, item.apontamento.data_apontamento)

    return total


def planejamento_insumo_total(planejamento, prices):
    total = ZERO
    adubos = PlanejamentoAdubo.objects.filter(planejamento=planejamento, ativo=True)
    for item in adubos:
        total += (item.quantidade_planejada or ZERO) * product_price(prices, item.produto_id)

    insumos = ItemInsumoOSPlanejado.objects.filter(
        ordem_servico_planejada__planejamento=planejamento,
        ordem_servico_planejada__ativo=True,
        ativo=True,
    )
    for item in insumos:
        total += (item.quantidade_planejada or ZERO) * product_price(prices, item.produto_id)

    return total


def comparativo_safra(fazenda):
    safras = fazenda.safras.filter(ativo=True).order_by("data_inicio")
    rows = []

    for safra in safras:
        real_qs = ContasAPagar.objects.filter(safra=safra, fazenda=fazenda, ativo=True).exclude(status="CANCELADO")
        total_real = decimal_sum(real_qs, "valor")

        real_insumos = decimal_sum(
            real_qs.filter(
                Q(pedido_compra__isnull=False)
                | Q(descricao__icontains="insumo")
                | Q(descricao__icontains="adubo")
                | Q(descricao__icontains="defensivo")
                | Q(descricao__icontains="compra")
            ),
            "valor",
        )
        real_mao_obra = decimal_sum(
            real_qs.filter(
                Q(descricao__icontains="mao de obra")
                | Q(descricao__icontains="mão de obra")
                | Q(descricao__icontains="salario")
                | Q(descricao__icontains="funcionario")
                | Q(descricao__icontains="terceiro")
                | Q(descricao__icontains="servico")
                | Q(descricao__icontains="serviço")
                | Q(descricao__icontains="turma")
            ),
            "valor",
        )

        # Somar custos dos Rateios Operacionais reais alocados para esta fazenda
        rateios_ops = RateioOperacional.objects.filter(
            safra__nome=safra.nome,
            safra__fazenda__proprietario=safra.fazenda.proprietario,
            ativo=True
        )
        total_rateio_real = ZERO
        for rateio in rateios_ops:
            val_real = (
                (rateio.valor_total_homem_real or ZERO) +
                (rateio.valor_total_maq_real or ZERO) +
                (rateio.valor_total_diesel_real or ZERO) +
                (rateio.valor_total_real or ZERO)
            )
            if val_real <= ZERO:
                continue
            if rateio.fazenda_rateio:
                if rateio.fazenda_rateio_id != fazenda.id:
                    continue
                proporcao = Decimal('1.00')
            else:
                talhoes_alvo = obter_talhoes_alvo_rateio(rateio, safra)
                if rateio.criterio_rateio and rateio.criterio_rateio.nome == "Produção (Sacas)":
                    from cadastros.models import EstimativaProducaoTalhao
                    estimativas = {
                        e.talhao_id: e.estimativa_sacas 
                        for e in EstimativaProducaoTalhao.objects.filter(safra=safra, talhao__in=talhoes_alvo, ativo=True)
                    }
                    total_prod = sum(estimativas.values())
                    nossa_prod = sum(val for t_id, val in estimativas.items() if any(t.id == t_id and t.fazenda_id == fazenda.id for t in talhoes_alvo))
                    proporcao = nossa_prod / total_prod if total_prod > ZERO else ZERO
                else:
                    total_area = sum(t.area for t in talhoes_alvo)
                    nossa_area = sum(t.area for t in talhoes_alvo if t.fazenda_id == fazenda.id)
                    proporcao = nossa_area / total_area if total_area > ZERO else ZERO
            total_rateio_real += val_real * proporcao

        total_real += total_rateio_real
        real_outros = max(total_real - real_insumos - real_mao_obra, ZERO)

        planejamento = PlanejamentoSafra.objects.filter(safra=safra, fazenda=fazenda, ativo=True).first()
        plan_insumos = ZERO
        plan_mao_obra = ZERO
        plan_outros = ZERO
        if planejamento:
            prices = get_average_product_prices(safra)
            plan_insumos = planejamento_insumo_total(planejamento, prices)
            plan_mao_obra = decimal_sum(
                PlanejamentoMaoObraTerceiros.objects.filter(
                    ordem_servico_planejada__planejamento=planejamento,
                    ordem_servico_planejada__ativo=True,
                    ativo=True,
                ),
                "valor_planejado",
            ) + decimal_sum(
                OrdemServicoPlanejada.objects.filter(
                    planejamento=planejamento,
                    ativo=True
                ),
                "valor_planejado_turma"
            )
            plan_outros = decimal_sum(
                PlanejamentoRateio.objects.filter(planejamento=planejamento, ativo=True),
                "valor_planejado",
            )

        rows.append(
            {
                "safra_id": safra.id,
                "safra_nome": safra.nome,
                "ativa": safra.ativa,
                "total_planejado": money(plan_insumos + plan_mao_obra + plan_outros),
                "total_real": money(total_real),
                "breakdown": {
                    "planejado": {
                        "insumos": money(plan_insumos),
                        "mao_obra": money(plan_mao_obra),
                        "outros": money(plan_outros),
                    },
                    "real": {
                        "insumos": money(real_insumos),
                        "mao_obra": money(real_mao_obra),
                        "outros": money(real_outros),
                    },
                },
            }
        )

    return {
        "fazenda_id": fazenda.id,
        "fazenda_nome": fazenda.nome,
        "comparativos": rows,
    }


def custo_por_talhao(safra, fazenda):
    prices = get_average_product_prices(safra)
    rows = {}

    for talhao in Talhao.objects.filter(fazenda=fazenda, ativo=True).order_by("codigo"):
        rows[talhao.id] = {
            "talhao_id": talhao.id,
            "codigo": talhao.codigo,
            "nome": talhao.nome,
            "area": number(talhao.area),
            "custo_planejado": ZERO,
            "custo_real": ZERO,
        }

    planejamentos = PlanejamentoSafra.objects.filter(safra=safra, fazenda=fazenda, ativo=True)
    for planejamento in planejamentos:
        for adubo in PlanejamentoAdubo.objects.filter(planejamento=planejamento, ativo=True):
            if adubo.talhao_id in rows:
                rows[adubo.talhao_id]["custo_planejado"] += (adubo.quantidade_planejada or ZERO) * product_price(prices, adubo.produto_id)

        os_talhoes = OrdemServicoPlanejadaTalhao.objects.filter(
            ordem_servico_planejada__planejamento=planejamento,
            ordem_servico_planejada__ativo=True,
            ativo=True,
        ).select_related("talhao", "ordem_servico_planejada")
        by_os = defaultdict(list)
        for item in os_talhoes:
            by_os[item.ordem_servico_planejada_id].append(item)

        for os_id, talhoes in by_os.items():
            os_total = ZERO
            insumos = ItemInsumoOSPlanejado.objects.filter(ordem_servico_planejada_id=os_id, ativo=True)
            for item in insumos:
                os_total += (item.quantidade_planejada or ZERO) * product_price(prices, item.produto_id)

            total_area = sum((item.talhao.area or ZERO) for item in talhoes)
            for item in talhoes:
                if item.talhao_id not in rows:
                    continue
                share = os_total / Decimal(len(talhoes)) if total_area <= ZERO else os_total * ((item.talhao.area or ZERO) / total_area)
                rows[item.talhao_id]["custo_planejado"] += share

        total_area_fazenda = sum((Decimal(str(row["area"])) for row in rows.values()), ZERO)
        rateios = decimal_sum(
            PlanejamentoRateio.objects.filter(planejamento=planejamento, ativo=True),
            "valor_planejado",
        )
        if total_area_fazenda > ZERO and rateios:
            for row in rows.values():
                row["custo_planejado"] += rateios * (Decimal(str(row["area"])) / total_area_fazenda)

    ordens = OrdemServico.objects.filter(safra=safra, fazenda=fazenda, ativo=True).exclude(status="CANCELADA")
    for ordem in ordens:
        total_os = os_real_cost(ordem, prices)
        for talhao_id, value in distribute_by_os_talhoes(ordem, total_os).items():
            if talhao_id in rows:
                rows[talhao_id]["custo_real"] += value

    # Adicionar custos de rateio realizados
    rateios_reais = RateioTalhao.objects.filter(
        gasto_rateio__safra=safra,
        gasto_rateio__fazenda=fazenda,
        gasto_rateio__ativo=True,
        ativo=True
    )
    for rateio in rateios_reais:
        if rateio.talhao_id in rows:
            rows[rateio.talhao_id]["custo_real"] += rateio.valor

    # Adicionar rateios operacionais (Aba Rateios)
    rateios_operacionais = RateioOperacional.objects.filter(
        safra__nome=safra.nome,
        safra__fazenda__proprietario=safra.fazenda.proprietario,
        ativo=True
    )
    talhoes_ativos_nossa_fazenda = {t.id: t for t in Talhao.objects.filter(id__in=rows.keys())}
    for rateio in rateios_operacionais:
        for t_id, t_obj in talhoes_ativos_nossa_fazenda.items():
            # Plan
            share_plan = obter_valor_rateio_para_talhao(rateio, safra, t_obj, tipo='plan')
            rows[t_id]["custo_planejado"] += share_plan
            # Real
            share_real = obter_valor_rateio_para_talhao(rateio, safra, t_obj, tipo='real')
            rows[t_id]["custo_real"] += share_real

    # Adicionar custos de locação de máquinas (rateado proporcionalmente à área)
    locacoes = LocacaoMaquina.objects.filter(safra=safra, fazenda=fazenda, ativo=True)
    total_area_fazenda = sum((Decimal(str(row["area"])) for row in rows.values()), ZERO)
    for loc in locacoes:
        if total_area_fazenda > ZERO:
            for row in rows.values():
                row["custo_real"] += loc.valor_total * (Decimal(str(row["area"])) / total_area_fazenda)

    result = []
    for row in rows.values():
        area = Decimal(str(row["area"]))
        custo_planejado = row["custo_planejado"]
        custo_real = row["custo_real"]
        result.append(
            {
                **{k: v for k, v in row.items() if k not in ("custo_planejado", "custo_real")},
                "custo_planejado": money(custo_planejado),
                "custo_real": money(custo_real),
                "custo_planejado_ha": money(custo_planejado / area) if area > ZERO else 0.0,
                "custo_real_ha": money(custo_real / area) if area > ZERO else 0.0,
            }
        )
    return result


def custo_mensal(safra, fazenda):
    months = defaultdict(lambda: {
        "custos": ZERO, 
        "receitas": ZERO, 
        "salarios": ZERO, 
        "maquinas": ZERO, 
        "estoque": ZERO,
        "custos_rateio_operacional": ZERO
    })

    for item in ContasAPagar.objects.filter(safra=safra, fazenda=fazenda, ativo=True).exclude(status="CANCELADO"):
        key = month_key(item.data_pagamento or item.data_vencimento)
        months[key]["custos"] += item.valor or ZERO

    for item in ContasAReceber.objects.filter(safra=safra, fazenda=fazenda, ativo=True).exclude(status="CANCELADO"):
        key = month_key(item.data_recebimento or item.data_vencimento)
        months[key]["receitas"] += item.valor or ZERO

    salarios = SalarioMensal.objects.filter(safra=safra, funcionario__fazenda=fazenda, ativo=True, funcionario__ativo=True)
    for item in salarios:
        key = f"{item.ano:04d}-{item.mes:02d}"
        months[key]["salarios"] += (item.salario_base or ZERO) + (item.encargos or ZERO) + (item.beneficios or ZERO)

    custos_maquina = CustoMensalMaquina.objects.filter(safra=safra, maquina__fazenda=fazenda, ativo=True, maquina__ativo=True)
    for item in custos_maquina:
        key = f"{item.ano:04d}-{item.mes:02d}"
        months[key]["maquinas"] += (item.custo_oficina or ZERO) + (item.custo_abastecimento or ZERO)

    movimentos = EstoqueMovimento.objects.filter(safra=safra, fazenda=fazenda, tipo_movimento="SAIDA", ativo=True)
    for item in movimentos:
        months[month_key(item.data_movimento)]["estoque"] += item.valor_total or ZERO

    # Rateio Operacional
    rateios = RateioOperacional.objects.filter(
        safra__nome=safra.nome,
        safra__fazenda__proprietario=safra.fazenda.proprietario,
        ativo=True
    )
    for rateio in rateios:
        total_real = (
            (rateio.valor_total_homem_real or ZERO) +
            (rateio.valor_total_maq_real or ZERO) +
            (rateio.valor_total_diesel_real or ZERO) +
            (rateio.valor_total_real or ZERO)
        )
        if total_real <= ZERO:
            continue
            
        if rateio.fazenda_rateio:
            if rateio.fazenda_rateio_id != fazenda.id:
                continue
            proporcao = Decimal('1.00')
        else:
            talhoes_alvo = obter_talhoes_alvo_rateio(rateio, safra)
            if rateio.criterio_rateio and rateio.criterio_rateio.nome == "Produção (Sacas)":
                from cadastros.models import EstimativaProducaoTalhao
                estimativas = {
                    e.talhao_id: e.estimativa_sacas 
                    for e in EstimativaProducaoTalhao.objects.filter(safra=safra, talhao__in=talhoes_alvo, ativo=True)
                }
                total_prod = sum(estimativas.values())
                nossa_prod = sum(val for t_id, val in estimativas.items() if any(t.id == t_id and t.fazenda_id == fazenda.id for t in talhoes_alvo))
                proporcao = nossa_prod / total_prod if total_prod > ZERO else ZERO
            else:
                total_area = sum(t.area for t in talhoes_alvo)
                nossa_area = sum(t.area for t in talhoes_alvo if t.fazenda_id == fazenda.id)
                proporcao = nossa_area / total_area if total_area > ZERO else ZERO
            
        valor_fazenda = total_real * proporcao
        if valor_fazenda > ZERO:
            key = month_key(rateio.data)
            months[key]["custos_rateio_operacional"] += valor_fazenda

    rows = []
    for key in sorted(months):
        data = months[key]
        total_custos = data["custos"] + data["salarios"] + data["maquinas"] + data["estoque"] + data["custos_rateio_operacional"]
        rows.append(
            {
                "mes": key,
                "rotulo": month_label(key),
                "custos_financeiros": money(data["custos"]),
                "salarios": money(data["salarios"]),
                "maquinas": money(data["maquinas"]),
                "estoque_consumido": money(data["estoque"]),
                "custos_rateio_operacional": money(data["custos_rateio_operacional"]),
                "receitas": money(data["receitas"]),
                "total_custos": money(total_custos),
                "resultado": money(data["receitas"] - total_custos),
            }
        )
    return rows


def fluxo_caixa(safra, data_inicio=None, data_fim=None):
    data_inicio = data_inicio or safra.data_inicio
    data_fim = data_fim or safra.data_fim
    today = date.today()

    transacoes = []

    for item in ContasAPagar.objects.filter(safra=safra, status="PAGO", data_pagamento__range=[data_inicio, data_fim], ativo=True):
        transacoes.append(
            {
                "id": f"pag_real_{item.id}",
                "tipo": "SAIDA",
                "categoria": "Realizado",
                "descricao": item.descricao,
                "valor": money(item.valor),
                "data": item.data_pagamento.isoformat(),
                "data_vencimento": item.data_vencimento.isoformat(),
                "status": item.status,
                "atrasado": False,
            }
        )

    for item in ContasAReceber.objects.filter(safra=safra, status="RECEBIDO", data_recebimento__range=[data_inicio, data_fim], ativo=True):
        transacoes.append(
            {
                "id": f"rec_real_{item.id}",
                "tipo": "ENTRADA",
                "categoria": "Realizado",
                "descricao": item.descricao,
                "valor": money(item.valor),
                "data": item.data_recebimento.isoformat(),
                "data_vencimento": item.data_vencimento.isoformat(),
                "status": item.status,
                "atrasado": False,
            }
        )

    for item in ContasAPagar.objects.filter(safra=safra, status="PENDENTE", data_vencimento__range=[data_inicio, data_fim], ativo=True):
        transacoes.append(
            {
                "id": f"pag_prev_{item.id}",
                "tipo": "SAIDA",
                "categoria": "Previsto",
                "descricao": item.descricao,
                "valor": money(item.valor),
                "data": item.data_vencimento.isoformat(),
                "data_vencimento": item.data_vencimento.isoformat(),
                "status": item.status,
                "atrasado": item.data_vencimento < today,
            }
        )

    for item in ContasAReceber.objects.filter(safra=safra, status="PENDENTE", data_vencimento__range=[data_inicio, data_fim], ativo=True):
        transacoes.append(
            {
                "id": f"rec_prev_{item.id}",
                "tipo": "ENTRADA",
                "categoria": "Previsto",
                "descricao": item.descricao,
                "valor": money(item.valor),
                "data": item.data_vencimento.isoformat(),
                "data_vencimento": item.data_vencimento.isoformat(),
                "status": item.status,
                "atrasado": item.data_vencimento < today,
            }
        )

    transacoes.sort(key=lambda item: item["data"])
    entrada_real = sum(Decimal(str(item["valor"])) for item in transacoes if item["tipo"] == "ENTRADA" and item["categoria"] == "Realizado")
    saida_real = sum(Decimal(str(item["valor"])) for item in transacoes if item["tipo"] == "SAIDA" and item["categoria"] == "Realizado")
    entrada_prev = sum(Decimal(str(item["valor"])) for item in transacoes if item["tipo"] == "ENTRADA" and item["categoria"] == "Previsto")
    saida_prev = sum(Decimal(str(item["valor"])) for item in transacoes if item["tipo"] == "SAIDA" and item["categoria"] == "Previsto")

    chart = defaultdict(lambda: {"entradas_realizadas": ZERO, "saidas_realizadas": ZERO, "entradas_previstas": ZERO, "saidas_previstas": ZERO})
    for item in transacoes:
        key = item["data"][:7]
        if item["tipo"] == "ENTRADA" and item["categoria"] == "Realizado":
            chart[key]["entradas_realizadas"] += Decimal(str(item["valor"]))
        elif item["tipo"] == "SAIDA" and item["categoria"] == "Realizado":
            chart[key]["saidas_realizadas"] += Decimal(str(item["valor"]))
        elif item["tipo"] == "ENTRADA":
            chart[key]["entradas_previstas"] += Decimal(str(item["valor"]))
        else:
            chart[key]["saidas_previstas"] += Decimal(str(item["valor"]))

    return {
        "resumo": {
            "entradas_realizadas": money(entrada_real),
            "saidas_realizadas": money(saida_real),
            "saldo_realizado": money(entrada_real - saida_real),
            "entradas_previstas": money(entrada_prev),
            "saidas_previstas": money(saida_prev),
            "saldo_projetado": money((entrada_real + entrada_prev) - (saida_real + saida_prev)),
        },
        "grafico": [
            {
                "key": key,
                "mes": month_label(key),
                **{name: money(value) for name, value in values.items()},
            }
            for key, values in sorted(chart.items())
        ],
        "transacoes": transacoes,
    }


def eficiencia_operacional(safra, fazenda):
    total_horas = decimal_sum(
        ApontamentoFuncionario.objects.filter(
            apontamento__ordem_servico__safra=safra,
            apontamento__ordem_servico__fazenda=fazenda,
            ativo=True,
            apontamento__ativo=True,
            apontamento__ordem_servico__ativo=True,
        ),
        "horas_trabalhadas",
    )
    completed_os = OrdemServico.objects.filter(safra=safra, fazenda=fazenda, status="CONCLUIDA", ativo=True)

    area_executada = ZERO
    breakdown_map = defaultdict(lambda: {"horas": ZERO, "area": ZERO, "tipo_operacao_nome": ""})
    for ordem in completed_os.select_related("tipo_operacao"):
        area_os = decimal_sum(OrdemServicoTalhao.objects.filter(ordem_servico=ordem, ativo=True), "talhao__area")
        area_executada += area_os
        item = breakdown_map[ordem.tipo_operacao_id]
        item["tipo_operacao_nome"] = ordem.tipo_operacao.nome
        item["area"] += area_os

    horas_por_tipo = (
        ApontamentoFuncionario.objects.filter(
            apontamento__ordem_servico__safra=safra,
            apontamento__ordem_servico__fazenda=fazenda,
            ativo=True,
            apontamento__ativo=True,
            apontamento__ordem_servico__ativo=True,
        )
        .values("apontamento__ordem_servico__tipo_operacao_id", "apontamento__ordem_servico__tipo_operacao__nome")
        .annotate(total=Sum("horas_trabalhadas"))
    )
    for row in horas_por_tipo:
        item = breakdown_map[row["apontamento__ordem_servico__tipo_operacao_id"]]
        item["tipo_operacao_nome"] = row["apontamento__ordem_servico__tipo_operacao__nome"]
        item["horas"] += row["total"] or ZERO

    talhao_ids = OrdemServicoTalhao.objects.filter(ordem_servico__in=completed_os, ativo=True).values_list("talhao_id", flat=True).distinct()
    area_unica = decimal_sum(Talhao.objects.filter(id__in=talhao_ids, ativo=True), "area")

    breakdown = []
    for tipo_id, values in breakdown_map.items():
        horas = values["horas"]
        area = values["area"]
        breakdown.append(
            {
                "tipo_operacao_id": tipo_id,
                "tipo_operacao_nome": values["tipo_operacao_nome"],
                "horas_trabalhadas": number(horas),
                "area_trabalhada": number(area),
                "eficiencia": number(area / horas) if horas > ZERO else 0.0,
            }
        )

    return {
        "total_horas_trabalhadas": number(total_horas),
        "total_hectares_trabalhados": number(area_executada),
        "total_hectares_unicos": number(area_unica),
        "eficiencia_geral": number(area_executada / total_horas) if total_horas > ZERO else 0.0,
        "breakdown": sorted(breakdown, key=lambda item: item["tipo_operacao_nome"]),
    }


def consumo_diesel(safra, fazenda):
    diesel_filter = Q(produto__nome_comercial__icontains="diesel") | Q(produto__nome_comercial__icontains="oleo diesel") | Q(produto__classificacao__nome__icontains="diesel")
    movimentos = (
        EstoqueMovimento.objects.filter(safra=safra, fazenda=fazenda, tipo_movimento="SAIDA", ativo=True)
        .filter(diesel_filter)
        .values("produto_id", "produto__nome_comercial", "produto__unidade__sigla", "data_movimento__year", "data_movimento__month")
        .annotate(quantidade=Sum("quantidade"), valor=Sum("valor_total"))
        .order_by("data_movimento__year", "data_movimento__month", "produto__nome_comercial")
    )
    return [
        {
            "mes": f"{row['data_movimento__year']:04d}-{row['data_movimento__month']:02d}",
            "produto_id": row["produto_id"],
            "produto_nome": row["produto__nome_comercial"],
            "unidade": row["produto__unidade__sigla"],
            "quantidade": number(row["quantidade"], "0.0001"),
            "valor": money(row["valor"]),
        }
        for row in movimentos
    ]


def mao_obra_fixa(safra, fazenda):
    salarios = (
        SalarioMensal.objects.filter(safra=safra, funcionario__fazenda=fazenda, ativo=True, funcionario__ativo=True)
        .select_related("funcionario", "funcionario__grupo_trabalhador")
        .order_by("ano", "mes", "funcionario__nome")
    )
    horas = defaultdict(Decimal)
    apontamentos = (
        ApontamentoFuncionario.objects.filter(
            apontamento__ordem_servico__safra=safra,
            apontamento__ordem_servico__fazenda=fazenda,
            ativo=True,
            apontamento__ativo=True,
        )
        .values("funcionario_id", "apontamento__data_apontamento__year", "apontamento__data_apontamento__month")
        .annotate(total=Sum("horas_trabalhadas"))
    )
    for row in apontamentos:
        horas[(row["funcionario_id"], row["apontamento__data_apontamento__year"], row["apontamento__data_apontamento__month"])] = row["total"] or ZERO

    # Adicionar horas do rateio operacional
    rateios_horas = RateioOperacional.objects.filter(
        safra__nome=safra.nome,
        safra__fazenda__proprietario=safra.fazenda.proprietario,
        funcionario_real__isnull=False,
        horas_homem_real__gt=0,
        ativo=True
    )
    for r in rateios_horas:
        key = (r.funcionario_real_id, r.data.year, r.data.month)
        horas[key] += r.horas_homem_real or ZERO

    rows = []
    for item in salarios:
        total = (item.salario_base or ZERO) + (item.encargos or ZERO) + (item.beneficios or ZERO)
        horas_mes = horas[(item.funcionario_id, item.ano, item.mes)]
        rows.append(
            {
                "funcionario_id": item.funcionario_id,
                "funcionario_nome": item.funcionario.nome,
                "cargo": item.funcionario.cargo,
                "grupo": item.funcionario.grupo_trabalhador.nome,
                "mes": f"{item.ano:04d}-{item.mes:02d}",
                "salario_base": money(item.salario_base),
                "encargos": money(item.encargos),
                "beneficios": money(item.beneficios),
                "custo_total": money(total),
                "horas_trabalhadas": number(horas_mes),
                "custo_hora": money(total / horas_mes) if horas_mes > ZERO else 0.0,
            }
        )
    return rows


def estoque_por_produto(safra, fazenda):
    produtos = Produto.objects.filter(ativo=True).select_related("unidade").order_by("nome_comercial")
    rows = []
    for produto in produtos:
        base = EstoqueMovimento.objects.filter(safra=safra, produto=produto, ativo=True)
        entradas = decimal_sum(base.filter(fazenda=fazenda, tipo_movimento="ENTRADA"), "quantidade")
        saidas = decimal_sum(base.filter(fazenda=fazenda, tipo_movimento="SAIDA"), "quantidade")
        ajustes = decimal_sum(base.filter(fazenda=fazenda, tipo_movimento="AJUSTE"), "quantidade")
        transferidas = decimal_sum(base.filter(origem_transferencia=fazenda, tipo_movimento="TRANSFERENCIA"), "quantidade")
        recebidas = decimal_sum(base.filter(destino_transferencia=fazenda, tipo_movimento="TRANSFERENCIA"), "quantidade")
        saldo = entradas + ajustes + recebidas - saidas - transferidas
        if entradas or saidas or ajustes or transferidas or recebidas:
            rows.append(
                {
                    "produto_id": produto.id,
                    "produto_nome": produto.nome_comercial,
                    "unidade": produto.unidade.sigla,
                    "entradas": number(entradas, "0.0001"),
                    "saidas": number(saidas, "0.0001"),
                    "ajustes": number(ajustes, "0.0001"),
                    "transferencias_enviadas": number(transferidas, "0.0001"),
                    "transferencias_recebidas": number(recebidas, "0.0001"),
                    "saldo": number(saldo, "0.0001"),
                    "alerta_saldo_negativo": saldo < ZERO,
                }
            )
    return rows


def producao_por_talhao(safra, fazenda):
    estimativas = (
        EstimativaProducaoTalhao.objects.filter(safra=safra, talhao__fazenda=fazenda, ativo=True, talhao__ativo=True)
        .select_related("talhao")
        .order_by("talhao__codigo")
    )
    return [
        {
            "talhao_id": item.talhao_id,
            "codigo": item.talhao.codigo,
            "nome": item.talhao.nome,
            "area": number(item.talhao.area),
            "estimativa_sacas": number(item.estimativa_sacas),
            "produtividade_esperada": number(item.produtividade_esperada),
            "producao_realizada_sacas": None,
            "observacao": "Producao realizada por talhao ainda nao possui modelo transacional.",
        }
        for item in estimativas
    ]


def gestao_a_vista(safra, fazenda):
    fluxo = fluxo_caixa(safra)
    custos = custo_mensal(safra, fazenda)
    estoque = estoque_por_produto(safra, fazenda)
    eficiencia = eficiencia_operacional(safra, fazenda)
    producao = producao_por_talhao(safra, fazenda)

    total_custos = sum(Decimal(str(item["total_custos"])) for item in custos)
    total_receitas = sum(Decimal(str(item["receitas"])) for item in custos)
    total_estimado = sum(Decimal(str(item["estimativa_sacas"])) for item in producao)
    os_total = OrdemServico.objects.filter(safra=safra, fazenda=fazenda, ativo=True).count()
    os_concluidas = OrdemServico.objects.filter(safra=safra, fazenda=fazenda, status="CONCLUIDA", ativo=True).count()

    # 1. Hectares cultivados
    hectares = decimal_sum(Talhao.objects.filter(fazenda=fazenda, ativo=True), "area")

    # 2. COE Planejado
    planejamento = PlanejamentoSafra.objects.filter(safra=safra, fazenda=fazenda, ativo=True).first()
    plan_insumos = ZERO
    plan_mao_obra = ZERO
    plan_outros = ZERO
    if planejamento:
        prices = get_average_product_prices(safra)
        plan_insumos = planejamento_insumo_total(planejamento, prices)
        plan_mao_obra = decimal_sum(
            PlanejamentoMaoObraTerceiros.objects.filter(
                ordem_servico_planejada__planejamento=planejamento,
                ordem_servico_planejada__ativo=True,
                ativo=True,
            ),
            "valor_planejado",
        )
        plan_outros = decimal_sum(
            PlanejamentoRateio.objects.filter(planejamento=planejamento, ativo=True),
            "valor_planejado",
        )
    coe_planejado = plan_insumos + plan_mao_obra + plan_outros

    # 3. Produtividade esperada
    produtividade = total_estimado / hectares if hectares > ZERO else ZERO

    # 4. Total de horas operador
    total_horas = decimal_sum(
        ApontamentoFuncionario.objects.filter(
            apontamento__ordem_servico__safra=safra,
            apontamento__ordem_servico__fazenda=fazenda,
            ativo=True,
            apontamento__ativo=True,
            apontamento__ordem_servico__ativo=True,
        ),
        "horas_trabalhadas",
    )

    # 5. OS status counts (incluindo cálculo on-the-fly de ATRASADA)
    os_qs = OrdemServico.objects.filter(safra=safra, fazenda=fazenda, ativo=True)
    today = date.today()
    os_status = {
        'RASCUNHO': 0,
        'APROVADA': 0,
        'EM_EXECUCAO': 0,
        'CONCLUIDA': 0,
        'CANCELADA': 0,
        'ATRASADA': 0
    }
    for os_obj in os_qs:
        status_key = os_obj.status
        if os_obj.data_fim_planejada < today and status_key not in ('CONCLUIDA', 'CANCELADA'):
            os_status['ATRASADA'] += 1
        elif status_key in os_status:
            os_status[status_key] += 1

    return {
        "resumo": {
            "fazenda_id": fazenda.id,
            "fazenda_nome": fazenda.nome,
            "safra_id": safra.id,
            "safra_nome": safra.nome,
            "receitas": money(total_receitas),
            "custos": money(total_custos),
            "resultado": money(total_receitas - total_custos),
            "saldo_fluxo_projetado": fluxo["resumo"]["saldo_projetado"],
            "producao_estimada_sacas": number(total_estimado),
            "ordens_servico_total": os_total,
            "ordens_servico_concluidas": os_concluidas,
            "produtos_com_saldo_negativo": len([item for item in estoque if item["alerta_saldo_negativo"]]),
            "eficiencia_geral": eficiencia["eficiencia_geral"],
        },
        "custo_mensal": custos,
        "estoque_alertas": [item for item in estoque if item["alerta_saldo_negativo"]],
        "eficiencia": eficiencia,
        "kpis": {
            "hectares_cultivados": number(hectares),
            "estimativa_producao_sacas": number(total_estimado),
            "produtividade_esperada": number(produtividade),
            "coe_planejado": money(coe_planejado),
            "coe_realizado": money(total_custos),
            "total_horas_operador": number(total_horas),
            "eficiencia_geral": eficiencia["eficiencia_geral"],
            "os_status": os_status
        }
    }
