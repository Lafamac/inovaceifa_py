from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Fazenda, Proprietario
from cadastros.models import TurmaTerceirizada
from accounts.models import Perfil

User = get_user_model()

class TurmaTerceirizadaAPITests(APITestCase):
    def setUp(self):
        self.proprietario = Proprietario.objects.create(nome="Proprietario Teste", documento="11122233344")
        self.fazenda = Fazenda.objects.create(nome="Fazenda Teste", proprietario=self.proprietario, sigla="FZT")
        
        self.perfil_admin, _ = Perfil.objects.get_or_create(nome="Administrador", nivel=1)
        self.admin_user = User.objects.create_user(
            username="admin_cad", email="admin_cad@test.com", password="password123",
            perfil=self.perfil_admin
        )
        self.admin_user.fazendas_permitidas.add(self.fazenda)
        
        self.client.force_authenticate(user=self.admin_user)
        # Multi-tenant context headers
        self.client.credentials(HTTP_X_FAZENDA_ID=str(self.fazenda.id))

    def test_create_and_read_turma_terceirizada_with_qtd_pessoas(self):
        url = reverse('cadastros-turma-list')
        data = {
            "fazenda": self.fazenda.id,
            "nome": "TURMA COPA 01",
            "responsavel": "MARIO SOUZA",
            "qtd_pessoas": 15
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['qtd_pessoas'], 15)

        # Verify DB
        turma = TurmaTerceirizada.objects.get(id=response.data['id'])
        self.assertEqual(turma.qtd_pessoas, 15)
        self.assertEqual(turma.nome, "TURMA COPA 01")

        # Read list
        response_list = self.client.get(url, format='json')
        self.assertEqual(response_list.status_code, status.HTTP_200_OK)
        # Depending on pagination, results can be in results list
        results = response_list.data.get('results', response_list.data)
        self.assertTrue(any(t['id'] == turma.id and t['qtd_pessoas'] == 15 for t in results))
