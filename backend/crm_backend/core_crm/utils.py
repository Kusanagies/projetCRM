import os
import requests

def envoyer_email_bienvenue(email_destinataire, nom_destinataire):
    """
    Fonction qui communique avec l'API Brevo pour envoyer un email.
    """
    api_key = os.environ.get('BREVO_API_KEY')
    url = "https://api.brevo.com/v3/smtp/email"

    # Les données attendues par Brevo
    payload = {
        "sender": {
            "name": "L'équipe CRM Cloud", 
            "email": "sylvainhuang3@gmail.com" 
        },
        "to": [{"email": email_destinataire, "name": nom_destinataire}],
        "subject": "Bienvenue dans notre réseau !",
        "htmlContent": f"<html><body><h1>Bonjour {nom_destinataire},</h1><p>Nous sommes ravis de vous compter parmi nos contacts. Notre équipe reviendra vers vous très prochainement.</p></body></html>"
    }

    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    # On envoie la requête à Brevo
    response = requests.post(url, json=payload, headers=headers)
    
    return response.status_code