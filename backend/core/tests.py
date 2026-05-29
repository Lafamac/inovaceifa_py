from django.test import TestCase
from django.core import mail
from core.models import Proprietario
from accounts.models import Usuario, Perfil, PERFIL_PROPRIETARIO

class ProprietarioSignalTests(TestCase):
    def setUp(self):
        # Garantir que o perfil de proprietário existe
        self.perfil_proprietario, _ = Perfil.objects.get_or_create(
            nivel=PERFIL_PROPRIETARIO,
            defaults={'nome': 'Proprietário'}
        )

    def test_create_proprietario_creates_usuario_and_sends_email(self):
        # Limpar a caixa de e-mails de teste
        mail.outbox = []

        # Criar proprietário com e-mail
        proprietario = Proprietario.objects.create(
            nome="Carlos Santos",
            email="carlos@teste.com",
            documento="12345678901"
        )

        # 1. Verificar se o Usuário correspondente foi criado
        usuario_exists = Usuario.objects.filter(email="carlos@teste.com").exists()
        self.assertTrue(usuario_exists)

        usuario = Usuario.objects.get(email="carlos@teste.com")
        self.assertEqual(usuario.username, "carlos@teste.com")
        self.assertEqual(usuario.first_name, "Carlos")
        self.assertEqual(usuario.last_name, "Santos")
        self.assertEqual(usuario.perfil, self.perfil_proprietario)

        # 2. Verificar se o e-mail de boas-vindas foi enviado
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ["carlos@teste.com"])
        self.assertIn("Sua conta de Proprietário foi criada com sucesso", sent_email.body)
        self.assertIn("Carlos Santos", sent_email.body)

    def test_create_proprietario_without_email_does_not_create_usuario(self):
        # Limpar a caixa de e-mails de teste
        mail.outbox = []

        # Criar proprietário sem e-mail
        proprietario = Proprietario.objects.create(
            nome="José Lima",
            documento="98765432100"
        )

        # Verificar se NENHUM Usuário foi criado
        self.assertFalse(Usuario.objects.filter(first_name="José", last_name="Lima").exists())
        self.assertEqual(len(mail.outbox), 0)
