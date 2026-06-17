from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from cadastros.models import Talhao, EstimativaProducaoTalhao, EstoqueMovimento
from .models import RateioTalhao

@transaction.atomic
def calcular_e_salvar_rateio_realizado(gasto_rateio, dados_talhoes=None):
    """
    Calcula de forma síncrona a divisão da despesa real por talhão
    com base no critério selecionado.
    """
    # Remove rateios antigos para este gasto
    RateioTalhao.objects.filter(gasto_rateio=gasto_rateio).delete()

    if not gasto_rateio.ativo:
        return

    criterio_nome = gasto_rateio.criterio_rateio.nome
    valor_total = gasto_rateio.valor
    fazenda = gasto_rateio.fazenda
    safra = gasto_rateio.safra

    # Talhões ativos da fazenda
    talhoes_ativos = list(Talhao.objects.filter(fazenda=fazenda, ativo=True))
    if not talhoes_ativos:
        return

    rateios_novos = []

    if criterio_nome in ["Direto", "Por Talhão"] and dados_talhoes:
        # Distribuição manual fornecida pelo frontend
        for item in dados_talhoes:
            t_id = item.get('talhao_id')
            v_val = Decimal(str(item.get('valor', 0)))
            p_val = Decimal(str(item.get('percentual', 0)))
            rateios_novos.append(RateioTalhao(
                gasto_rateio=gasto_rateio,
                talhao_id=t_id,
                valor=v_val,
                percentual=p_val
            ))

    elif criterio_nome == "Área (Hectares)":
        total_area = sum(t.area for t in talhoes_ativos)
        if total_area > 0:
            for t in talhoes_ativos:
                pct = (t.area / total_area) * Decimal('100.00')
                val = valor_total * (t.area / total_area)
                pct = pct.quantize(Decimal('0.01'))
                val = val.quantize(Decimal('0.01'))
                rateios_novos.append(RateioTalhao(
                    gasto_rateio=gasto_rateio,
                    talhao=t,
                    valor=val,
                    percentual=pct
                ))
        else:
            _distribuir_igualmente(gasto_rateio, talhoes_ativos, rateios_novos)

    elif criterio_nome == "Produção (Sacas)":
        estimativas = list(EstimativaProducaoTalhao.objects.filter(
            talhao__fazenda=fazenda,
            safra=safra,
            ativo=True
        ))
        total_sacas = sum(est.estimativa_sacas for est in estimativas)
        if total_sacas > 0:
            sacas_por_talhao = {est.talhao_id: est.estimativa_sacas for est in estimativas}
            talhoes_com_estimativa = [t for t in talhoes_ativos if t.id in sacas_por_talhao]
            if talhoes_com_estimativa:
                for t in talhoes_com_estimativa:
                    sacas = sacas_por_talhao[t.id]
                    pct = (sacas / total_sacas) * Decimal('100.00')
                    val = valor_total * (sacas / total_sacas)
                    pct = pct.quantize(Decimal('0.01'))
                    val = val.quantize(Decimal('0.01'))
                    rateios_novos.append(RateioTalhao(
                        gasto_rateio=gasto_rateio,
                        talhao=t,
                        valor=val,
                        percentual=pct
                    ))
            else:
                _distribuir_igualmente(gasto_rateio, talhoes_ativos, rateios_novos)
        else:
            _distribuir_igualmente(gasto_rateio, talhoes_ativos, rateios_novos)

    elif criterio_nome == "Planta (Quantidade)":
        total_plantas = sum(t.numero_plantas or 0 for t in talhoes_ativos)
        if total_plantas > 0:
            for t in talhoes_ativos:
                plantas = Decimal(t.numero_plantas or 0)
                pct = (plantas / Decimal(total_plantas)) * Decimal('100.00')
                val = valor_total * (plantas / Decimal(total_plantas))
                pct = pct.quantize(Decimal('0.01'))
                val = val.quantize(Decimal('0.01'))
                rateios_novos.append(RateioTalhao(
                    gasto_rateio=gasto_rateio,
                    talhao=t,
                    valor=val,
                    percentual=pct
                ))
        else:
            _distribuir_igualmente(gasto_rateio, talhoes_ativos, rateios_novos)

    else:
        _distribuir_igualmente(gasto_rateio, talhoes_ativos, rateios_novos)

    # Ajuste de arredondamentos para fechar o valor exatamente
    if rateios_novos:
        _ajustar_arredondamentos(rateios_novos, valor_total)
        RateioTalhao.objects.bulk_create(rateios_novos)


def _distribuir_igualmente(gasto_rateio, talhoes, rateios_list):
    count = len(talhoes)
    if count == 0:
        return
    pct_cada = (Decimal('100.00') / count).quantize(Decimal('0.01'))
    val_cada = (gasto_rateio.valor / count).quantize(Decimal('0.01'))
    for t in talhoes:
        rateios_list.append(RateioTalhao(
            gasto_rateio=gasto_rateio,
            talhao=t,
            valor=val_cada,
            percentual=pct_cada
        ))


def _ajustar_arredondamentos(rateios_list, valor_total):
    soma_valores = sum(r.valor for r in rateios_list)
    soma_pcts = sum(r.percentual for r in rateios_list)
    
    diff_valor = valor_total - soma_valores
    diff_pct = Decimal('100.00') - soma_pcts
    
    if diff_valor != 0:
        rateios_list[-1].valor += diff_valor
    if diff_pct != 0:
        rateios_list[-1].percentual += diff_pct


@transaction.atomic
def gerar_movimento_abastecimento(abastecimento):
    """
    Sincroniza o estoque gerando uma SAIDA correspondente do produto combustivel.
    """
    doc_ref = f"ABASTECIMENTO #{abastecimento.id}"
    
    # Remove para evitar duplicações (idempotência)
    EstoqueMovimento.objects.filter(
        documento_referencia=doc_ref,
        tipo_movimento='SAIDA'
    ).delete()

    if abastecimento.ativo:
        EstoqueMovimento.objects.create(
            fazenda=abastecimento.fazenda,
            safra=abastecimento.safra,
            produto=abastecimento.combustivel,
            tipo_movimento='SAIDA',
            quantidade=abastecimento.quantidade,
            valor_unitario=abastecimento.valor_unitario,
            valor_total=abastecimento.valor_total,
            data_movimento=abastecimento.data_abastecimento,
            documento_referencia=doc_ref,
            observacao=f"SAÍDA AUTOMÁTICA PELO ABASTECIMENTO DA MÁQUINA {abastecimento.maquina.codigo}."
        )


@transaction.atomic
def remover_movimento_abastecimento(abastecimento):
    """
    Inativa a movimentação de estoque quando o abastecimento correspondente é inativado.
    """
    doc_ref = f"ABASTECIMENTO #{abastecimento.id}"
    EstoqueMovimento.objects.filter(
        documento_referencia=doc_ref
    ).update(ativo=False)
