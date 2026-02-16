from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, null=True) # Lucide icon name or similar

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class PaymentMethod(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Place(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField()
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    opening_hours = models.JSONField(default=dict, blank=True, help_text="Structured operating hours")

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='places')
    payment_methods = models.ManyToManyField(PaymentMethod, related_name='places')

    cover_image = models.URLField(max_length=1000, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    scout = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='submitted_places')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class PlaceImage(models.Model):
    LABEL_CHOICES = [
        ('Inside', 'Inside'),
        ('Outside', 'Outside'),
        ('Drink', 'Drink'),
        ('Food', 'Food'),
        ('Menu', 'Menu'),
        ('Amenities', 'Amenities'),
    ]

    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='gallery')
    image_url = models.URLField(max_length=1000)
    label = models.CharField(max_length=20, choices=LABEL_CHOICES, default='Inside')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} Image for {self.place.name}"
