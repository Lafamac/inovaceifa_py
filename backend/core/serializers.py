from rest_framework import serializers
from smtplib import SMTPException
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from core.models import Proprietario, Fazenda, Safra

class ProprietarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proprietario
        fields = '__all__'

    @transaction.atomic
    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except (ImproperlyConfigured, OSError, SMTPException) as exc:
            raise serializers.ValidationError({
                'email': f'Nao foi possivel enviar o e-mail de acesso: {exc}'
            })

class FazendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fazenda
        fields = '__all__'

class SafraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Safra
        fields = '__all__'
