from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntrepriseViewSet, ContactViewSet, LeadViewSet

router = DefaultRouter()
router.register(r'entreprises', EntrepriseViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'leads', LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]