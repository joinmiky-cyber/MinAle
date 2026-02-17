from django.contrib import admin
from .models import Category, PaymentMethod, Place, PlaceImage, Review, ReviewImage

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name',)

class PlaceImageInline(admin.TabularInline):
    model = PlaceImage
    fields = ('image_url', 'label')
    extra = 1

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'scout', 'created_at')
    list_filter = ('status', 'category', 'payment_methods')
    search_fields = ('name', 'description', 'address')
    actions = ['approve_places', 'reject_places']
    inlines = [PlaceImageInline]

    def approve_places(self, request, queryset):
        queryset.update(status='approved')
    approve_places.short_description = "Approve selected places"

    def reject_places(self, request, queryset):
        queryset.update(status='rejected')
    reject_places.short_description = "Reject selected places"

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'rating_overall', 'helpful_count', 'created_at')
    list_filter = ('rating_overall', 'customer_service')
    search_fields = ('comment', 'user__username', 'place__name')
