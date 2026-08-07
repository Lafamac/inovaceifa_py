from django.db import models
from core.models import BaseModel, Fazenda, Safra
from referencias.models import (
    Cultura, TipoIrrigacao, StatusCultivo, ResistenciaFerrugem,
    TipoMaquina, GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida
)

class Talhao(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='talhoes')
    codigo = models.CharField(max_length=50) # Ex: "01"
    nome = models.CharField(max_length=150) # Ex: "01 - BR/Catuaí 62"
    area = models.DecimalField(max_digits=12, decimal_places=5) # em hectares
    tipo_irrigacao = models.ForeignKey(TipoIrrigacao, on_delete=models.PROTECT)
    cultura = models.ForeignKey(Cultura, on_delete=models.PROTECT)
    espacamento_rua = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    espacamento_planta = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    estande = models.IntegerField(null=True, blank=True) # plantas/ha
    numero_plantas = models.IntegerField(null=True, blank=True)
    mes_ano_cultivo = models.CharField(max_length=7, null=True, blank=True, help_text="Mês/Ano de Cultivo (MM/AAAA)")
    material_genetico = models.CharField(max_length=150, null=True, blank=True)
    resistencia_ferrugem = models.ForeignKey(ResistenciaFerrugem, on_delete=models.PROTECT, null=True, blank=True)
    status_cultivo = models.ForeignKey(StatusCultivo, on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        verbose_name = "Talhão"
        verbose_name_plural = "Talhões"
        unique_together = ('fazenda', 'codigo', 'ativo')

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_ativo = None
        if not is_new:
            try:
                old_ativo = Talhao.objects.only('ativo').get(pk=self.pk).ativo
            except Talhao.DoesNotExist:
                pass
        super().save(*args, **kwargs)
        if not is_new:
            if old_ativo is True and self.ativo is False:
                self.estimativas.filter(ativo=True).update(ativo=False)
            elif old_ativo is False and self.ativo is True:
                self.estimativas.filter(ativo=False).update(ativo=True)

    def __str__(self):
        return f"{self.nome} ({self.fazenda.sigla})"


class EstimativaProducaoTalhao(BaseModel):
    talhao = models.ForeignKey(Talhao, on_delete=models.PROTECT, related_name='estimativas')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='estimativas_talhoes')
    estimativa_sacas = models.DecimalField(max_digits=10, decimal_places=2)
    produtividade_esperada = models.DecimalField(max_digits=10, decimal_places=2) # sacas/ha

    class Meta:
        verbose_name = "Estimativa de Produção"
        verbose_name_plural = "Estimativas de Produção"
        unique_together = ('talhao', 'safra', 'ativo')

    def __str__(self):
        return f"Estimativa {self.safra.nome} - {self.talhao.nome}"


class Maquina(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='maquinas')
    codigo = models.CharField(max_length=50) # Ex: "TR-01", "MF-265"
    descricao = models.CharField(max_length=150)
    marca = models.CharField(max_length=100, null=True, blank=True)
    modelo = models.CharField(max_length=100, null=True, blank=True)
    ano_fabricacao = models.IntegerField(null=True, blank=True)
    tipo = models.ForeignKey(TipoMaquina, on_delete=models.PROTECT) # Trator, Colhedora, Caminhão, etc.
    propria = models.BooleanField(default=True)
    horimetro_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Horímetro inicial no cadastro da máquina")

    class Meta:
        verbose_name = "Máquina"
        verbose_name_plural = "Máquinas"
        unique_together = ('fazenda', 'codigo', 'ativo')

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_ativo = None
        if not is_new:
            try:
                old_ativo = Maquina.objects.only('ativo').get(pk=self.pk).ativo
            except Maquina.DoesNotExist:
                pass
        super().save(*args, **kwargs)
        if not is_new:
            if old_ativo is True and self.ativo is False:
                self.manutencoes.filter(ativo=True).update(ativo=False)
            elif old_ativo is False and self.ativo is True:
                self.manutencoes.filter(ativo=False).update(ativo=True)

    def __str__(self):
        return f"{self.codigo} - {self.descricao}"


