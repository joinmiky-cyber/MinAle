from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Category, PaymentMethod, Place, Review, HelpfulVote
from .serializers import (
    CategorySerializer, PaymentMethodSerializer,
    PlaceListSerializer, PlaceDetailSerializer, PlaceCreateSerializer,
    ReviewSerializer
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.AllowAny]

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['place', 'user']
    ordering_fields = ['created_at', 'helpful_count']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def helpful(self, request, pk=None):
        review = self.get_object()
        user = request.user

        vote, created = HelpfulVote.objects.get_or_create(review=review, user=user)

        if not created:
            # Toggle off if already voted? User didn't specify, but usually "Helpful" is toggleable
            vote.delete()
            review.helpful_count = models.F('helpful_count') - 1
            review.save()
            review.refresh_from_db()
            return Response({'status': 'vote removed', 'helpful_count': review.helpful_count})

        review.helpful_count = models.F('helpful_count') + 1
        review.save()
        review.refresh_from_db()
        return Response({'status': 'vote added', 'helpful_count': review.helpful_count})

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