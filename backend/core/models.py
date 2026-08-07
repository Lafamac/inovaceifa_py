from django.db import models
from django.core.exceptions import ValidationError

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        abstract = True

class Proprietario(BaseModel):
    nome = models.CharField(max_length=255)
    documento = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(max_length=255, unique=True)
    celular = models.CharField(max_length=20, null=True, blank=True)
    cep = models.CharField(max_length=10, null=True, blank=True)
    endereco = models.CharField(max_length=255, null=True, blank=True)
    bairro = models.CharField(max_length=100, null=True, blank=True)
    cidade = models.CharField(max_length=100, null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_ativo = None
        if not is_new:
            try:
                old_ativo = Proprietario.objects.only('ativo').get(pk=self.pk).ativo
            except Proprietario.DoesNotExist:
                pass
        super().save(*args, **kwargs)
        if not is_new:
            if old_ativo is True and self.ativo is False:
                for fazenda in self.fazendas.filter(ativo=True):
                    fazenda.ativo = False
                    fazenda.save()
            elif old_ativo is False and self.ativo is True:
                for fazenda in self.fazendas.filter(ativo=False):
                    fazenda.ativo = True
                    fazenda.save()

    def __str__(self):
        return self.nome

class Fazenda(BaseModel):
    proprietario = models.ForeignKey(Proprietario, on_delete=models.CASCADE, related_name='fazendas')
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=10, help_text="Ex: BR, CG, SF, ST")
    cnpj_ou_produtor = models.CharField(max_length=50, null=True, blank=True)
    endereco = models.CharField(max_length=255, null=True, blank=True)
    cep = models.CharField(max_length=10, null=True, blank=True)
    telefone = models.CharField(max_length=20, null=True, blank=True)
    cidade = models.CharField(max_length=100, null=True, blank=True)
    estado = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_ativo = None
        if not is_new:
            try:
                old_ativo = Fazenda.objects.only('ativo').get(pk=self.pk).ativo
            except Fazenda.DoesNotExist:
                pass
        super().save(*args, **kwargs)
        if not is_new:
            if old_ativo is True and self.ativo is False:
                self.safras.filter(ativo=True).update(ativo=False)

                for talhao in self.talhoes.filter(ativo=True):
                    talhao.ativo = False
                    talhao.save()

                for maquina in self.maquinas.filter(ativo=True):
                    maquina.ativo = False
                    maquina.save()

                for func in self.funcionarios.filter(ativo=True):
                    func.ativo = False
                    func.save()

                self.terceirizados.filter(ativo=True).update(ativo=False)
                self.turmas_terceirizadas.filter(ativo=True).update(ativo=False)
                self.produtos.filter(ativo=True).update(ativo=False)
                self.fornecedores.filter(ativo=True).update(ativo=False)
                self.locacoes.filter(ativo=True).update(ativo=False)
                self.planejamentos.filter(ativo=True).update(ativo=False)
                self.ordens_servico_reais.filter(ativo=True).update(ativo=False)
                self.gastos_rateio_realizados.filter(ativo=True).update(ativo=False)
                self.abastecimentos.filter(ativo=True).update(ativo=False)
                self.rateios_operacionais.filter(ativo=True).update(ativo=False)
                self.pedidos_compra.filter(ativo=True).update(ativo=False)
                self.contas_a_pagar.filter(ativo=True).update(ativo=False)
                self.pedidos_venda.filter(ativo=True).update(ativo=False)
                self.contas_a_receber.filter(ativo=True).update(ativo=False)
                self.movimentacoes_estoque.filter(ativo=True).update(ativo=False)

                from django.db.models import Q
                from cadastros.models import TransferenciaAtivo
                TransferenciaAtivo.objects.filter(Q(origem=self) | Q(destino=self), ativo=True).update(ativo=False)

            elif old_ativo is False and self.ativo is True:
                self.safras.filter(ativo=False).update(ativo=True)

                for talhao in self.talhoes.filter(ativo=False):
                    talhao.ativo = True
                    talhao.save()

                for maquina in self.maquinas.filter(ativo=False):
                    maquina.ativo = True
                    maquina.save()

                for func in self.funcionarios.filter(ativo=False):
                    func.ativo = True
                    func.save()

                self.terceirizados.filter(ativo=False).update(ativo=True)
                self.turmas_terceirizadas.filter(ativo=False).update(ativo=True)
                self.produtos.filter(ativo=False).update(ativo=True)
                self.fornecedores.filter(ativo=False).update(ativo=True)
                self.locacoes.filter(ativo=False).update(ativo=True)
                self.planejamentos.filter(ativo=False).update(ativo=True)
                self.ordens_servico_reais.filter(ativo=False).update(ativo=True)
                self.gastos_rateio_realizados.filter(ativo=False).update(ativo=True)
                self.abastecimentos.filter(ativo=False).update(ativo=True)
                self.rateios_operacionais.filter(ativo=False).update(ativo=True)
                self.pedidos_compra.filter(ativo=False).update(ativo=True)
                self.contas_a_pagar.filter(ativo=False).update(ativo=True)
                self.pedidos_venda.filter(ativo=False).update(ativo=True)
                self.contas_a_receber.filter(ativo=False).update(ativo=True)
                self.movimentacoes_estoque.filter(ativo=False).update(ativo=True)

                from django.db.models import Q
                from cadastros.models import TransferenciaAtivo
                TransferenciaAtivo.objects.filter(Q(origem=self) | Q(destino=self), ativo=False).update(ativo=True)

    def __str__(self):
        return f"{self.nome} ({self.sigla})"

class Safra(BaseModel):
    fazenda = models.ForeignKey(Fazenda, on_delete=models.CASCADE, related_name='safras')
    nome = models.CharField(max_length=50, help_text="Ex: 2024/2025")
    data_inicio = models.DateField()
    data_fim = models.DateField()
    ativa = models.BooleanField(default=False)

    def clean(self):
        # Regra de negócio: Apenas uma safra ativa por fazenda
        if self.ativa:
            qs = Safra.objects.filter(fazenda=self.fazenda, ativa=True, ativo=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Já existe uma safra ativa para esta fazenda.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} - {self.fazenda.nome}"
