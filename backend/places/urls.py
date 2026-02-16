from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, PaymentMethodViewSet, PlaceViewSet, MeView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'payment-methods', PaymentMethodViewSet)
router.register(r'places', PlaceViewSet)

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('', include(router.urls)),
]
