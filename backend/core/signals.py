from django.db.models.signals import post_save
from django.dispatch import receiver

from cadastros.models import Funcionario
from core.models import Proprietario
from core.services import (
    create_operator_user_and_send_access_email,
    create_owner_user_and_send_access_email,
)


@receiver(post_save, sender=Proprietario)
def create_usuario_for_proprietario(sender, instance, created, **kwargs):
    if created and instance.email:
        create_owner_user_and_send_access_email(instance)


@receiver(post_save, sender=Funcionario)
def create_usuario_for_funcionario(sender, instance, created, **kwargs):
    if instance.criar_usuario and instance.email:
        create_operator_user_and_send_access_email(instance)