class CustoMensalMaquina(BaseModel):
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT, related_name='custos_mensais')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='custos_maquinas')
    mes = models.IntegerField()
    ano = models.IntegerField()
    custo_oficina = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    custo_abastecimento = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    horas_trabalhadas = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        verbose_name = "Custo Mensal de Máquina"
        verbose_name_plural = "Custos Mensais de Máquinas"
        unique_together = ('maquina', 'safra', 'mes', 'ano', 'ativo')

    def __str__(self):
        return f"{self.maquina.codigo} - {self.mes}/{self.ano}"


class Funcionario(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='funcionarios')
    nome = models.CharField(max_length=255)
    cpf = models.CharField(max_length=20, null=True, blank=True)
    cargo = models.CharField(max_length=100, null=True, blank=True)
    grupo_trabalhador = models.ForeignKey(GrupoTrabalhador, on_delete=models.PROTECT)
    email = models.EmailField(max_length=255, null=True, blank=True)
    criar_usuario = models.BooleanField(default=False)
    salario = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    encargos = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"

    def __str__(self):
        return self.nome

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_ativo = None
        if not is_new:
            try:
                old_ativo = Funcionario.objects.only('ativo').get(pk=self.pk).ativo
            except Funcionario.DoesNotExist:
                pass

        # Calculate encargos dynamically
        try:
            from referencias.models import EncargoFolha
            from decimal import Decimal
            total_encargo_percent = EncargoFolha.objects.filter(ativo=True).aggregate(
                total=models.Sum('valor')
            )['total'] or Decimal('0.00')
            self.encargos = self.salario * (total_encargo_percent / Decimal('100.00'))
        except Exception:
            pass

        super().save(*args, **kwargs)

        if not is_new:
            if old_ativo is True and self.ativo is False:
                self.salarios.filter(ativo=True).update(ativo=False)
            elif old_ativo is False and self.ativo is True:
                self.salarios.filter(ativo=False).update(ativo=True)

        try:
            from core.models import Safra
            from cadastros.models import SalarioMensal
            
            safra = Safra.objects.filter(fazenda=self.fazenda, ativa=True, ativo=True).first()
            if safra:
                current_date = safra.data_inicio
                end_date = safra.data_fim
                while current_date <= end_date:
                    SalarioMensal.objects.update_or_create(
                        funcionario=self,
                        safra=safra,
                        mes=current_date.month,
                        ano=current_date.year,
                        defaults={
                            'salario_base': self.salario,
                            'encargos': self.encargos,
                            'ativo': self.ativo
                        }
                    )
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
        except Exception:
            pass


class SalarioMensal(BaseModel):
    funcionario = models.ForeignKey(Funcionario, on_delete=models.PROTECT, related_name='salarios')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='salarios_funcionarios')
    mes = models.IntegerField()
    ano = models.IntegerField()
    salario_base = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    encargos = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    beneficios = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        verbose_name = "Salário Mensal"
        verbose_name_plural = "Salários Mensais"
        unique_together = ('funcionario', 'safra', 'mes', 'ano', 'ativo')

    def __str__(self):
        return f"{self.funcionario.nome} - {self.mes}/{self.ano}"


class Terceirizado(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='terceirizados')
    nome = models.CharField(max_length=255)
    documento = models.CharField(max_length=20, null=True, blank=True) # CPF ou CNPJ
    cargo = models.CharField(max_length=100, null=True, blank=True)
    salario = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    encargos = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        verbose_name = "Terceirizado"
        verbose_name_plural = "Terceirizados"

    def __str__(self):
        return self.nome

    def save(self, *args, **kwargs):
        try:
            from referencias.models import EncargoFolha
            from decimal import Decimal
            total_encargo_percent = EncargoFolha.objects.filter(ativo=True).aggregate(
                total=models.Sum('valor')
            )['total'] or Decimal('0.00')
            self.encargos = self.salario * (total_encargo_percent / Decimal('100.00'))
        except Exception:
            pass
        super().save(*args, **kwargs)


class TurmaTerceirizada(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='turmas_terceirizadas')
    nome = models.CharField(max_length=100)
    responsavel = models.CharField(max_length=255, null=True, blank=True)
    integrantes = models.ManyToManyField(Terceirizado, blank=True, related_name='turmas')
    qtd_pessoas = models.IntegerField(default=0)


    class Meta:
        verbose_name = "Turma Terceirizada"
        verbose_name_plural = "Turmas Terceirizadas"

    def __str__(self):
        return self.nome


