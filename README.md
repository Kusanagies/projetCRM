# Pour le front faire :
Dans le dossier fronten/

>npm run dev

# Pour le back faire : 
Dans le dossier backend/

>source venv/bin/activate
>python manage.py runserver

# Lorsqu'on ajoute un modele dans /core_crm/models.py 
Dans le dossier crm_backend/

Cela va nous permettre de mettre à jour les modèles dans Neon

>python manage.py makemigrations core_crm 
>python manage.py migrate