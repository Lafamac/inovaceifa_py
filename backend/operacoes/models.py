from django.db import models
from core.models import BaseModel, Fazenda, Safra
from referencias.models import TipoOperacao, GrupoTrabalhador, CriterioRateio, ContaGerencial, AtividadeEducampo
from cadastros.models import Talhao, Produto, Maquina, Funcionario, TurmaTerceirizada

class OrdemServico(BaseModel):
    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('APROVADA', 'Aprovada'),
        ('EM_EXECUCAO', 'Em Execução'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]

    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='ordens_servico_reais')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='ordens_servico_reais')
    tipo_operacao = models.ForeignKey(TipoOperacao, on_delete=models.PROTECT)
    data_inicio_real = models.DateField(null=True, blank=True)
    data_fim_real = models.DateField(null=True, blank=True)
    data_inicio_planejada = models.DateField()
    data_fim_planejada = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='APROVADA')
    observacao = models.TextField(null=True, blank=True)
    origem_planejada = models.ForeignKey('planejamento.OrdemServicoPlanejada', on_delete=models.SET_NULL, null=True, blank=True, related_name='execucoes')
    funcionario_planejado = models.ForeignKey(Funcionario, null=True, blank=True, on_delete=models.SET_NULL, related_name='ordens_servico_plan')
    trator_planejado = models.ForeignKey(Maquina, null=True, blank=True, on_delete=models.SET_NULL, related_name='ordens_servico_trator_plan')
    implemento_planejado = models.ForeignKey(Maquina, null=True, blank=True, on_delete=models.SET_NULL, related_name='ordens_servico_implemento_plan')

    class Meta:
        verbose_name = "Ordem de Serviço"
        verbose_name_plural = "Ordens de Serviço"

    def __str__(self):
        return f"OS Real {self.id}: {self.tipo_operacao.nome} ({self.status})"


class OrdemServicoTalhao(BaseModel):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='talhoes')
    talhao = models.ForeignKey(Talhao, on_delete=models.PROTECT)

    class Meta:
        verbose_name = "Talhão da OS Real"
        verbose_name_plural = "Talões da OS Real"
        unique_together = ('ordem_servico', 'talhao', 'ativo')

    def __str__(self):
        return f"OS {self.ordem_servico.id} - Talhão {self.talhao.codigo}"


class ItemInsumoOSReal(BaseModel):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='insumos')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    dose_planejada = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    quantidade_planejada = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    dose_real = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    quantidade_real = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)

    class Meta:
        verbose_name = "Insumo da OS Real"
        verbose_name_plural = "Insumos da OS Real"

    def __str__(self):
        return f"{self.produto.nome_comercial} (OS: {self.ordem_servico.id})"


class ApontamentoOperacao(BaseModel):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='apontamentos')
    data_apontamento = models.DateField()
    clima = models.CharField(max_length=50, null=True, blank=True)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Apontamento de Operação"
        verbose_name_plural = "Apontamentos de Operação"

    def __str__(self):
        return f"Apontamento OS {self.ordem_servico.id} em {self.data_apontamento}"


class ApontamentoInsumo(BaseModel):
    apontamento = models.ForeignKey(ApontamentoOperacao, on_delete=models.CASCADE, related_name='insumos')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade_total = models.DecimalField(max_digits=12, decimal_places=4)
    dose_realizada = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    class Meta:
        verbose_name = "Apontamento de Insumo"
        verbose_name_plural = "Apontamentos de Insumo"

    def __str__(self):
        return f"{self.quantidade_total} de {self.produto.nome_comercial} (Apt {self.apontamento.id})"


class ApontamentoMaquina(BaseModel):
    apontamento = models.ForeignKey(ApontamentoOperacao, on_delete=models.CASCADE, related_name='maquinas')
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT)
    horimetro_inicial = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    horimetro_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "Apontamento de Máquina"
        verbose_name_plural = "Apontamentos de Máquina"

    def __str__(self):
        return f"{self.maquina.codigo} (Apt {self.apontamento.id})"


