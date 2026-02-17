import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'minale_backend.settings')
django.setup()

from places.models import Place, User, Category, Review
from places.serializers import PlaceDetailSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/')
user = User.objects.first() or User.objects.create_user('testuser', 'test@example.com', 'pass')
request.user = user

place = Place.objects.first()
if not place:
    cat = Category.objects.first() or Category.objects.create(name='Test', slug='test')
    place = Place.objects.create(name='Test Place', category=cat, scout=user)

# Add a review
Review.objects.get_or_create(place=place, user=user, comment='Good')

serializer = PlaceDetailSerializer(place, context={'request': request})
try:
    print("Trying with context...")
    data = serializer.data
    print("Serializer works with context")
except Exception as e:
    print(f"Serializer failed with context: {e}")

serializer_no_context = PlaceDetailSerializer(place, context={})
try:
    print("Trying without context...")
    data = serializer_no_context.data
    print("Serializer works without context")
except Exception as e:
    print(f"Serializer failed without context: {e}")
