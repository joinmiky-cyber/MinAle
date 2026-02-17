from rest_framework import serializers
from .models import Category, PaymentMethod, Place, PlaceImage, Review, ReviewImage, HelpfulVote
from django.contrib.auth.models import User
from django.db.models import Avg, Count

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'

class PlaceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaceImage
        fields = ('id', 'image_url', 'label')

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ('id', 'image_url', 'label')

class ReviewImageInputSerializer(serializers.Serializer):
    image_url = serializers.URLField()
    label = serializers.ChoiceField(choices=ReviewImage.LABEL_CHOICES, default='User Photo')

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    images = ReviewImageSerializer(many=True, read_only=True)
    is_helpful = serializers.SerializerMethodField()
    images_data = ReviewImageInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Review
        fields = (
            'id', 'place', 'user_name', 'rating_overall', 'customer_service',
            'wifi_speed', 'cleanliness', 'comment', 'helpful_count',
            'is_helpful', 'images', 'images_data', 'created_at'
        )
        read_only_fields = ('helpful_count',)

    def get_is_helpful(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return HelpfulVote.objects.filter(review=obj, user=request.user).exists()
        return False

    def create(self, validated_data):
        images_data = validated_data.pop('images_data', [])
        review = Review.objects.create(**validated_data)
        for item in images_data:
            ReviewImage.objects.create(review=review, **item)
        return review

class GalleryImageInputSerializer(serializers.Serializer):
    image_url = serializers.URLField()
    label = serializers.ChoiceField(choices=PlaceImage.LABEL_CHOICES)

class PlaceListSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    avg_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = ('id', 'name', 'address', 'category', 'category_name', 'cover_image', 'status', 'avg_rating', 'total_reviews', 'created_at')

    def get_avg_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating_overall'))['rating_overall__avg']
        return float(avg) if avg is not None else 0.0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

class PlaceDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    payment_methods = PaymentMethodSerializer(many=True, read_only=True)
    gallery = PlaceImageSerializer(many=True, read_only=True)
    scout_name = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    rating_stats = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = '__all__'

    def get_scout_name(self, obj):
        return obj.scout.username if obj.scout else None

    def get_rating_stats(self, obj):
        stats = obj.reviews.aggregate(
            avg_overall=Avg('rating_overall'),
            avg_service=Avg('customer_service'),
            avg_wifi=Avg('wifi_speed'),
            avg_cleanliness=Avg('cleanliness'),
            total_reviews=Count('id')
        )
        # Ensure all values are JSON serializable and handle None
        return {
            'avg_overall': float(stats['avg_overall']) if stats['avg_overall'] is not None else 0.0,
            'avg_service': float(stats['avg_service']) if stats['avg_service'] is not None else 0.0,
            'avg_wifi': float(stats['avg_wifi']) if stats['avg_wifi'] is not None else 0.0,
            'avg_cleanliness': float(stats['avg_cleanliness']) if stats['avg_cleanliness'] is not None else 0.0,
            'total_reviews': stats['total_reviews'] or 0
        }

class PlaceCreateSerializer(serializers.ModelSerializer):
    gallery = GalleryImageInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Place
        fields = (
            'id', 'name', 'description', 'address', 'latitude', 'longitude',
            'opening_hours', 'category', 'payment_methods', 'cover_image', 'gallery'
        )

    def create(self, validated_data):
        gallery_data = validated_data.pop('gallery', [])
        payment_methods = validated_data.pop('payment_methods', [])

        place = Place.objects.create(**validated_data)
        place.payment_methods.set(payment_methods)

        for item in gallery_data:
            PlaceImage.objects.create(place=place, **item)

        return place

    def update(self, instance, validated_data):
        # Only allow update if pending
        if instance.status != 'pending':
            raise serializers.ValidationError("Only pending submissions can be edited.")

        gallery_data = validated_data.pop('gallery', None)
        payment_methods = validated_data.pop('payment_methods', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if payment_methods is not None:
            instance.payment_methods.set(payment_methods)

        if gallery_data is not None:
            instance.gallery.all().delete()
            for item in gallery_data:
                PlaceImage.objects.create(place=instance, **item)

        return instance
