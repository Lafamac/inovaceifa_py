from rest_framework import serializers
from .models import Usuario, Perfil
from core.models import Fazenda

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['id', 'nome', 'nivel']

class UsuarioSerializer(serializers.ModelSerializer):
    perfil_nome = serializers.ReadOnlyField(source='perfil.nome')
    perfil_id = serializers.PrimaryKeyRelatedField(
        queryset=Perfil.objects.all(),
        source='perfil',
        required=False,
        allow_null=True
    )
    fazendas_permitidas_ids = serializers.PrimaryKeyRelatedField(
        queryset=Fazenda.objects.all(),
        source='fazendas_permitidas',
        many=True,
        required=False
    )
    nome_completo = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'nome_completo',
            'perfil_nome', 'perfil_id', 'fazendas_permitidas_ids',
            'ativo', 'password'
        ]

    def get_nome_completo(self, obj):
        return obj.get_full_name() or obj.username

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        fazendas_permitidas = validated_data.pop('fazendas_permitidas', [])
        
        user = Usuario.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password('12345') # Senha padrão caso não informada
        user.save()
            
        if fazendas_permitidas:
            user.fazendas_permitidas.set(fazendas_permitidas)
            
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        fazendas_permitidas = validated_data.pop('fazendas_permitidas', None)
        
        if password:
            instance.set_password(password)
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if fazendas_permitidas is not None:
            instance.fazendas_permitidas.set(fazendas_permitidas)
            
        return instance
