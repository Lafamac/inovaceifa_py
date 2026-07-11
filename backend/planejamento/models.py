from django.db import models
from core.models import BaseModel, Fazenda, Safra
from referencias.models import TipoOperacao, GrupoTrabalhador, CriterioRateio, ContaGerencial
from cadastros.models import Talhao, Produto, Funcionario, Maquina

class PlanejamentoSafra(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.PROTECT, related_name='planejamentos')
    safra = models.ForeignKey(Safra, on_delete=models.PROTECT, related_name='planejamentos')
    descricao = models.CharField(max_length=250)
    aprovado = models.BooleanField(default=False)
    data_planejamento = models.DateField()
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Planejamento de Safra"
        verbose_name_plural = "Planejamentos de Safra"

    def __str__(self):
        status = "Aprovado" if self.aprovado else "Rascunho"
        return f"{self.descricao} - {self.fazenda.sigla} ({status})"


class OrdemServicoPlanejada(BaseModel):
    planejamento = models.ForeignKey(PlanejamentoSafra, on_delete=models.CASCADE, related_name='ordens_servico')
    tipo_operacao = models.ForeignKey(TipoOperacao, on_delete=models.PROTECT)
    data_inicio_planejada = models.DateField()
    data_fim_planejada = models.DateField()
    observacao = models.TextField(null=True, blank=True)
    funcionario = models.ForeignKey(Funcionario, null=True, blank=True, on_delete=models.SET_NULL, related_name='os_planejadas')
    trator = models.ForeignKey(Maquina, null=True, blank=True, on_delete=models.SET_NULL, related_name='os_planejadas_trator')
    implemento = models.ForeignKey(Maquina, null=True, blank=True, on_delete=models.SET_NULL, related_name='os_planejadas_implemento')

    class Meta:
        verbose_name = "Ordem de Serviço Planejada"
        verbose_name_plural = "Ordens de Serviço Planejadas"

    def __str__(self):
        return f"OS Plan: {self.tipo_operacao.nome} (Plan: {self.planejamento.id})"


class OrdemServicoPlanejadaTalhao(BaseModel):
    ordem_servico_planejada = models.ForeignKey(OrdemServicoPlanejada, on_delete=models.CASCADE, related_name='talhoes')
    talhao = models.ForeignKey(Talhao, on_delete=models.PROTECT)

    class Meta:
        verbose_name = "Talhão da OS Planejada"
        verbose_name_plural = "Talhões da OS Planejada"
        unique_together = ('ordem_servico_planejada', 'talhao', 'ativo')

    def __str__(self):
        return f"{self.ordem_servico_planejada} - Talhão {self.talhao.codigo}"


class ItemInsumoOSPlanejado(BaseModel):
    ordem_servico_planejada = models.ForeignKey(OrdemServicoPlanejada, on_delete=models.CASCADE, related_name='insumos')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    dose_planejada = models.DecimalField(max_digits=10, decimal_places=4) # L/ha, kg/ha, etc.
    quantidade_planejada = models.DecimalField(max_digits=12, decimal_places=4) # quantidade total (auto ou manual)

    class Meta:
        verbose_name = "Insumo da OS Planejada"
        verbose_name_plural = "Insumos da OS Planejada"

    def __str__(self):
        return f"{self.produto.nome_comercial} - Dose: {self.dose_planejada}"


class ParametroOperacionalOS(BaseModel):
    ordem_servico_planejada = models.ForeignKey(OrdemServicoPlanejada, on_delete=models.CASCADE, related_name='parametros')
    velocidade_planejada = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # km/h
    pressao_planejada = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # bar
    vazao_planejada = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # L/min
    tipo_bico = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        verbose_name = "Parâmetro Operacional de OS"
        verbose_name_plural = "Parâmetros Operacionais de OS"

    def __str__(self):
        return f"Parâmetros OS Plan {self.ordem_servico_planejada.id}"


class PlanejamentoMaoObraTerceiros(BaseModel):
    ordem_servico_planejada = models.ForeignKey(OrdemServicoPlanejada, on_delete=models.CASCADE, related_name='mao_obra_terceiros')
    grupo_trabalhador = models.ForeignKey(GrupoTrabalhador, on_delete=models.PROTECT)
    valor_planejado = models.DecimalField(max_digits=12, decimal_places=2)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Planejamento de Mão de Obra de Terceiros"
        verbose_name_plural = "Planejamento de Mão de Obra de Terceiros"

    def __str__(self):
        return f"Mão Obra Plan: {self.grupo_trabalhador.nome} (OS Plan: {self.ordem_servico_planejada.id})"


class PlanejamentoAdubo(BaseModel):
    planejamento = models.ForeignKey(PlanejamentoSafra, on_delete=models.CASCADE, related_name='adubacoes')
    talhao = models.ForeignKey(Talhao, on_delete=models.PROTECT)
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    cobertura = models.IntegerField() # 1, 2, 3...
    data_planejada = models.DateField()
    dose_planejada = models.DecimalField(max_digits=10, decimal_places=4) # ex: dose por planta ou por ha
    quantidade_planejada = models.DecimalField(max_digits=12, decimal_places=4) # calculada (dose * talhao.area) ou manual

    class Meta:
        verbose_name = "Planejamento de Adubação"
        verbose_name_plural = "Planejamentos de Adubação"

    def __str__(self):
        return f"Adubação Plan: {self.produto.nome_comercial} (Cobertura {self.cobertura})"


class PlanejamentoRateio(BaseModel):
    planejamento = models.ForeignKey(PlanejamentoSafra, on_delete=models.CASCADE, related_name='rateios')
    criterio_rateio = models.ForeignKey(CriterioRateio, on_delete=models.PROTECT)
    conta_gerencial = models.ForeignKey(ContaGerencial, on_delete=models.PROTECT)
    valor_planejado = models.DecimalField(max_digits=12, decimal_places=2)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Planejamento de Rateio"
        verbose_name_plural = "Planejamentos de Rateio"

    def __str__(self):
        return f"Rateio Plan: {self.conta_gerencial.nome} - Valor: {self.valor_planejado}"
