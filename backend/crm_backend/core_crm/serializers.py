from rest_framework import serializers
from .models import Entreprise, Contact, Lead, AutomationRule
from django.contrib.auth.models import User

class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class AutomationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationRule
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=[('ADMIN', 'Admin'), ('COMMERCIAL', 'Commercial'), ('STANDARD', 'Standard')], write_only=True, required=False)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        # On extrait le rôle, ou on met STANDARD par défaut
        role = validated_data.pop('role', 'STANDARD')
        
        # On crée l'utilisateur avec le mot de passe crypté
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        # On lui attache son rôle
        UserProfile.objects.create(user=user, role=role)
        return user