class ApontamentoFuncionario(BaseModel):
    apontamento = models.ForeignKey(ApontamentoOperacao, on_delete=models.CASCADE, related_name='funcionarios')
    funcionario = models.ForeignKey(Funcionario, on_delete=models.PROTECT)
    horas_trabalhadas = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "Apontamento de Funcionário"
        verbose_name_plural = "Apontamentos de Funcionário"

    def __str__(self):
        return f"{self.funcionario.nome} (Apt {self.apontamento.id})"


class AuditoriaOrdemServico(BaseModel):
    TIPO_DESVIO_CHOICES = [
        ('PRODUTO_NAO_PLANEJADO', 'Produto Não Planejado'),
        ('SUBDOSE', 'Subdose'),
        ('SUPERDOSE', 'Superdose'),
        ('FORA_DA_JANELA', 'Fora da Janela Planejada'),
        ('OUTRO', 'Outro')
    ]
    
    STATUS_AUDITORIA_CHOICES = [
        ('PENDENTE', 'Pendente de Avaliação'),
        ('JUSTIFICADO', 'Justificado'),
        ('REPROVADO', 'Reprovado')
    ]

    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name='auditorias')
    tipo_desvio = models.CharField(max_length=50, choices=TIPO_DESVIO_CHOICES)
    descricao_desvio = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_AUDITORIA_CHOICES, default='PENDENTE')
    
    class Meta:
        verbose_name = "Auditoria de Ordem de Serviço"
        verbose_name_plural = "Auditorias de Ordem de Serviço"

    def __str__(self):
        return f"Auditoria {self.get_tipo_desvio_display()} - OS {self.ordem_servico.id}"

class GastoRateioRealizado(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='gastos_rateio_realizados')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='gastos_rateio_realizados')
    criterio_rateio = models.ForeignKey(CriterioRateio, on_delete=models.PROTECT)
    conta_gerencial = models.ForeignKey(ContaGerencial, on_delete=models.PROTECT)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data_gasto = models.DateField()
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Gasto de Rateio Realizado"
        verbose_name_plural = "Gastos de Rateio Realizados"

    def __str__(self):
        return f"{self.conta_gerencial.nome} - {self.valor} ({self.data_gasto})"


class RateioTalhao(BaseModel):
    gasto_rateio = models.ForeignKey(GastoRateioRealizado, on_delete=models.CASCADE, related_name='rateios_talhoes')
    talhao = models.ForeignKey(Talhao, on_delete=models.PROTECT)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    percentual = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        verbose_name = "Rateio por Talhão"
        verbose_name_plural = "Rateios por Talhão"
        unique_together = ('gasto_rateio', 'talhao', 'ativo')

    def __str__(self):
        return f"{self.talhao.codigo} - {self.valor} ({self.percentual}%)"


class AbastecimentoMaquina(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='abastecimentos')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='abastecimentos')
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT)
    data_abastecimento = models.DateField()
    combustivel = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=4)
    valor_total = models.DecimalField(max_digits=12, decimal_places=2)
    horimetro = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Abastecimento de Máquina"
        verbose_name_plural = "Abastecimentos de Máquina"

    def __str__(self):
        return f"{self.maquina.codigo} - {self.quantidade}L ({self.data_abastecimento})"


