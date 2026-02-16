from rest_framework import serializers
from .models import Category, PaymentMethod, Place, PlaceImage
from django.contrib.auth.models import User

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

    class Meta:
        model = Place
        fields = '__all__'

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
