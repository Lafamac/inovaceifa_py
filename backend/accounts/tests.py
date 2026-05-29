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