class RateioOperacional(BaseModel):
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='rateios_operacionais')
    data = models.DateField()
    fazenda_rateio = models.ForeignKey(Fazenda, on_delete=models.SET_NULL, null=True, blank=True, related_name='rateios_operacionais')
    atividade_educampo = models.ForeignKey(AtividadeEducampo, on_delete=models.PROTECT)

    # Planejado
    descricao_plan = models.CharField(max_length=255, null=True, blank=True)
    funcionario_plan = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True, related_name='funcionario_plan_rateios')
    horas_homem_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_hora_homem_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_homem_plan = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    trator_plan = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='trator_plan_rateios')
    implemento_plan = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='implemento_plan_rateios')
    horas_maq_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_hora_maq_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_maq_plan = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    combustivel_plan = models.ForeignKey(Produto, on_delete=models.SET_NULL, null=True, blank=True, related_name='combustivel_plan_rateios')
    diesel_gasto_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_diesel_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_diesel_plan = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    qtd_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_unitario_plan = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_plan = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    # Realizado
    descricao_real = models.CharField(max_length=255, null=True, blank=True)
    funcionario_real = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True, related_name='funcionario_real_rateios')
    horas_homem_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_hora_homem_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_homem_real = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    trator_real = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='trator_real_rateios')
    implemento_real = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='implemento_real_rateios')
    horas_maq_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_hora_trator_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_hora_implemento_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_maq_real = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    combustivel_real = models.ForeignKey(Produto, on_delete=models.SET_NULL, null=True, blank=True, related_name='combustivel_real_rateios')
    diesel_gasto_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_diesel_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_diesel_real = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    qtd_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_unitario_real = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_total_real = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = "Rateio Operacional"
        verbose_name_plural = "Rateios Operacionais"

    def save(self, *args, **kwargs):
        # Planejado
        if self.horas_homem_plan is not None and self.valor_hora_homem_plan is not None:
            self.valor_total_homem_plan = self.horas_homem_plan * self.valor_hora_homem_plan
        if self.horas_maq_plan is not None and self.valor_hora_maq_plan is not None:
            self.valor_total_maq_plan = self.horas_maq_plan * self.valor_hora_maq_plan
        if self.diesel_gasto_plan is not None and self.valor_diesel_plan is not None:
            self.valor_total_diesel_plan = self.diesel_gasto_plan * self.valor_diesel_plan
        if self.qtd_plan is not None and self.valor_unitario_plan is not None:
            self.valor_total_plan = self.qtd_plan * self.valor_unitario_plan

        # Realizado
        if self.horas_homem_real is not None and self.valor_hora_homem_real is not None:
            self.valor_total_homem_real = self.horas_homem_real * self.valor_hora_homem_real
        if self.horas_maq_real is not None:
            trator_v = self.valor_hora_trator_real or 0
            imple_v = self.valor_hora_implemento_real or 0
            self.valor_total_maq_real = self.horas_maq_real * (trator_v + imple_v)
        if self.diesel_gasto_real is not None and self.valor_diesel_real is not None:
            self.valor_total_diesel_real = self.diesel_gasto_real * self.valor_diesel_real
        if self.qtd_real is not None and self.valor_unitario_real is not None:
            self.valor_total_real = self.qtd_real * self.valor_unitario_real

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rateio {self.id} em {self.data} - {self.atividade_educampo.nome}"


class ApontamentoTurma(BaseModel):
    apontamento = models.ForeignKey(ApontamentoOperacao, on_delete=models.CASCADE, related_name='turmas')
    turma = models.ForeignKey(TurmaTerceirizada, on_delete=models.PROTECT)
    valor_total = models.DecimalField(max_digits=12, decimal_places=2)
    data_vencimento = models.DateField(help_text="Data de vencimento para o Contas a Pagar")
    contas_a_pagar = models.ForeignKey('financeiro.ContasAPagar', on_delete=models.SET_NULL, null=True, blank=True, related_name='apontamento_turma')

    class Meta:
        verbose_name = "Apontamento de Turma Terceirizada"
        verbose_name_plural = "Apontamentos de Turmas Terceirizadas"

    def save(self, *args, **kwargs):
        from financeiro.models import ContasAPagar
        desc = f"PAGAMENTO TURMA: {self.turma.nome} - OS #{self.apontamento.ordem_servico.id}"
        
        if not self.contas_a_pagar:
            cp = ContasAPagar.objects.create(
                descricao=desc.upper(),
                valor=self.valor_total,
                data_vencimento=self.data_vencimento,
                status='PENDENTE',
                fazenda=self.apontamento.ordem_servico.fazenda,
                safra=self.apontamento.ordem_servico.safra
            )
            self.contas_a_pagar = cp
        else:
            cp = self.contas_a_pagar
            cp.descricao = desc.upper()
            cp.valor = self.valor_total
            cp.data_vencimento = self.data_vencimento
            cp.fazenda = self.apontamento.ordem_servico.fazenda
            cp.safra = self.apontamento.ordem_servico.safra
            cp.ativo = self.ativo
            cp.save()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.turma.nome} - R$ {self.valor_total} (Apt {self.apontamento.id})"
