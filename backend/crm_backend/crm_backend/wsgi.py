import os
import sys
from django.core.wsgi import get_wsgi_application

# --- AJOUT POUR VERCEL ---
# On indique explicitement à Python où se trouve le dossier contenant manage.py
path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.insert(0, path)
# -------------------------

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

application = get_wsgi_application()