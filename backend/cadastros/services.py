from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from financeiro.models import ContasAPagar


@transaction.atomic
def encerrar_locacao_maquina(
    locacao,
    *,
    quantidade_final=None,
    valor_final=None,
    data_encerramento=None,
    data_vencimento=None,
):
    if locacao.status != 'ABERTA':
        raise ValidationError('Somente locações abertas podem ser encerradas.')
    if locacao.contas_a_pagar_id:
        raise ValidationError('Esta locação já possui uma conta a pagar vinculada.')
    if not data_vencimento:
        raise ValidationError('Informe a data prevista para pagamento do aluguel.')

    quantidade = Decimal(str(quantidade_final)) if quantidade_final not in (None, '') else None
    valor = Decimal(str(valor_final)) if valor_final not in (None, '') else None

    if locacao.tipo_cobranca == 'HORA' and (quantidade is None or quantidade <= 0):
        raise ValidationError('Informe a quantidade efetiva de horas trabalhadas.')
    if valor is None:
        base_quantidade = quantidade if quantidade is not None else locacao.quantidade
        if base_quantidade is None:
            raise ValidationError('Informe o valor final ou a quantidade efetiva da locação.')
        valor = base_quantidade * locacao.valor_unitario
    if valor <= 0:
        raise ValidationError('O valor final da locação deve ser maior que zero.')

    encerramento = data_encerramento or timezone.localdate()
    descricao = (
        f'LOCAÇÃO MÁQUINA: {locacao.maquina.nome} '
        f'({locacao.data_inicio:%d/%m/%Y} a {locacao.data_fim:%d/%m/%Y})'
    ).upper()
    conta = ContasAPagar.objects.create(
        descricao=descricao,
        valor=valor,
        data_vencimento=data_vencimento,
        status='PENDENTE',
        fazenda=locacao.fazenda,
        safra=locacao.safra,
    )

    locacao.quantidade_final = quantidade if quantidade is not None else locacao.quantidade
    locacao.valor_final = valor
    locacao.data_encerramento = encerramento
    locacao.data_vencimento = data_vencimento
    locacao.status = 'ENCERRADA'
    locacao.contas_a_pagar = conta
    locacao.save(update_fields=[
        'quantidade_final', 'valor_final', 'data_encerramento',
        'data_vencimento', 'status', 'contas_a_pagar', 'valor_total',
        'updated_at',
    ])
    return locacao


@transaction.atomic
def prorrogar_locacao_maquina(locacao, *, nova_data_fim):
    if locacao.status != 'ABERTA':
        raise ValidationError('Somente locações abertas podem ser prorrogadas.')
    if not nova_data_fim or nova_data_fim <= locacao.data_fim:
        raise ValidationError('A nova data final deve ser posterior à data final atual.')

    locacao.data_fim = nova_data_fim
    locacao.prorrogacoes += 1
    locacao.save(update_fields=['data_fim', 'prorrogacoes', 'updated_at'])
    return locacao
