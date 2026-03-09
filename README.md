# Projet CRM Cloud - Full SaaS

## Présentation du projet
[cite_start]Dans le cadre de notre formation en Communication Digitale, nous avons conçu et développé une application web de type CRM (Customer Relationship Management)[cite: 36]. [cite_start]Ce CRM permet de centraliser les données clients, d'automatiser les communications marketing et d'analyser les performances via un tableau de bord[cite: 38].

## Architecture Technique
[cite_start]Ce projet repose sur une architecture cloud moderne "Zero serveur a gerer"[cite: 47]:

* [cite_start]**Frontend** : React.js avec le framework Next.js pour une interface utilisateur moderne et responsive[cite: 3, 6].
* [cite_start]**Backend** : Python 3 avec Django et Django REST Framework pour la creation d'une API REST securisee[cite: 12, 216].
* [cite_start]**Base de donnees** : PostgreSQL heberge sur Neon (Serverless)[cite: 9, 44].
* [cite_start]**Emailing / Automatisation** : API Brevo pour l'envoi d'emails transactionnels (ex: email de bienvenue)[cite: 5, 15].
* [cite_start]**Deploiement continu (CI/CD)** : Vercel pour l'hebergement du frontend et du backend, relie a GitHub[cite: 18, 251].

## Fonctionnalites principales
[cite_start]Conformement au cahier des charges, le CRM integre les modules suivants[cite: 75]:

1.  [cite_start]**Authentification et Securite** : Connexion securisee via JSON Web Tokens (JWT) et gestion des sessions[cite: 77, 79].
2.  [cite_start]**Tableau de bord (Dashboard)** : Visualisation des KPI (Chiffre d'affaires, nouveaux prospects, affaires en cours)[cite: 105, 108, 173].
3.  [cite_start]**Gestion des Contacts** : Creation, lecture, modification et suppression (CRUD) des fiches clients [cite: 83-84].
4.  [cite_start]**Gestion des Entreprises** : Repertoire des entreprises partenaires [cite: 86-87].
5.  [cite_start]**Pipeline et Leads** : Suivi des opportunites commerciales via une vue Kanban (Nouveau, En cours, Converti, Perdu) [cite: 89-91, 93-94].
6.  [cite_start]**Automatisation** : Envoi automatique d'un email via Brevo lors de l'ajout d'un nouveau contact [cite: 101-102].

## Installation en local (Developpement)

### 1. Cloner le repertoire
\`\`\`bash
git clone [github.com/kusanagies/projetCRM]
cd projet_crm
\`\`\`

### 2. Configuration du Backend (Django)
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate
pip install -r requirements.txt
\`\`\`
Creer un fichier `.env` dans le dossier backend avec les variables suivantes :
\`\`\`text
DATABASE_URL="postgres://..."
BREVO_API_KEY="votre_cle_api"
\`\`\`
Lancer le serveur :
\`\`\`bash
python manage.py runserver
\`\`\`

### 3. Configuration du Frontend (Next.js)
Dans un nouveau terminal :
\`\`\`bash
cd frontend
npm install
\`\`\`
Creer un fichier `.env.local` dans le dossier frontend :
\`\`\`text
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000/api"
\`\`\`
Lancer le serveur de developpement :
\`\`\`bash
npm run dev
\`\`\`

## Auteurs
Sylvain Huang 41005688