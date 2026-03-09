from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Entreprise, Contact, Lead
from .serializers import EntrepriseSerializer, ContactSerializer, LeadSerializer
from .utils import envoyer_email_bienvenue

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum

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
            envoyer_email_bienvenue(contact.email, contact.nom)
            print(f"[Succes] Email de bienvenue envoye a {contact.email}")
        except Exception as e:
            print(f"[Erreur] Impossible d'envoyer l'email via Brevo : {e}")

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer   
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    # 1. Calcul du Chiffre d'Affaires (Somme des leads "CONVERTI")
    ca_total = Lead.objects.filter(statut='CONVERTI').aggregate(Sum('valeur_estimee'))['valeur_estimee__sum'] or 0

    # 2. Nombre de nouveaux prospects
    nouveaux_leads = Lead.objects.filter(statut='NOUVEAU').count()

    # 3. Nombre d'affaires en cours (pour simuler les tâches/urgences)
    leads_en_cours = Lead.objects.filter(statut='EN_COURS').count()

    # 4. Récupérer les 5 derniers contacts ajoutés pour l'activité récente
    contacts_recents = Contact.objects.order_by('-date_ajout')[:5].values('id', 'nom', 'email', 'date_ajout')

    return Response({
        'ca_total': ca_total,
        'nouveaux_leads': nouveaux_leads,
        'leads_en_cours': leads_en_cours,
        'contacts_recents': list(contacts_recents)
    })