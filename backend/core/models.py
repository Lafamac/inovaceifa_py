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
