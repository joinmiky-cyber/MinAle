from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Category, PaymentMethod, Place
from .serializers import (
    CategorySerializer, PaymentMethodSerializer,
    PlaceListSerializer, PlaceDetailSerializer, PlaceCreateSerializer
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.AllowAny]

class PlaceViewSet(viewsets.ModelViewSet):
    queryset = Place.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'payment_methods', 'status']
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['created_at', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return PlaceListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PlaceCreateSerializer
        return PlaceDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Public users only see approved places
        if not user.is_authenticated:
            return queryset.filter(status='approved')

        # Admin can see everything
        if user.is_staff:
            return queryset

        # Scouts can see approved places + their own submissions
        return queryset.filter(models.Q(status='approved') | models.Q(scout=user))

    def perform_create(self, serializer):
        serializer.save(scout=self.request.user, status='pending')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email
        })