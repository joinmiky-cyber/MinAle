import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'minale_backend.settings')
django.setup()

from places.models import Place, User, Category, Review, ReviewImage
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
review, _ = Review.objects.get_or_create(place=place, user=user, defaults={'comment': 'Good'})

# Add a review image
ReviewImage.objects.get_or_create(review=review, image_url='http://example.com/img.jpg', defaults={'label': 'Inside'})

serializer = PlaceDetailSerializer(place, context={'request': request})
try:
    print("Trying with context and review...")
    data = serializer.data
    print("Serializer works")
    print(data['rating_stats'])
except Exception as e:
    print(f"Serializer failed: {e}")
    import traceback
    traceback.print_exc()
