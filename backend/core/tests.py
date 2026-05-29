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


from core.models import Fazenda
from referencias.models import GrupoTrabalhador
from cadastros.models import Funcionario
from accounts.models import PERFIL_OPERADOR

class FuncionarioSignalTests(TestCase):
    def setUp(self):
        # Garantir que o perfil de operador existe
        self.perfil_operador, _ = Perfil.objects.get_or_create(
            nivel=PERFIL_OPERADOR,
            defaults={'nome': 'Operador'}
        )
        # Criar proprietário de teste para a fazenda
        self.proprietario = Proprietario.objects.create(
            nome="Proprietário Teste",
            documento="11111111111"
        )
        # Criar fazenda
        self.fazenda = Fazenda.objects.create(
            nome="Fazenda Teste",
            sigla="FT",
            proprietario=self.proprietario
        )
        # Criar grupo de trabalhador
        self.grupo_trabalhador, _ = GrupoTrabalhador.objects.get_or_create(
            nome="Mão de Obra Própria"
        )

    def test_create_funcionario_marked_as_usuario_creates_user_and_sends_email(self):
        mail.outbox = []

        # Criar funcionário marcado como usuário
        funcionario = Funcionario.objects.create(
            fazenda=self.fazenda,
            nome="Marcio Souza",
            cpf="22222222222",
            cargo="Tratorista",
            grupo_trabalhador=self.grupo_trabalhador,
            email="marcio@teste.com",
            criar_usuario=True
        )

        # 1. Verificar se o Usuário correspondente foi criado
        self.assertTrue(Usuario.objects.filter(email="marcio@teste.com").exists())
        
        usuario = Usuario.objects.get(email="marcio@teste.com")
        self.assertEqual(usuario.username, "marcio@teste.com")
        self.assertEqual(usuario.first_name, "Marcio")
        self.assertEqual(usuario.last_name, "Souza")
        self.assertEqual(usuario.perfil, self.perfil_operador)
        
        # Verificar se a fazenda foi vinculada às fazendas permitidas
        self.assertIn(self.fazenda, usuario.fazendas_permitidas.all())

        # 2. Verificar se o e-mail foi enviado
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ["marcio@teste.com"])
        self.assertIn("Sua conta de Operador foi criada com sucesso", sent_email.body)
        self.assertIn("Marcio Souza", sent_email.body)

    def test_create_funcionario_not_marked_as_usuario_does_not_create_user(self):
        mail.outbox = []

        # Criar funcionário NÃO marcado como usuário
        funcionario = Funcionario.objects.create(
            fazenda=self.fazenda,
            nome="Pedro Alves",
            cpf="33333333333",
            cargo="Tratorista",
            grupo_trabalhador=self.grupo_trabalhador,
            email="pedro@teste.com",
            criar_usuario=False
        )

        # Verificar se nenhum usuário foi criado
        self.assertFalse(Usuario.objects.filter(email="pedro@teste.com").exists())
        self.assertEqual(len(mail.outbox), 0)
