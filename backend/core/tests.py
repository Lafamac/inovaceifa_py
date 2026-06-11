from django.test import TestCase, override_settings
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import Proprietario
from accounts.models import Usuario, Perfil, PERFIL_PROPRIETARIO

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
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

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
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


from django.test import RequestFactory
from core.models import Safra
from core.middleware import MultiTenantMiddleware
from planejamento.views import setup_tenant_context

class SuperuserTenantIsolationTests(TestCase):
    def setUp(self):
        # 1. Criar perfis necessários
        self.perfil_super, _ = Perfil.objects.get_or_create(nivel=1, defaults={'nome': 'Superusuário'})
        
        # 2. Criar superusuário
        self.superuser = Usuario.objects.create_superuser(
            username="super_admin",
            email="super@teste.com",
            password="password123",
            first_name="Super",
            last_name="Admin"
        )
        self.superuser.perfil = self.perfil_super
        self.superuser.save()

        # 3. Criar proprietários
        self.prop_a = Proprietario.objects.create(nome="Proprietário A", email="propa@teste.com")
        self.prop_b = Proprietario.objects.create(nome="Proprietário B", email="propb@teste.com")

        # 4. Criar fazendas para o Proprietário A
        self.fazenda_a1 = Fazenda.objects.create(nome="Fazenda A1", sigla="FA1", proprietario=self.prop_a)
        self.fazenda_a2 = Fazenda.objects.create(nome="Fazenda A2", sigla="FA2", proprietario=self.prop_a)

        # 5. Criar fazenda para o Proprietário B
        self.fazenda_b = Fazenda.objects.create(nome="Fazenda B", sigla="FB", proprietario=self.prop_b)

        # 6. Criar safras
        self.safra_a1 = Safra.objects.create(
            fazenda=self.fazenda_a1, nome="Safra A1", 
            data_inicio="2026-01-01", data_fim="2026-12-31", ativa=True
        )
        self.safra_b = Safra.objects.create(
            fazenda=self.fazenda_b, nome="Safra B", 
            data_inicio="2026-01-01", data_fim="2026-12-31", ativa=True
        )

        self.factory = RequestFactory()

    def test_middleware_restricts_farms_to_active_owner_for_superuser(self):
        # Criar requisição com header X-Safra-ID correspondente a Safra A1 (Proprietário A)
        request = self.factory.get('/api/talhoes/', HTTP_X_SAFRA_ID=str(self.safra_a1.id))
        request.user = self.superuser

        # Processar pelo middleware
        middleware = MultiTenantMiddleware(get_response=lambda req: None)
        middleware.process_request(request)

        # Verificar se as fazendas ativas e safra ativas foram atribuídas
        self.assertEqual(request.safra_ativa, self.safra_a1)
        self.assertEqual(request.fazenda_ativa, self.fazenda_a1)

        # As fazendas permitidas para o superusuário devem conter APENAS as fazendas do Proprietário A
        permitidas = list(request.fazendas_permitidas)
        self.assertIn(self.fazenda_a1, permitidas)
        self.assertIn(self.fazenda_a2, permitidas)
        self.assertNotIn(self.fazenda_b, permitidas)

    def test_setup_tenant_context_restricts_farms_to_active_owner_for_superuser(self):
        # Criar requisição simulada
        request = self.factory.get('/api/talhoes/', HTTP_X_SAFRA_ID=str(self.safra_a1.id))
        request.user = self.superuser

        # Processar pela função setup_tenant_context
        setup_tenant_context(request)

        # Verificar se a safra e fazenda ativas foram atribuídas
        self.assertEqual(request.safra_ativa, self.safra_a1)
        self.assertEqual(request.fazenda_ativa, self.fazenda_a1)

        # As fazendas permitidas devem conter apenas as fazendas do Proprietário A
        permitidas = list(request.fazendas_permitidas)
        self.assertIn(self.fazenda_a1, permitidas)
        self.assertIn(self.fazenda_a2, permitidas)
        self.assertNotIn(self.fazenda_b, permitidas)

    def test_unfiltered_when_no_context_is_selected(self):
        # Sem header X-Safra-ID
        request = self.factory.get('/api/talhoes/')
        request.user = self.superuser

        # Processar
        setup_tenant_context(request)

        # Nenhuma fazenda ou safra deve estar ativa, mas todas as fazendas devem ser permitidas
        self.assertIsNone(request.safra_ativa)
        self.assertIsNone(request.fazenda_ativa)
        
        permitidas = list(request.fazendas_permitidas)
        self.assertIn(self.fazenda_a1, permitidas)
        self.assertIn(self.fazenda_a2, permitidas)
        self.assertIn(self.fazenda_b, permitidas)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ProprietarioValidationTests(APITestCase):
    def setUp(self):
        self.perfil_super, _ = Perfil.objects.get_or_create(nivel=1, defaults={'nome': 'Superusuário'})
        self.superuser = Usuario.objects.create_superuser(
            username="super_admin",
            email="super@teste.com",
            password="password123",
            first_name="Super",
            last_name="Admin"
        )
        self.superuser.perfil = self.perfil_super
        self.superuser.save()
        self.client.force_authenticate(user=self.superuser)

        # Criar proprietário de teste
        self.prop_a = Proprietario.objects.create(
            nome="Proprietario A",
            email="propa@teste.com",
            documento="12345678901"
        )
        self.prop_list_url = reverse('proprietario-list')

    def test_create_proprietario_with_existing_documento_fails(self):
        # Tenta criar com documento existente
        payload = {
            "nome": "Outro Proprietario",
            "email": "outro@teste.com",
            "documento": "12345678901"
        }
        response = self.client.post(self.prop_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('documento', response.data)
        self.assertEqual(response.data['documento'][0], "Este CNPJ/CPF já está cadastrado.")

    def test_create_proprietario_with_existing_email_fails(self):
        # Tenta criar com e-mail existente no Proprietario
        payload = {
            "nome": "Outro Proprietario",
            "email": "propa@teste.com",
            "documento": "98765432100"
        }
        response = self.client.post(self.prop_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'][0], "Este e-mail já está cadastrado para outro proprietário.")

    def test_create_proprietario_with_existing_user_email_fails(self):
        # Tenta criar com e-mail existente em Usuario
        payload = {
            "nome": "Outro Proprietario",
            "email": "super@teste.com",
            "documento": "98765432100"
        }
        response = self.client.post(self.prop_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'][0], "Já existe um usuário cadastrado com este e-mail.")

    def test_create_fazenda_with_existing_cnpj_ou_produtor_fails(self):
        # Criar fazenda inicial
        fazenda_list_url = reverse('fazenda-list')
        fazenda_a = Fazenda.objects.create(
            proprietario=self.prop_a,
            nome="Fazenda A",
            sigla="FZA",
            cnpj_ou_produtor="12.345.678/0001-99"
        )
        # Tenta criar fazenda com o mesmo cnpj_ou_produtor
        payload = {
            "proprietario": self.prop_a.id,
            "nome": "Fazenda Duplicada",
            "sigla": "FZD",
            "cnpj_ou_produtor": "12.345.678/0001-99"
        }
        response = self.client.post(fazenda_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cnpj_ou_produtor', response.data)
        self.assertEqual(response.data['cnpj_ou_produtor'][0], "Este CNPJ / Código Produtor Rural já está cadastrado.")

    def test_partial_update_fazenda_status_as_superuser(self):
        fazenda_a = Fazenda.objects.create(
            proprietario=self.prop_a,
            nome="Fazenda A",
            sigla="FZA"
        )
        url = reverse('fazenda-detail', kwargs={'pk': fazenda_a.pk})
        response = self.client.patch(url, {'ativo': False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        fazenda_a.refresh_from_db()
        self.assertFalse(fazenda_a.ativo)

