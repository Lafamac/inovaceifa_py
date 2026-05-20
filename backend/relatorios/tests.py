from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import Perfil
from core.models import Fazenda, Proprietario, Safra


class RelatoriosEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.perfil = Perfil.objects.create(nome="Superusuario", nivel=1)
        self.user = get_user_model().objects.create_user(
            username="admin@teste.com",
            email="admin@teste.com",
            password="12345",
            perfil=self.perfil,
        )
        self.proprietario = Proprietario.objects.create(nome="Produtor Teste")
        self.fazenda = Fazenda.objects.create(
            proprietario=self.proprietario,
            nome="Fazenda Teste",
            sigla="FT",
        )
        self.safra = Safra.objects.create(
            fazenda=self.fazenda,
            nome="2024/2025",
            data_inicio=date(2024, 9, 1),
            data_fim=date(2025, 8, 31),
            ativa=True,
        )
        self.client.force_authenticate(self.user)

    def test_phase_7_routes_return_success_with_context(self):
        route_names = [
            "comparativo-safra",
            "custo-talhao",
            "custo-mensal",
            "fluxo-caixa",
            "eficiencia-operacional",
            "consumo-diesel",
            "mof",
            "estoque-relatorio",
            "gestao-a-vista",
            "producao-talhao",
        ]

        for name in route_names:
            with self.subTest(name=name):
                response = self.client.get(
                    reverse(name),
                    HTTP_X_SAFRA_ID=str(self.safra.id),
                )
                self.assertEqual(response.status_code, 200)

    def test_operational_report_requires_safra_context(self):
        response = self.client.get(reverse("custo-talhao"))
        self.assertEqual(response.status_code, 400)
