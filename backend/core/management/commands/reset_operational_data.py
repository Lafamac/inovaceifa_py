from django.apps import apps
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Perfil, Usuario, PERFIL_OPERADOR, PERFIL_PROPRIETARIO, PERFIL_SUPERUSUARIO


class Command(BaseCommand):
    help = (
        'Remove dados operacionais e de cadastros, mantendo apenas perfis, '
        'usuario admin@teste.com e tabelas de referencia.'
    )

    def handle(self, *args, **options):
        self.stdout.write('Zerando dados operacionais e cadastros...')

        model_order = [
            ('financeiro', 'ContasAReceber'),
            ('financeiro', 'PedidoVenda'),
            ('financeiro', 'ContasAPagar'),
            ('financeiro', 'ItemPedidoCompra'),
            ('financeiro', 'PedidoCompra'),
            ('operacoes', 'AuditoriaOrdemServico'),
            ('operacoes', 'ApontamentoFuncionario'),
            ('operacoes', 'ApontamentoMaquina'),
            ('operacoes', 'ApontamentoInsumo'),
            ('operacoes', 'ApontamentoOperacao'),
            ('operacoes', 'ItemInsumoOSReal'),
            ('operacoes', 'OrdemServicoTalhao'),
            ('operacoes', 'OrdemServico'),
            ('planejamento', 'PlanejamentoRateio'),
            ('planejamento', 'PlanejamentoAdubo'),
            ('planejamento', 'PlanejamentoMaoObraTerceiros'),
            ('planejamento', 'ParametroOperacionalOS'),
            ('planejamento', 'ItemInsumoOSPlanejado'),
            ('planejamento', 'OrdemServicoPlanejadaTalhao'),
            ('planejamento', 'OrdemServicoPlanejada'),
            ('planejamento', 'PlanejamentoSafra'),
            ('cadastros', 'EstoqueMovimento'),
            ('cadastros', 'SalarioMensal'),
            ('cadastros', 'CustoMensalMaquina'),
            ('cadastros', 'EstimativaProducaoTalhao'),
            ('cadastros', 'TurmaTerceirizada'),
            ('cadastros', 'Terceirizado'),
            ('cadastros', 'Funcionario'),
            ('cadastros', 'Maquina'),
            ('cadastros', 'Talhao'),
            ('cadastros', 'Produto'),
            ('core', 'Safra'),
            ('core', 'Fazenda'),
            ('core', 'Proprietario'),
        ]

        with transaction.atomic():
            for app_label, model_name in model_order:
                model = apps.get_model(app_label, model_name)
                deleted_count, _ = model.objects.all().delete()
                if deleted_count:
                    self.stdout.write(f'- {app_label}.{model_name}: {deleted_count} registros removidos')

            Usuario.objects.exclude(email__iexact='admin@teste.com').exclude(username='admin').delete()

            perfil_admin, _ = Perfil.objects.get_or_create(
                nivel=PERFIL_SUPERUSUARIO,
                defaults={'nome': 'Superusuario'},
            )
            Perfil.objects.get_or_create(
                nivel=PERFIL_PROPRIETARIO,
                defaults={'nome': 'Proprietario'},
            )
            Perfil.objects.get_or_create(
                nivel=PERFIL_OPERADOR,
                defaults={'nome': 'Operador'},
            )

            admin = Usuario.objects.filter(email__iexact='admin@teste.com').first()
            if not admin:
                admin = Usuario.objects.create_superuser(
                    username='admin',
                    email='admin@teste.com',
                    password='12345',
                    perfil=perfil_admin,
                )
            else:
                admin.username = 'admin'
                admin.email = 'admin@teste.com'
                admin.perfil = perfil_admin
                admin.is_staff = True
                admin.is_superuser = True
                admin.ativo = True
                admin.set_password('12345')
                admin.save()

        call_command('seed_referencias')
        self.stdout.write(self.style.SUCCESS('Banco zerado: apenas admin, perfis e referencias permanecem.'))
