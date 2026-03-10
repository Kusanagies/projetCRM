from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum

from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer

from .models import Entreprise, Contact, Lead, AutomationRule, Tache
from .serializers import EntrepriseSerializer, ContactSerializer, LeadSerializer, AutomationRuleSerializer, TacheSerializer
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