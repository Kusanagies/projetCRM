from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Entreprise, Contact, Lead
from .serializers import EntrepriseSerializer, ContactSerializer, LeadSerializer
from .utils import envoyer_email_bienvenue
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