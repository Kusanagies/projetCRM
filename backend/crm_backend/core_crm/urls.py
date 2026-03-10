from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EntrepriseViewSet, 
    ContactViewSet, 
    LeadViewSet, 
    AutomationRuleViewSet,
    TacheViewSet,
    dashboard_stats,
    advanced_stats,
    RegisterView,
    current_user,
    get_commercials,
    UserManagementViewSet
)

# 1. Le routeur automatique pour les CRUD (Créer, Lire, Modifier, Supprimer)
router = DefaultRouter()
router.register(r'entreprises', EntrepriseViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'automations', AutomationRuleViewSet)
router.register(r'taches', TacheViewSet)
router.register(r'equipe', UserManagementViewSet, basename='equipe')

# 2. Les routes manuelles (pour nos fonctions spéciales)
urlpatterns = [
    path('', include(router.urls)),
    
    # --- Statistiques ---
    path('dashboard-stats/', dashboard_stats, name='dashboard_stats'),
    path('advanced-stats/', advanced_stats, name='advanced_stats'), # <-- LA VOILÀ !
    
    # --- Utilisateurs et Rôles ---
    path('register/', RegisterView.as_view(), name='register'),
    path('users/me/', current_user, name='current_user'),
    path('commercials/', get_commercials, name='commercials'),
]