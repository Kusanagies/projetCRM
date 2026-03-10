# Projet CRM Cloud - Full SaaS

## Présentation du projet
Dans le cadre de notre formation en Communication Digitale, nous avons conçu et développé une application web de type CRM (Customer Relationship Management). Ce CRM permet de centraliser les données clients, d'automatiser les communications marketing, d'organiser le travail des équipes commerciales et d'analyser les performances via un tableau de bord.

## Architecture Technique
Ce projet repose sur une architecture cloud moderne "Zero serveur à gérer" :

* **Frontend** : React.js 19 avec le framework Next.js 16 et Tailwind CSS v4 pour une interface utilisateur moderne, réactive et responsive.
* **Backend** : Python 3 avec Django 6 et Django REST Framework pour la création d'une API REST sécurisée.
* **Base de données** : PostgreSQL hébergé sur Neon (Serverless).
* **Emailing / Automatisation** : API Brevo pour l'envoi d'emails transactionnels et automatisés.
* **Déploiement continu (CI/CD)** : Vercel pour l'hébergement du frontend et du backend, relié à GitHub.

## Fonctionnalités principales
Conformément au cahier des charges et aux évolutions du projet, le CRM intègre les modules suivants :

1.  **Authentification, Sécurité et Rôles** : Connexion sécurisée via JSON Web Tokens (JWT). Gestion avancée des profils utilisateurs avec différents niveaux d'accès (Administrateur, Commercial, Utilisateur standard).
2.  **Tableau de bord (Dashboard)** : Visualisation des KPI (Chiffre d'affaires, nouveaux prospects, affaires en cours) via des graphiques interactifs (Recharts).
3.  **Gestion des Contacts** : Création, lecture, modification et suppression (CRUD) des fiches clients avec un historique complet des échanges.
4.  **Gestion des Entreprises** : Répertoire des entreprises partenaires en relation avec les contacts.
5.  **Pipeline et Leads** : Suivi des opportunités commerciales via une vue Kanban (Nouveau, En cours, Converti, Perdu). Les leads incluent une valeur estimée et peuvent être directement assignés à un commercial spécifique.
6.  **Gestion des Tâches** : Suivi des actions à réaliser (Appels téléphoniques, Rendez-vous, Emails, Rappels généraux) avec gestion des dates d'échéance et assignation aux commerciaux et aux contacts.
7.  **Automatisation** : Système de règles d'automatisation permettant de déclencher l'envoi de messages spécifiques (via Brevo) en fonction du changement de statut d'un lead.

## Installation en local (Développement)

### 1. Cloner le répertoire
```bash
git clone [https://github.com/kusanagies/projetCRM.git](https://github.com/kusanagies/projetCRM.git)
cd projetCRM

```

### 2. Configuration du backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate
pip install -r requirements.txt
```
Créer un fichier .env dans le dossier backend avec les variables suivantes :
```bash
DATABASE_URL="postgres://..."
BREVO_API_KEY="votre_cle_api"
```

Appliquer les migrations et lancer le serveur: 

```bash 
python manage.py migrate
python manage.py runserver
```

### 3. Configuration du frontend

Dans un nouveau terminal : 

```bash
cd fronten
npm install
```

Créer un fichier .env.local dans le dossier frontend
```bash 
NEXT_PUBLIC_API_URL="[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)"
```

Lancer le serveur de développement: 

```bash 
npm run dev
```

## Auteurs
Sylvain Huang 41005688