from django.apps import AppConfig
from django.db import connection
import sys

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Apenas executa quando o servidor está rodando de fato
        if 'runserver' not in sys.argv:
            return

        try:
            # Verifica se a tabela de usuários já existe no banco
            with connection.cursor() as cursor:
                table_list = connection.introspection.table_names(cursor)
            
            # Caso as tabelas não existam, executa o migrate automaticamente
            if 'accounts_usuario' not in table_list:
                print("Tabelas ausentes! Executando migrações automáticas...")
                from django.core.management import call_command
                call_command('migrate', interactive=False)
            
            # Popula os perfis padrões e cria o superusuário administrador
            from accounts.models import Perfil, Usuario, PERFIL_SUPERUSUARIO, PERFIL_PROPRIETARIO, PERFIL_OPERADOR
            
            # Criação dos Perfis Padrões
            perfil_admin, _ = Perfil.objects.get_or_create(
                nivel=PERFIL_SUPERUSUARIO,
                defaults={'nome': 'Superusuário'}
            )
            Perfil.objects.get_or_create(
                nivel=PERFIL_PROPRIETARIO,
                defaults={'nome': 'Proprietário'}
            )
            Perfil.objects.get_or_create(
                nivel=PERFIL_OPERADOR,
                defaults={'nome': 'Operador'}
            )
            
            # Criação do Usuário Administrador Inicial (admin@teste.com / 12345)
            if not Usuario.objects.filter(username='admin').exists() and not Usuario.objects.filter(email='admin@teste.com').exists():
                print("Criando usuário administrador padrão (admin@teste.com)...")
                Usuario.objects.create_superuser(
                    username='admin',
                    email='admin@teste.com',
                    password='12345',
                    perfil=perfil_admin
                )
                print("Usuário administrador padrão criado com sucesso!")
            else:
                # Caso o usuário já exista, garante que ele tenha o perfil de superusuário associado se estiver nulo
                Usuario.objects.filter(email='admin@teste.com', perfil__isnull=True).update(perfil=perfil_admin)
            
            # Executa o auto-seeding das tabelas de referências auxiliares e cadastros base
            from django.core.management import call_command
            call_command('seed_referencias')
            call_command('seed_cadastros')
                
        except Exception as e:
            # Previne erros de importação/conexão durante makemigrations iniciais
            print(f"Alerta na rotina de inicialização: {e}")
