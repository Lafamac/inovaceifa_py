import secrets
import string

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import send_mail
from django.db import transaction

from accounts.models import Perfil, Usuario, PERFIL_OPERADOR, PERFIL_PROPRIETARIO


def generate_temporary_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def get_or_create_perfil(nivel, nome):
    perfil = Perfil.objects.filter(nivel=nivel).first()
    if perfil:
        return perfil
    return Perfil.objects.create(nivel=nivel, nome=nome)


def validate_real_email_settings():
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.locmem.EmailBackend':
        return
    if settings.EMAIL_BACKEND != 'django.core.mail.backends.smtp.EmailBackend':
        raise ImproperlyConfigured(
            'EMAIL_BACKEND deve usar django.core.mail.backends.smtp.EmailBackend para envio real.'
        )
    if not settings.EMAIL_HOST:
        raise ImproperlyConfigured('EMAIL_HOST precisa estar configurado para enviar e-mail real.')
    if not settings.DEFAULT_FROM_EMAIL:
        raise ImproperlyConfigured('DEFAULT_FROM_EMAIL precisa estar configurado.')


def send_access_email(*, recipient_email, recipient_name, profile_name, password):
    validate_real_email_settings()
    subject = 'Bem-vindo ao InovaCeifa - Seus dados de acesso'
    message = (
        f'Ola, {recipient_name}!\n\n'
        f'Sua conta de {profile_name} foi criada com sucesso no sistema InovaCeifa.\n\n'
        f'Dados de acesso:\n'
        f'- Usuario: {recipient_email}\n'
        f'- Senha temporaria: {password}\n\n'
        f'Recomendamos alterar sua senha apos o primeiro login.\n\n'
        f'Atenciosamente,\n'
        f'Equipe InovaCeifa'
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        fail_silently=False,
    )


def split_name(full_name):
    parts = full_name.strip().split(' ', 1)
    return parts[0], parts[1] if len(parts) > 1 else ''


@transaction.atomic
def create_owner_user_and_send_access_email(proprietario):
    email = proprietario.email.lower().strip()
    if Usuario.objects.filter(email__iexact=email).exists() or Usuario.objects.filter(username__iexact=email).exists():
        return None

    perfil = get_or_create_perfil(PERFIL_PROPRIETARIO, 'Proprietário')
    password = generate_temporary_password()
    first_name, last_name = split_name(proprietario.nome)

    usuario = Usuario.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        perfil=perfil,
    )
    send_access_email(
        recipient_email=email,
        recipient_name=proprietario.nome,
        profile_name='Proprietário',
        password=password,
    )
    return usuario


@transaction.atomic
def create_operator_user_and_send_access_email(funcionario):
    email = funcionario.email.lower().strip()
    if Usuario.objects.filter(email__iexact=email).exists() or Usuario.objects.filter(username__iexact=email).exists():
        return None

    perfil = get_or_create_perfil(PERFIL_OPERADOR, 'Operador')
    password = generate_temporary_password()
    first_name, last_name = split_name(funcionario.nome)

    usuario = Usuario.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        perfil=perfil,
    )
    if funcionario.fazenda:
        usuario.fazendas_permitidas.add(funcionario.fazenda)

    send_access_email(
        recipient_email=email,
        recipient_name=funcionario.nome,
        profile_name='Operador',
        password=password,
    )
    return usuario
