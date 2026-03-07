from rest_framework import viewsets
from .models import Entreprise, Contact, Lead
from .serializers import EntrepriseSerializer, ContactSerializer, LeadSerializer

class EntrepriseViewSet(viewsets.ModelViewSet):
    queryset = Entreprise.objects.all()
    serializer_class = EntrepriseSerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

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