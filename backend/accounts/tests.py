from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import Perfil, PERFIL_SUPERUSUARIO, PERFIL_PROPRIETARIO, PERFIL_OPERADOR

Usuario = get_user_model()

class UserManagementTests(APITestCase):
    def setUp(self):
        # Criar os perfis na base de dados
        self.perfil_super, _ = Perfil.objects.get_or_create(nivel=PERFIL_SUPERUSUARIO, defaults={'nome': 'Superusuário'})
        self.perfil_prop, _ = Perfil.objects.get_or_create(nivel=PERFIL_PROPRIETARIO, defaults={'nome': 'Proprietário'})
        self.perfil_oper, _ = Perfil.objects.get_or_create(nivel=PERFIL_OPERADOR, defaults={'nome': 'Operador'})

        # Criar usuários de teste
        self.superuser = Usuario.objects.create_user(
            username='super@teste.com',
            email='super@teste.com',
            password='123',
            first_name='Super',
            perfil=self.perfil_super
        )

        self.proprietario = Usuario.objects.create_user(
            username='prop@teste.com',
            email='prop@teste.com',
            password='123',
            first_name='Proprietario',
            perfil=self.perfil_prop
        )

        # URL lists
        self.user_list_url = reverse('usuario-list')
        self.perfil_list_url = reverse('perfil-list')

    def test_superuser_can_list_users(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Deve listar os 2 usuários criados no setUp
        self.assertEqual(len(response.data), 2)

    def test_proprietario_cannot_list_users(self):
        self.client.force_authenticate(user=self.proprietario)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_create_user(self):
        self.client.force_authenticate(user=self.superuser)
        payload = {
            'username': 'novo_usuario',
            'email': 'novo@teste.com',
            'first_name': 'Novo',
            'last_name': 'User',
            'perfil_id': self.perfil_oper.id,
            'password': 'password123'
        }
        response = self.client.post(self.user_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(username='novo_usuario').exists())

    def test_proprietario_cannot_create_user(self):
        self.client.force_authenticate(user=self.proprietario)
        payload = {
            'username': 'novo_usuario',
            'email': 'novo@teste.com',
            'first_name': 'Novo',
            'perfil_id': self.perfil_oper.id
        }
        response = self.client.post(self.user_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_any_authenticated_user_can_list_profiles(self):
        self.client.force_authenticate(user=self.proprietario)
        response = self.client.get(self.perfil_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_create_user_with_existing_email_fails(self):
        self.client.force_authenticate(user=self.superuser)
        # Tenta criar usuário com o e-mail do proprietário (prop@teste.com)
        payload = {
            'username': 'outro_usuario',
            'email': 'prop@teste.com',
            'first_name': 'Outro',
            'last_name': 'User',
            'perfil_id': self.perfil_oper.id,
            'password': 'password123'
        }
        response = self.client.post(self.user_list_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'][0], "Já existe um usuário cadastrado com este e-mail.")

    def test_recuperar_senha_success(self):
        url = reverse('auth_recuperar_senha')
        payload = {'email': 'prop@teste.com'}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if user's password was updated
        user = Usuario.objects.get(email='prop@teste.com')
        self.assertFalse(user.check_password('123'))
        
        # Check if email was sent
        from django.core import mail
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Recuperacao de Senha', mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ['prop@teste.com'])

    def test_recuperar_senha_user_not_found(self):
        url = reverse('auth_recuperar_senha')
        payload = {'email': 'nonexistent@teste.com'}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], "Nenhum usuario encontrado com este e-mail.")
