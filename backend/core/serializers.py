from rest_framework import serializers
from smtplib import SMTPException
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from core.models import Proprietario, Fazenda, Safra

class ProprietarioSerializer(serializers.ModelSerializer):
    documento = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        validators=[]
    )
    email = serializers.EmailField(
        validators=[]
    )

    class Meta:
        model = Proprietario
        fields = '__all__'

    def validate_documento(self, value):
        if value:
            documento_clean = value.strip()
            qs = Proprietario.objects.filter(documento=documento_clean)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Este CNPJ/CPF já está cadastrado.")
        return value

    def validate_email(self, value):
        if value:
            email_clean = value.lower().strip()
            # Check if there is another Proprietario with this email
            qs_prop = Proprietario.objects.filter(email__iexact=email_clean)
            if self.instance:
                qs_prop = qs_prop.exclude(pk=self.instance.pk)
            if qs_prop.exists():
                raise serializers.ValidationError("Este e-mail já está cadastrado para outro proprietário.")
            
            # Check if there is a Usuario with this email
            from accounts.models import Usuario
            qs_user = Usuario.objects.filter(email__iexact=email_clean)
            if self.instance:
                # Find if the current proprietor has a user with this email
                # and exclude it, or simply check if the email exists on other users
                # But since the signal creates a user with email=email and username=email:
                qs_user = qs_user.exclude(username__iexact=self.instance.email)
            if qs_user.exists():
                raise serializers.ValidationError("Já existe um usuário cadastrado com este e-mail.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except (ImproperlyConfigured, OSError, SMTPException) as exc:
            raise serializers.ValidationError({
                'email': f'Nao foi possivel enviar o e-mail de acesso: {exc}'
            })

class FazendaSerializer(serializers.ModelSerializer):
    proprietario = serializers.PrimaryKeyRelatedField(
        queryset=Proprietario.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Fazenda
        fields = '__all__'

    def validate_cnpj_ou_produtor(self, value):
        if value:
            clean_value = value.strip()
            qs = Fazenda.objects.filter(cnpj_ou_produtor__iexact=clean_value, ativo=True)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Este CNPJ / Código Produtor Rural já está cadastrado.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            is_super = getattr(user, 'perfil', None) and user.perfil.nivel == 1
            if is_super or user.is_superuser:
                proprietario = attrs.get('proprietario')
                if not proprietario and self.instance:
                    proprietario = self.instance.proprietario
                if not proprietario:
                    raise serializers.ValidationError({"proprietario": ["Este campo é obrigatório."]})
        return attrs

class SafraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Safra
        fields = '__all__'