class Produto(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='produtos', null=True, blank=True)
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='produtos', null=True, blank=True)
    codigo = models.CharField(max_length=50, null=True, blank=True)
    nome_comercial = models.CharField(max_length=150)
    unidade = models.ForeignKey(UnidadeMedida, on_delete=models.PROTECT)
    classificacao = models.ForeignKey(ClassificacaoProduto, on_delete=models.PROTECT)
    grupo_quimico = models.ForeignKey(GrupoQuimico, on_delete=models.PROTECT, null=True, blank=True)
    concentracao = models.CharField(max_length=100, null=True, blank=True)
    periodo_carencia = models.IntegerField(null=True, blank=True) # dias
    alvo = models.CharField(max_length=255, null=True, blank=True)
    recomendacoes_tecnicas = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Produto/Insumo"
        verbose_name_plural = "Produtos/Insumos"
        unique_together = (('fazenda', 'safra', 'codigo', 'ativo'),)

    def __str__(self):
        return self.nome_comercial


class EstoqueMovimento(BaseModel):
    TIPO_MOVIMENTO_CHOICES = (
        ('ENTRADA', 'Entrada'),
        ('SAIDA', 'Saída'),
        ('AJUSTE', 'Ajuste'),
        ('TRANSFERENCIA', 'Transferência'),
    )

    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='movimentacoes_estoque')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='movimentacoes_estoque')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT, related_name='movimentacoes')
    tipo_movimento = models.CharField(max_length=20, choices=TIPO_MOVIMENTO_CHOICES)
    quantidade = models.DecimalField(max_digits=12, decimal_places=4)
    valor_unitario = models.DecimalField(max_digits=12, decimal_places=4, default=0.0000)
    valor_total = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    data_movimento = models.DateField()
    documento_referencia = models.CharField(max_length=100, null=True, blank=True) # NFe ou ID de OS
    origem_transferencia = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='transferencias_enviadas', null=True, blank=True)
    destino_transferencia = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='transferencias_recebidas', null=True, blank=True)
    transferencia_vinculada = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='vinculos')
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Movimentação de Estoque"
        verbose_name_plural = "Movimentações de Estoque"

    def __str__(self):
        return f"{self.tipo_movimento} - {self.produto.nome_comercial} - {self.quantidade} ({self.fazenda.sigla})"


class TransferenciaAtivo(BaseModel):
    TIPO_ATIVO_CHOICES = (
        ('MAQUINA', 'Máquina'),
        ('FUNCIONARIO', 'Funcionário'),
    )
    tipo_ativo = models.CharField(max_length=20, choices=TIPO_ATIVO_CHOICES)
    maquina = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='transferencias')
    funcionario = models.ForeignKey(Funcionario, on_delete=models.SET_NULL, null=True, blank=True, related_name='transferencias')
    origem = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='transferencias_ativos_enviadas')
    destino = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='transferencias_ativos_recebidas')
    data_transferencia = models.DateField()
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Transferência de Ativo"
        verbose_name_plural = "Transferências de Ativos"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.origem == self.destino:
            raise ValidationError("A fazenda de origem e destino devem ser diferentes.")
        if self.origem.proprietario != self.destino.proprietario:
            raise ValidationError("As fazendas devem pertencer ao mesmo proprietário.")
        if self.tipo_ativo == 'MAQUINA':
            if not self.maquina:
                raise ValidationError("Máquina é obrigatória para transferência de máquina.")
            if self.maquina.fazenda != self.origem:
                raise ValidationError("A máquina não pertence à fazenda de origem.")
        elif self.tipo_ativo == 'FUNCIONARIO':
            if not self.funcionario:
                raise ValidationError("Funcionário é obrigatório para transferência de funcionário.")
            if self.funcionario.fazenda != self.origem:
                raise ValidationError("O funcionário não pertence à fazenda de origem.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        if self.tipo_ativo == 'MAQUINA' and self.maquina:
            self.maquina.fazenda = self.destino
            self.maquina.save()
        elif self.tipo_ativo == 'FUNCIONARIO' and self.funcionario:
            self.funcionario.fazenda = self.destino
            self.funcionario.save()

    def __str__(self):
        ativo_nome = self.maquina.codigo if self.tipo_ativo == 'MAQUINA' and self.maquina else (self.funcionario.nome if self.funcionario else '')
        return f"{self.tipo_ativo} - {ativo_nome} de {self.origem.sigla} para {self.destino.sigla}"


class LocacaoMaquina(BaseModel):
    TIPO_COBRANCA_CHOICES = (
        ('DIA', 'Diária'),
        ('HORA', 'Hora'),
        ('MES', 'Mês'),
        ('OUTRO', 'Outro'),
    )
    STATUS_CHOICES = (
        ('ABERTA', 'Aberta'),
        ('ENCERRADA', 'Encerrada'),
        ('CANCELADA', 'Cancelada'),
    )
    maquina = models.ForeignKey(TipoMaquina, on_delete=models.PROTECT, related_name='locacoes')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='locacoes')
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='locacoes')
    tipo_cobranca = models.CharField(max_length=20, choices=TIPO_COBRANCA_CHOICES)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Quantidade prevista de dias, horas ou meses")
    valor_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    valor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    quantidade_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_final = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    data_encerramento = models.DateField(null=True, blank=True)
    data_vencimento = models.DateField(null=True, blank=True, help_text="Data de vencimento definida ao encerrar a locação")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ABERTA')
    prorrogacoes = models.PositiveIntegerField(default=0)
    observacao = models.TextField(null=True, blank=True)
    contas_a_pagar = models.ForeignKey('financeiro.ContasAPagar', on_delete=models.SET_NULL, null=True, blank=True, related_name='locacao_maquina')

    class Meta:
        verbose_name = "Locação de Máquina"
        verbose_name_plural = "Locações de Máquinas"

    def save(self, *args, **kwargs):
        self.valor_total = (self.quantidade or 0) * self.valor_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Locação {self.maquina.nome} - {self.safra.nome}"


