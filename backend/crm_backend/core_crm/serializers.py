from rest_framework import serializers
from .models import Entreprise, Contact, Lead, AutomationRule, UserProfile, Tache
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
    # On utilise un champ sur-mesure au lieu d'un simple read_only
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

    def get_role(self, obj):
        # On vérifie si l'utilisateur possède un profil
        if hasattr(obj, 'profile'):
            return obj.profile.role
        # Si c'est un vieil administrateur créé dans la console, on lui donne le rôle ADMIN par défaut
        if obj.is_superuser:
            return 'ADMIN'
        # Sinon, standard
        return 'STANDARD'

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

class TacheSerializer(serializers.ModelSerializer):
    nom_contact = serializers.CharField(source='contact.nom', read_only=True)
    nom_commercial = serializers.CharField(source='commercial.username', read_only=True)

    class Meta:
        model = Tache
        fields = '__all__'
        read_only_fields = ['commercial']
    
class ManageUserSerializer(serializers.ModelSerializer):
    # required=False évite les erreurs si on n'envoie pas le rôle
    role = serializers.CharField(source='profile.role', required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'role']

    def update(self, instance, validated_data):
        # 1. Mise à jour de l'accès (Actif / Suspendu)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()

        # 2. Mise à jour sécurisée du rôle
        profile_data = validated_data.get('profile', {})
        if 'role' in profile_data:
            from .models import UserProfile # Import local par sécurité
            
            # La magie est ici : get_or_create fabrique le profil s'il n'existe pas !
            profile, created = UserProfile.objects.get_or_create(user=instance)
            profile.role = profile_data['role']
            profile.save()

        return instance