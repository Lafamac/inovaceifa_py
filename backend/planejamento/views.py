from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Fazenda, Safra
from operacoes.models import OrdemServico, OrdemServicoTalhao, ItemInsumoOSReal
from planejamento.models import (
    PlanejamentoSafra, OrdemServicoPlanejada, OrdemServicoPlanejadaTalhao,
    ItemInsumoOSPlanejado, ParametroOperacionalOS, PlanejamentoMaoObraTerceiros,
    PlanejamentoAdubo, PlanejamentoRateio
)
from planejamento.serializers import (
    PlanejamentoSafraSerializer, OrdemServicoPlanejadaSerializer,
    PlanejamentoAduboSerializer, PlanejamentoRateioSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permissão que restringe operações de escrita (POST, PUT, PATCH, DELETE)
    apenas para usuários com perfil de Superusuário (nivel = 1).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
        return bool(is_super or request.user.is_superuser)


def setup_tenant_context(request):
    """
    Garante que as propriedades de tenant estejam populadas no request
    caso o middleware tenha sido executado antes da autenticação (como no DRF/JWT/testes).
    """
    if not hasattr(request, 'safra_ativa'):
        request.safra_ativa = None
    if not hasattr(request, 'fazenda_ativa'):
        request.fazenda_ativa = None

    if not getattr(request, 'fazendas_permitidas', None) or not request.fazendas_permitidas.exists():
        request.fazendas_permitidas = Fazenda.objects.none()
        if request.user and request.user.is_authenticated:
            is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
            is_proprietario = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 2
            if is_super or request.user.is_superuser:
                request.fazendas_permitidas = Fazenda.objects.filter(ativo=True)
            elif is_proprietario:
                try:
                    from core.models import Proprietario
                    prop = Proprietario.objects.get(email__iexact=request.user.email)
                    request.fazendas_permitidas = Fazenda.objects.filter(proprietario=prop, ativo=True)
                except Proprietario.DoesNotExist:
                    request.fazendas_permitidas = Fazenda.objects.none()
            else:
                request.fazendas_permitidas = request.user.fazendas_permitidas.filter(ativo=True)

    if not getattr(request, 'safra_ativa', None):
        safra_id = request.headers.get('X-Safra-ID') or request.META.get('HTTP_X_SAFRA_ID')
        if safra_id:
            try:
                safra = Safra.objects.get(id=safra_id, ativo=True)
                if safra.fazenda in request.fazendas_permitidas:
                    request.safra_ativa = safra
                    request.fazenda_ativa = safra.fazenda
                    
                    # Se for superusuário, restringir fazendas permitidas ao proprietário da fazenda ativa
                    if request.user and request.user.is_authenticated:
                        is_super = getattr(request.user, 'perfil', None) and request.user.perfil.nivel == 1
                        if is_super or request.user.is_superuser:
                            request.fazendas_permitidas = Fazenda.objects.filter(
                                proprietario=safra.fazenda.proprietario,
                                ativo=True
                            )
            except (Safra.DoesNotExist, ValueError):
                pass


class BaseTenantPlanejamentoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def initial(self, request, *args, **kwargs):
        setup_tenant_context(request)
        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        qs = self.queryset
        model = qs.model

        if hasattr(model, 'fazenda'):
            qs = qs.filter(fazenda__ativo=True, fazenda__proprietario__ativo=True)
        elif hasattr(model, 'planejamento'):
            qs = qs.filter(planejamento__fazenda__ativo=True, planejamento__fazenda__proprietario__ativo=True)
        elif hasattr(model, 'ordem_servico'):
            qs = qs.filter(ordem_servico__fazenda__ativo=True, ordem_servico__fazenda__proprietario__ativo=True)
        elif hasattr(model, 'apontamento'):
            qs = qs.filter(apontamento__ordem_servico__fazenda__ativo=True, apontamento__ordem_servico__fazenda__proprietario__ativo=True)
        elif hasattr(model, 'safra'):
            qs = qs.filter(safra__fazenda__ativo=True, safra__fazenda__proprietario__ativo=True)

        incluir_inativos = self.request.query_params.get('incluir_inativos', 'false').lower() == 'true'
        is_detail = self.action in ['retrieve', 'update', 'partial_update', 'destroy']
        if incluir_inativos or is_detail:
            return qs
        return qs.filter(ativo=True)

    def perform_destroy(self, instance):
        instance.ativo = False
        instance.save()

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method in ['GET', 'HEAD']:
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response


class PlanejamentoSafraViewSet(BaseTenantPlanejamentoViewSet):
    queryset = PlanejamentoSafra.objects.all()
    serializer_class = PlanejamentoSafraSerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(
            fazenda__in=self.request.fazendas_permitidas
        )
        if self.request.safra_ativa:
            qs = qs.filter(safra=self.request.safra_ativa)
        return qs.prefetch_related(
            'ordens_servico',
            'ordens_servico__funcionario',
            'ordens_servico__trator',
            'ordens_servico__implemento',
            'ordens_servico__terceirizado',
            'ordens_servico__turma',
            'ordens_servico__execucoes',
            'ordens_servico__insumos',
            'ordens_servico__insumos__produto',
            'ordens_servico__insumos__produto__unidade',
            'ordens_servico__parametros',
            'ordens_servico__mao_obra_terceiros',
            'ordens_servico__talhoes',
            'ordens_servico__talhoes__talhao',
            'ordens_servico__talhoes__talhao__tipo_irrigacao',
            'ordens_servico__talhoes__talhao__cultura',
            'ordens_servico__talhoes__talhao__resistencia_ferrugem',
            'ordens_servico__talhoes__talhao__status_cultivo',
            'ordens_servico__talhoes__talhao__estimativas',
            'adubacoes',
            'rateios'
        )

    @action(detail=True, methods=['post'], url_path='aprovar')
    def aprovar(self, request, pk=None):
        planejamento = self.get_object()
        planejamento.aprovado = True
        planejamento.save()
        return Response({"detail": "Planejamento aprovado com sucesso e bloqueado para edições futuras."})

    @action(detail=True, methods=['post'], url_path='gerar-ordens-servico')
    def gerar_ordens_servico(self, request, pk=None):
        planejamento = self.get_object()
        
        if not planejamento.aprovado:
            planejamento.aprovado = True
            planejamento.save()

        ordens_planejadas = planejamento.ordens_servico.filter(ativo=True)
        contador_gerado = 0

        for os_plan in ordens_planejadas:
            os_real = OrdemServico.objects.create(
                fazenda=planejamento.fazenda,
                safra=planejamento.safra,
                tipo_operacao=os_plan.tipo_operacao,
                data_inicio_planejada=os_plan.data_inicio_planejada,
                data_fim_planejada=os_plan.data_fim_planejada,
                status='APROVADA',
                observacao=os_plan.observacao,
                origem_planejada=os_plan,
                funcionario_planejado=os_plan.funcionario,
                trator_planejado=os_plan.trator,
                implemento_planejado=os_plan.implemento,
                terceirizado_planejado=os_plan.terceirizado,
                turma_planejada=os_plan.turma,
                valor_planejado_turma=os_plan.valor_planejado_turma,
                usar_turma=os_plan.usar_turma
            )

            for pt in os_plan.talhoes.filter(ativo=True):
                OrdemServicoTalhao.objects.create(
                    ordem_servico=os_real,
                    talhao=pt.talhao
                )

            for insumo_plan in os_plan.insumos.filter(ativo=True):
                ItemInsumoOSReal.objects.create(
                    ordem_servico=os_real,
                    produto=insumo_plan.produto,
                    dose_planejada=insumo_plan.dose_planejada,
                    quantidade_planejada=insumo_plan.quantidade_planejada
                )

            contador_gerado += 1

        return Response({
            "detail": f"Geração concluída com sucesso! Foram geradas {contador_gerado} Ordens de Serviço Reais."
        }, status=status.HTTP_200_OK)


class OrdemServicoPlanejadaViewSet(BaseTenantPlanejamentoViewSet):
    queryset = OrdemServicoPlanejada.objects.all()
    serializer_class = OrdemServicoPlanejadaSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            planejamento__fazenda__in=self.request.fazendas_permitidas
        )


class PlanejamentoAduboViewSet(BaseTenantPlanejamentoViewSet):
    queryset = PlanejamentoAdubo.objects.all()
    serializer_class = PlanejamentoAduboSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            planejamento__fazenda__in=self.request.fazendas_permitidas
        )


class PlanejamentoRateioViewSet(BaseTenantPlanejamentoViewSet):
    queryset = PlanejamentoRateio.objects.all()
    serializer_class = PlanejamentoRateioSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            planejamento__fazenda__in=self.request.fazendas_permitidas
        )
