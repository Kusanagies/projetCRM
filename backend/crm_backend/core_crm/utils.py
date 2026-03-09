import os
import requests

# PENSEZ À CHANGER CETTE VARIABLE PAR VOTRE VRAIE ADRESSE EMAIL BREVO
SENDER_EMAIL = "sylvainhuang3@gmail.com"

def envoyer_email_bienvenue(email_destinataire, nom_destinataire):
    """ Envoi automatisé lors de la création d'un contact """
    api_key = os.environ.get('BREVO_API_KEY')
    url = "https://api.brevo.com/v3/smtp/email"

    payload = {
        "sender": {"name": "L'équipe CRM", "email": SENDER_EMAIL},
        "to": [{"email": email_destinataire, "name": nom_destinataire}],
        "subject": "Bienvenue dans notre réseau !",
        "htmlContent": f"<html><body><h1>Bonjour {nom_destinataire},</h1><p>Nous sommes ravis de vous compter parmi nos contacts. Notre équipe reviendra vers vous très prochainement.</p></body></html>"
    }
    headers = {"accept": "application/json", "api-key": api_key, "content-type": "application/json"}
    response = requests.post(url, json=payload, headers=headers)
    return response.status_code

def envoyer_email_conversion_lead(email_destinataire, nom_destinataire, titre_lead):
    """ Envoi automatisé lorsqu'un Lead passe en statut CONVERTI """
    api_key = os.environ.get('BREVO_API_KEY')
    url = "https://api.brevo.com/v3/smtp/email"

    payload = {
        "sender": {"name": "Service Commercial", "email": SENDER_EMAIL},
        "to": [{"email": email_destinataire, "name": nom_destinataire}],
        "subject": "Félicitations pour notre nouveau partenariat !",
        "htmlContent": f"<html><body><h1>Bonjour {nom_destinataire},</h1><p>Nous sommes ravis d'avoir conclu l'accord concernant : <strong>{titre_lead}</strong>.</p><p>La prochaine étape de notre collaboration commence maintenant !</p></body></html>"
    }
    headers = {"accept": "application/json", "api-key": api_key, "content-type": "application/json"}
    response = requests.post(url, json=payload, headers=headers)
    return response.status_code

def get_brevo_stats():
    """ Récupération des performances (Ouvertures / Clics) depuis l'API Brevo """
    api_key = os.environ.get('BREVO_API_KEY')
    url = "https://api.brevo.com/v3/smtp/statistics/aggregatedReport"
    
    headers = {"accept": "application/json", "api-key": api_key}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return {
                "envoyes": data.get("requests", 0),
                "ouverts": data.get("uniqueOpens", 0),
                "clics": data.get("uniqueClicks", 0),
                "bounces": data.get("hardBounces", 0)
            }
    except Exception as e:
        print(f"Erreur lors de la récupération des stats Brevo : {e}")
        
    # Valeurs par défaut si l'API échoue ou n'a pas encore de données
    return {"envoyes": 0, "ouverts": 0, "clics": 0, "bounces": 0}