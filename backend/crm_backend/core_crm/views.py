from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum

from .models import Entreprise, Contact, Lead
from .serializers import EntrepriseSerializer, ContactSerializer, LeadSerializer
from .utils import envoyer_email_bienvenue, envoyer_email_conversion_lead, get_brevo_stats

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

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer   
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        # On sauvegarde l'ancien statut avant la mise à jour
        ancien_statut = self.get_object().statut
        
        # On sauvegarde les nouvelles données
        lead = serializer.save()
        
        # Automatisation 2 : Si le lead passe en CONVERTI (via Drag&Drop ou Edit)
        if ancien_statut != 'CONVERTI' and lead.statut == 'CONVERTI':
            if lead.contact and lead.contact.email:
                try:
                    envoyer_email_conversion_lead(lead.contact.email, lead.contact.nom, lead.titre)
                    print(f"[Succes] Email de conversion envoye a {lead.contact.email}")
                except Exception as e:
                    print(f"[Erreur] Email de conversion echoue : {e}")

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