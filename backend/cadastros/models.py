from django.db import models
from core.models import BaseModel, Fazenda, Safra
from referencias.models import (
    Cultura, TipoIrrigacao, StatusCultivo, ResistenciaFerrugem,
    TipoItem, GrupoTrabalhador, ClassificacaoProduto, GrupoQuimico, UnidadeMedida
)

class Talhao(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='talhoes')
    codigo = models.CharField(max_length=50) # Ex: "01"
    nome = models.CharField(max_length=150) # Ex: "01 - BR/Catuaí 62"
    area = models.DecimalField(max_digits=10, decimal_places=2) # em hectares
    tipo_irrigacao = models.ForeignKey(TipoIrrigacao, on_delete=models.PROTECT)
    cultura = models.ForeignKey(Cultura, on_delete=models.PROTECT)
    espacamento_rua = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    espacamento_planta = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    estande = models.IntegerField(null=True, blank=True) # plantas/ha
    numero_plantas = models.IntegerField(null=True, blank=True)
    material_genetico = models.CharField(max_length=150, null=True, blank=True)
    resistencia_ferrugem = models.ForeignKey(ResistenciaFerrugem, on_delete=models.PROTECT, null=True, blank=True)
    status_cultivo = models.ForeignKey(StatusCultivo, on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        verbose_name = "Talhão"
        verbose_name_plural = "Talhões"
        unique_together = ('fazenda', 'codigo', 'ativo')

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
    tipo = models.ForeignKey(TipoItem, on_delete=models.PROTECT) # Maquina, Implemento, etc.

    class Meta:
        verbose_name = "Máquina"
        verbose_name_plural = "Máquinas"
        unique_together = ('fazenda', 'codigo', 'ativo')

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

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"

    def __str__(self):
        return self.nome


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

    class Meta:
        verbose_name = "Terceirizado"
        verbose_name_plural = "Terceirizados"

    def __str__(self):
        return self.nome


class TurmaTerceirizada(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='turmas_terceirizadas')
    nome = models.CharField(max_length=100)
    responsavel = models.CharField(max_length=255, null=True, blank=True)
    integrantes = models.ManyToManyField(Terceirizado, blank=True, related_name='turmas')

    class Meta:
        verbose_name = "Turma Terceirizada"
        verbose_name_plural = "Turmas Terceirizadas"

    def __str__(self):
        return self.nome


class Produto(BaseModel):
    codigo = models.CharField(max_length=50, unique=True, null=True, blank=True)
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
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Movimentação de Estoque"
        verbose_name_plural = "Movimentações de Estoque"

    def __str__(self):
        return f"{self.tipo_movimento} - {self.produto.nome_comercial} - {self.quantidade} ({self.fazenda.sigla})"
