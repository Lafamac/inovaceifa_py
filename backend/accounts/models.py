from django.db import models
from django.contrib.auth.models import AbstractUser
from core.models import BaseModel

PERFIL_SUPERUSUARIO = 1
PERFIL_PROPRIETARIO = 2
PERFIL_OPERADOR = 3

class Perfil(BaseModel):
    PERFIL_CHOICES = (
        (PERFIL_SUPERUSUARIO, 'Superusuário'),
        (PERFIL_PROPRIETARIO, 'Proprietário'),
        (PERFIL_OPERADOR, 'Operador'),
    )
    nome = models.CharField(max_length=50)
    nivel = models.IntegerField(choices=PERFIL_CHOICES, unique=True)

    def __str__(self):
        return self.nome

class Usuario(AbstractUser, BaseModel):
    perfil = models.ForeignKey(Perfil, on_delete=models.PROTECT, null=True, blank=True)
    fazendas_permitidas = models.ManyToManyField('core.Fazenda', blank=True, related_name='usuarios')

    def __str__(self):
        return self.email or self.username
