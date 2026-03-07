from django.contrib import admin
from .models import Entreprise, Contact, Lead

@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    # Les colonnes qui s'afficheront dans le tableau
    list_display = ('nom', 'secteur_activite', 'site_web', 'date_creation')
    # Ajoute une barre de recherche
    search_fields = ('nom', 'secteur_activite')
    # Ajoute des filtres sur le côté droit
    list_filter = ('secteur_activite', 'date_creation')

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email', 'telephone', 'entreprise', 'date_ajout')
    search_fields = ('nom', 'email')
    list_filter = ('entreprise', 'date_ajout')

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    # Affiche le statut (nouveau, en cours, converti, perdu) et le commercial assigné [cite: 91, 92]
    list_display = ('titre', 'contact', 'statut', 'valeur_estimee', 'commercial_assigne', 'date_creation')
    list_filter = ('statut', 'commercial_assigne', 'date_creation')
    # Permet de chercher par titre du lead ou par le nom du contact associé
    search_fields = ('titre', 'contact__nom')