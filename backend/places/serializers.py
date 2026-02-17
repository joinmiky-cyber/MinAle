from rest_framework import serializers
from .models import Category, PaymentMethod, Place, PlaceImage, Review, ReviewImage, HelpfulVote
from django.contrib.auth.models import User
from django.db.models import Avg

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
        fields = ('id', 'image_url')

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    images = ReviewImageSerializer(many=True, read_only=True)
    is_helpful = serializers.SerializerMethodField()
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Review
        fields = (
            'id', 'place', 'user_name', 'rating_overall', 'customer_service',
            'wifi_speed', 'cleanliness', 'comment', 'helpful_count',
            'is_helpful', 'images', 'image_urls', 'created_at'
        )
        read_only_fields = ('helpful_count',)

    def get_is_helpful(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return HelpfulVote.objects.filter(review=obj, user=user).exists()
        return False

    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        review = Review.objects.create(**validated_data)
        for url in image_urls:
            ReviewImage.objects.create(review=review, image_url=url)
        return review

class GalleryImageInputSerializer(serializers.Serializer):
    image_url = serializers.URLField()
    label = serializers.ChoiceField(choices=PlaceImage.LABEL_CHOICES)

class PlaceListSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Place
        fields = ('id', 'name', 'address', 'category', 'category_name', 'cover_image', 'status', 'created_at')

class PlaceDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    payment_methods = PaymentMethodSerializer(many=True, read_only=True)
    gallery = PlaceImageSerializer(many=True, read_only=True)
    scout_name = serializers.ReadOnlyField(source='scout.username')
    reviews = ReviewSerializer(many=True, read_only=True)
    rating_stats = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = '__all__'

    def get_rating_stats(self, obj):
        stats = obj.reviews.aggregate(
            avg_overall=Avg('rating_overall'),
            avg_wifi=Avg('wifi_speed'),
            avg_cleanliness=Avg('cleanliness'),
            total_reviews=models.Count('id')
        )

        # Calculate customer service percentage
        total = stats['total_reviews']
        if total > 0:
            good_service = obj.reviews.filter(customer_service=True).count()
            stats['customer_service_pct'] = (good_service / total) * 100
        else:
            stats['customer_service_pct'] = 0

        return stats

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
