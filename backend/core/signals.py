import secrets
import string
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Proprietario
from cadastros.models import Funcionario
from accounts.models import Usuario, Perfil, PERFIL_PROPRIETARIO, PERFIL_OPERADOR

@receiver(post_save, sender=Proprietario)
def create_usuario_for_proprietario(sender, instance, created, **kwargs):
    if created:
        # Apenas criar se o proprietário tiver um e-mail informado
        if not instance.email:
            return

        email = instance.email.lower().strip()
        
        # Procurar por perfil do tipo PROPRIETARIO (perfil_id=2)
        try:
            perfil_proprietario = Perfil.objects.get(nivel=PERFIL_PROPRIETARIO)
        except Perfil.DoesNotExist:
            # Caso o perfil não exista na base, buscar ou criar
            perfil_proprietario, _ = Perfil.objects.get_or_create(
                nivel=PERFIL_PROPRIETARIO,
                defaults={'nome': 'Proprietário'}
            )

        # Verificar se o usuário já existe com esse e-mail ou username
        if Usuario.objects.filter(email=email).exists() or Usuario.objects.filter(username=email).exists():
            return

        # Gerar uma senha aleatória segura
        alphabet = string.ascii_letters + string.digits
        senha = ''.join(secrets.choice(alphabet) for _ in range(8))

        # Dividir o nome do proprietário para primeiro/último nome
        nome_partes = instance.nome.split(' ', 1)
        first_name = nome_partes[0]
        last_name = nome_partes[1] if len(nome_partes) > 1 else ''

        # Criar o Usuário
        usuario = Usuario.objects.create_user(
            username=email,
            email=email,
            password=senha,
            first_name=first_name,
            last_name=last_name,
            perfil=perfil_proprietario
        )

        # Enviar e-mail notificando o proprietário
        subject = 'Bem-vindo ao InovaCeifa - Seus dados de acesso'
        message = (
            f"Olá, {instance.nome}!\n\n"
            f"Sua conta de Proprietário foi criada com sucesso no sistema InovaCeifa.\n\n"
            f"Aqui estão seus dados de acesso:\n"
            f"- Usuário: {email}\n"
            f"- Senha temporária: {senha}\n\n"
            f"Recomendamos alterar sua senha após o primeiro login.\n\n"
            f"Atenciosamente,\n"
            f"Equipe InovaCeifa"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # Em desenvolvimento ou se falhar o envio do e-mail, logamos o erro, mas não travamos a execução
            print(f"Erro ao enviar e-mail para {email}: {e}")


@receiver(post_save, sender=Funcionario)
def create_usuario_for_funcionario(sender, instance, created, **kwargs):
    # Apenas criar se estiver marcado para criar usuário e tiver e-mail
    if instance.criar_usuario and instance.email:
        email = instance.email.lower().strip()
        
        # Procurar por perfil do tipo OPERADOR (perfil_id=3)
        try:
            perfil_operador = Perfil.objects.get(nivel=PERFIL_OPERADOR)
        except Perfil.DoesNotExist:
            perfil_operador, _ = Perfil.objects.get_or_create(
                nivel=PERFIL_OPERADOR,
                defaults={'nome': 'Operador'}
            )

        # Verificar se o usuário já existe com esse e-mail ou username
        if Usuario.objects.filter(email=email).exists() or Usuario.objects.filter(username=email).exists():
            return

        # Gerar uma senha aleatória segura
        alphabet = string.ascii_letters + string.digits
        senha = ''.join(secrets.choice(alphabet) for _ in range(8))

        # Dividir o nome do funcionário para primeiro/último nome
        nome_partes = instance.nome.split(' ', 1)
        first_name = nome_partes[0]
        last_name = nome_partes[1] if len(nome_partes) > 1 else ''

        # Criar o Usuário
        usuario = Usuario.objects.create_user(
            username=email,
            email=email,
            password=senha,
            first_name=first_name,
            last_name=last_name,
            perfil=perfil_operador
        )

        # Associar a fazenda permitida do funcionário
        if instance.fazenda:
            usuario.fazendas_permitidas.add(instance.fazenda)

        # Enviar e-mail notificando o funcionário
        subject = 'Bem-vindo ao InovaCeifa - Seus dados de acesso de Operador'
        message = (
            f"Olá, {instance.nome}!\n\n"
            f"Sua conta de Operador foi criada com sucesso no sistema InovaCeifa.\n\n"
            f"Aqui estão seus dados de acesso:\n"
            f"- Usuário: {email}\n"
            f"- Senha temporária: {senha}\n\n"
            f"Recomendamos alterar sua senha após o primeiro login.\n\n"
            f"Atenciosamente,\n"
            f"Equipe InovaCeifa"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Erro ao enviar e-mail para {email}: {e}")