class ManutencaoMaquina(BaseModel):
    maquina = models.ForeignKey(Maquina, on_delete=models.PROTECT, related_name='manutencoes')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='manutencoes')
    data = models.DateField()
    descricao = models.TextField()
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data_vencimento = models.DateField(null=True, blank=True, help_text="Data de vencimento para o Contas a Pagar")
    nota_fiscal = models.CharField(max_length=50, null=True, blank=True, help_text="Número da Nota Fiscal")
    contas_a_pagar = models.ForeignKey('financeiro.ContasAPagar', on_delete=models.SET_NULL, null=True, blank=True, related_name='manutencao_maquina')

    class Meta:
        verbose_name = "Manutenção de Máquina"
        verbose_name_plural = "Manutenções de Máquinas"

    def save(self, *args, **kwargs):
        from financeiro.models import ContasAPagar
        nf_str = f" NF: {self.nota_fiscal}" if self.nota_fiscal else ""
        desc = f"MANUTENÇÃO MÁQUINA: {self.maquina.codigo} - {self.descricao}{nf_str}"
        venc = self.data_vencimento or self.data
        
        if not self.contas_a_pagar:
            cp = ContasAPagar.objects.create(
                descricao=desc.upper(),
                valor=self.valor,
                data_vencimento=venc,
                status='PENDENTE',
                fazenda=self.maquina.fazenda,
                safra=self.safra
            )
            self.contas_a_pagar = cp
        else:
            cp = self.contas_a_pagar
            cp.descricao = desc.upper()
            cp.valor = self.valor
            cp.data_vencimento = venc
            cp.fazenda = self.maquina.fazenda
            cp.safra = self.safra
            cp.ativo = self.ativo
            cp.save()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Manutenção {self.maquina.codigo} - {self.data}"


class Fornecedor(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='fornecedores')
    nome = models.CharField(max_length=255)
    documento = models.CharField(max_length=20, null=True, blank=True) # CNPJ / CPF
    endereco = models.CharField(max_length=255, null=True, blank=True)
    bairro = models.CharField(max_length=100, null=True, blank=True)
    cidade = models.CharField(max_length=100, null=True, blank=True)
    estado = models.CharField(max_length=2, null=True, blank=True)
    telefone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    data_ultima_compra = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Fornecedor"
        verbose_name_plural = "Fornecedores"
        unique_together = ('fazenda', 'nome', 'ativo')

    def __str__(self):
        return self.nome



