from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntrepriseViewSet, ContactViewSet, LeadViewSet, dashboard_stats # [Modifié] Import de dashboard_stats

router = DefaultRouter()
router.register(r'entreprises', EntrepriseViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'leads', LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', dashboard_stats, name='dashboard_stats'),
]