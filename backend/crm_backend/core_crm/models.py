from django.db import models
from django.contrib.auth.models import User

class Entreprise(models.Model):
    nom = models.CharField(max_length=255)
    secteur_activite = models.CharField(max_length=255, blank=True, null=True)
    site_web = models.URLField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

class Contact(models.Model):
    nom = models.CharField(max_length=255) # 
    email = models.EmailField(unique=True) # 
    telephone = models.CharField(max_length=20, blank=True, null=True) # 
    
    # La clé étrangère : on associe le contact à une entreprise 
    entreprise = models.ForeignKey(Entreprise, on_delete=models.SET_NULL, null=True, blank=True, related_name='contacts') # 
    
    historique = models.TextField(blank=True, null=True, help_text="Historique des échanges avec ce contact") # 
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.email})"
    

class Lead(models.Model):
    # Les statuts exigés par le cahier des charges
    STATUT_CHOICES = [
        ('NOUVEAU', 'Nouveau'),
        ('EN_COURS', 'En cours'),
        ('CONVERTI', 'Converti'),
        ('PERDU', 'Perdu'),
    ]

    titre = models.CharField(max_length=255, help_text="Ex: Vente de 50 licences SaaS")
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='leads')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='NOUVEAU')
    valeur_estimee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Montant estimé en euros")
    
    # Attribution à un commercial (lié au modèle User par défaut de Django)
    commercial_assigne = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads_assignes')
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titre} - {self.contact.nom} ({self.get_statut_display()})"
    
class AutomationRule(models.Model):
    STATUT_CHOICES = [
        ('NOUVEAU', 'Nouveau'),
        ('EN_COURS', 'En cours'),
        ('CONVERTI', 'Converti'),
        ('PERDU', 'Perdu'),
    ]
    
    statut_declencheur = models.CharField(max_length=20, choices=STATUT_CHOICES)
    actif = models.BooleanField(default=True)
    sujet = models.CharField(max_length=255)
    message = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Règle: {self.statut_declencheur} - Actif: {self.actif}"
    
# Ajoutez cette classe tout en bas de models.py
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('COMMERCIAL', 'Commercial'),
        ('STANDARD', 'Utilisateur standard'),
    ]
    
    # On lie ce profil au modèle User par défaut de Django
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STANDARD')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

class Tache(models.Model):
    TYPE_CHOICES = [
        ('APPEL', 'Appel téléphonique'),
        ('RDV', 'Rendez-vous'),
        ('EMAIL', 'Email à envoyer'),
        ('RAPPEL', 'Rappel général'),
    ]
    
    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type_tache = models.CharField(max_length=20, choices=TYPE_CHOICES, default='RAPPEL')
    date_echeance = models.DateTimeField()
    est_terminee = models.BooleanField(default=False)
    
    # Liens optionnels mais très utiles
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='taches', null=True, blank=True)
    commercial = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taches_assignees')
    
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type_tache} - {self.titre} ({self.date_echeance})"

class CampagneRecurrente(models.Model):
    FREQUENCE_CHOICES = [
        ('HEBDO', 'Chaque Semaine'),
        ('MENSUEL', 'Chaque Mois'),
    ]
    
    titre = models.CharField(max_length=255, help_text="Ex: Newsletter Mensuelle")
    sujet = models.CharField(max_length=255)
    message = models.TextField()
    frequence = models.CharField(max_length=20, choices=FREQUENCE_CHOICES)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre