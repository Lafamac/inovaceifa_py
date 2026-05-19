from django.db import models
from core.models import BaseModel

class Cultura(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class TipoItem(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class StatusCultivo(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class TipoIrrigacao(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class ResistenciaFerrugem(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class StatusOrdemServico(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class Modalidade(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class TipoRateio(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class ContaGerencial(BaseModel):
    codigo = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=150)

    def __str__(self):
        return f"{self.codigo} - {self.nome}"

class TipoDestinacao(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class GrupoTrabalhador(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class ClassificacaoProduto(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class GrupoQuimico(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class UnidadeMedida(BaseModel):
    sigla = models.CharField(max_length=10, unique=True)
    nome = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.sigla} ({self.nome})"

class AtividadeEducampo(BaseModel):
    nome = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return self.nome

class CriterioRateio(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class TipoOperacao(BaseModel):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome
