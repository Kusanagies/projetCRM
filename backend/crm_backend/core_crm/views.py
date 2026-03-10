import traceback
import datetime
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncMonth

from rest_framework.decorators import action
from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.exceptions import PermissionDenied
from .serializers import ManageUserSerializer

from .models import Entreprise, Contact, Lead, AutomationRule, Tache, UserProfile, CampagneRecurrente
from .serializers import (
    EntrepriseSerializer, ContactSerializer, LeadSerializer, 
    AutomationRuleSerializer, TacheSerializer, UserSerializer, RegisterSerializer, CampagneRecurrenteSerializer
)
from .utils import envoyer_email_bienvenue, envoyer_email_automatique, get_brevo_stats
class EntrepriseViewSet(viewsets.ModelViewSet):
    queryset = Entreprise.objects.all()
    serializer_class = EntrepriseSerializer
    permission_classes = [IsAuthenticated]

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        contact = serializer.save()
        try:
            # Automatisation 1 : Email de bienvenue
            envoyer_email_bienvenue(contact.email, contact.nom)
            print(f"[Succes] Email de bienvenue envoye a {contact.email}")
        except Exception as e:
            print(f"[Erreur] Impossible d'envoyer l'email via Brevo : {e}")

class AutomationRuleViewSet(viewsets.ModelViewSet):
    queryset = AutomationRule.objects.all()
    serializer_class = AutomationRuleSerializer
    permission_classes = [IsAuthenticated]
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer   
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        # On sauvegarde l'ancien statut
        ancien_statut = self.get_object().statut
        
        # On sauvegarde les nouvelles données dans la base
        lead = serializer.save()
        
        # Si le statut a changé, on cherche des automatisations !
        if ancien_statut != lead.statut:
            regles = AutomationRule.objects.filter(statut_declencheur=lead.statut, actif=True)
            
            if regles.exists() and lead.contact and lead.contact.email:
                for regle in regles:
                    # 1. On prépare la valeur estimée (en gérant le cas où c'est vide)
                    valeur = f"{lead.valeur_estimee} €" if lead.valeur_estimee else "Montant non défini"
                    
                    # 2. On remplace les variables magiques dans le message
                    msg_perso = regle.message.replace('{{contact.nom}}', lead.contact.nom)
                    msg_perso = msg_perso.replace('{{lead.titre}}', lead.titre)
                    msg_perso = msg_perso.replace('{{lead.valeur}}', valeur)

                    # 3. On remplace aussi dans le sujet du mail !
                    sujet_perso = regle.sujet.replace('{{contact.nom}}', lead.contact.nom)
                    sujet_perso = sujet_perso.replace('{{lead.titre}}', lead.titre)

                    # 4. On envoie l'email
                    try:
                        envoyer_email_automatique(lead.contact.email, lead.contact.nom, sujet_perso, msg_perso)
                        print(f"[Succes] Email auto envoyé à {lead.contact.email}")
                    except Exception as e:
                        print(f"[Erreur] Email auto échoué : {e}")

                        
class TacheViewSet(viewsets.ModelViewSet):
    queryset = Tache.objects.all().order_by('date_echeance')
    serializer_class = TacheSerializer
    permission_classes = [IsAuthenticated]

    # Quand un utilisateur crée une tâche, on lui assigne automatiquement
    def perform_create(self, serializer):
        serializer.save(commercial=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    ca_total = Lead.objects.filter(statut='CONVERTI').aggregate(Sum('valeur_estimee'))['valeur_estimee__sum'] or 0
    nouveaux_leads = Lead.objects.filter(statut='NOUVEAU').count()
    leads_en_cours = Lead.objects.filter(statut='EN_COURS').count()
    contacts_recents = Contact.objects.order_by('-date_ajout')[:5].values('id', 'nom', 'email', 'date_ajout')

    # Interrogation de l'API Brevo pour les statistiques d'emailing
    email_stats = get_brevo_stats()

    return Response({
        'ca_total': ca_total,
        'nouveaux_leads': nouveaux_leads,
        'leads_en_cours': leads_en_cours,
        'contacts_recents': list(contacts_recents),
        'email_stats': email_stats  # On envoie les stats au frontend !
    })

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny] # Permet aux non-connectés de s'inscrire
    serializer_class = RegisterSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_commercials(request):
    # On filtre les utilisateurs pour ne garder que ceux qui ont le rôle ADMIN ou COMMERCIAL
    users = User.objects.filter(profile__role__in=['ADMIN', 'COMMERCIAL'])
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_stats(request):
    try:
        # --- 1. KPIs GLOBAUX ---
        # On force la conversion en float() pour que React puisse lire les chiffres
        ca_total = Lead.objects.filter(statut='CONVERTI').aggregate(Sum('valeur_estimee'))['valeur_estimee__sum'] or 0
        ca_total = float(ca_total)
        
        valeur_pipeline = Lead.objects.exclude(statut__in=['CONVERTI', 'PERDU']).aggregate(Sum('valeur_estimee'))['valeur_estimee__sum'] or 0
        valeur_pipeline = float(valeur_pipeline)
        
        total_leads = Lead.objects.count()
        leads_convertis = Lead.objects.filter(statut='CONVERTI').count()
        taux_conversion = float(round((leads_convertis / total_leads * 100), 1)) if total_leads > 0 else 0.0
        
        panier_moyen = Lead.objects.filter(statut='CONVERTI').aggregate(Avg('valeur_estimee'))['valeur_estimee__avg'] or 0
        panier_moyen = float(round(panier_moyen, 2))

        # --- 2. GRAPHIQUES COMMERCIAUX ---
        ca_par_commercial_qs = Lead.objects.filter(statut='CONVERTI', commercial_assigne__isnull=False).values(
            nom=F('commercial_assigne__username')
        ).annotate(CA=Sum('valeur_estimee'))
        ca_par_commercial = [{'nom': item['nom'], 'CA': float(item['CA'] or 0)} for item in ca_par_commercial_qs]

        pipeline_qs = Lead.objects.values('statut').annotate(value=Count('id'))
        statut_mapping = {
            'NOUVEAU': 'Prospect',
            'EN_COURS': 'En cours',
            'CONVERTI': 'Gagné',
            'PERDU': 'Perdu'
        }
        pipeline_data = [{'name': statut_mapping.get(item['statut'], item['statut']), 'value': item['value']} for item in pipeline_qs]

        evolution_qs = Lead.objects.filter(statut='CONVERTI').annotate(
            month=TruncMonth('date_creation')
        ).values('month').annotate(CA=Sum('valeur_estimee')).order_by('month')
        
        months_fr = {1: 'Jan', 2: 'Fév', 3: 'Mar', 4: 'Avr', 5: 'Mai', 6: 'Juin', 7: 'Jul', 8: 'Aoû', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Déc'}
        evolution_ca = []
        for item in evolution_qs:
            if item['month']:
                m = item['month'].month
                evolution_ca.append({'mois': months_fr.get(m, str(m)), 'CA': float(item['CA'] or 0)})

        # --- 3. STATISTIQUES CLIENTS ---
        total_clients = Contact.objects.count()
        
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        nouveaux_clients = Contact.objects.filter(date_ajout__gte=thirty_days_ago).count() 

        return Response({
            'kpis': {
                'ca_total': ca_total,
                'valeur_pipeline': valeur_pipeline,
                'taux_conversion': taux_conversion,
                'panier_moyen': panier_moyen,
                'total_clients': total_clients,
                'nouveaux_clients': nouveaux_clients
            },
            'ca_par_commercial': ca_par_commercial,
            'pipeline_data': pipeline_data,
            'evolution_ca': evolution_ca,
            'segmentation_secteur': [
                {'name': 'Tech & IT', 'value': 40},
                {'name': 'Services', 'value': 30},
                {'name': 'Commerce', 'value': 20},
                {'name': 'Autre', 'value': 10}
            ]
        })

    except Exception as e:
        # En cas de crash, on renvoie une belle erreur JSON compréhensible !
        print(f"Erreur Statistiques: {traceback.format_exc()}")
        return Response({'erreur': str(e), 'details': traceback.format_exc()}, status=500)
    
class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = ManageUserSerializer
    permission_classes = [IsAuthenticated]

    # SÉCURITÉ : On vérifie que celui qui fait la requête est bien un ADMIN
    def check_permissions(self, request):
        super().check_permissions(request)
        try:
            if request.user.profile.role != 'ADMIN':
                raise PermissionDenied("Accès refusé. Réservé aux administrateurs.")
        except:
            raise PermissionDenied("Profil introuvable.")

class CampagneRecurrenteViewSet(viewsets.ModelViewSet):
    queryset = CampagneRecurrente.objects.all()
    serializer_class = CampagneRecurrenteSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def envoyer_maintenant(self, request, pk=None):
        campagne = self.get_object()
        
        # On récupère tous les contacts qui ont une adresse email valide
        contacts = Contact.objects.exclude(email__isnull=True).exclude(email__exact='')
        emails_envoyes = 0
        
        for c in contacts:
            # On personnalise le message pour chaque client
            msg_perso = campagne.message.replace('{{contact.nom}}', c.nom)
            sujet_perso = campagne.sujet.replace('{{contact.nom}}', c.nom)
            
            try:
                envoyer_email_automatique(c.email, c.nom, sujet_perso, msg_perso)
                emails_envoyes += 1
            except Exception as e:
                print(f"Erreur d'envoi pour {c.email}: {e}")
                
        return Response({'message': f'Campagne envoyée avec succès à {emails_envoyes} contacts !'})