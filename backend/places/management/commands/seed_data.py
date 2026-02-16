from django.core.management.base import BaseCommand
from places.models import Category, PaymentMethod
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seed initial categories and payment methods'

    def handle(self, *args, **kwargs):
        categories = [
            'Cafes / Macchiato Spots',
            'Traditional Restaurants',
            'Modern Restaurants',
            'Gyms / Fitness Centers',
            'Beauty Salons',
            'Barbershops',
            'Hotels',
            'Guesthouses',
            'Pharmacies',
            'Supermarkets'
        ]

        payment_methods = [
            'Telebirr',
            'M-Pesa',
            'Cash',
            'Bank Transfer',
            'Visa / Mastercard',
            'CBE Birr'
        ]

        for cat_name in categories:
            Category.objects.get_or_create(
                name=cat_name,
                defaults={'slug': slugify(cat_name)}
            )
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(categories)} categories'))

        for pay_name in payment_methods:
            PaymentMethod.objects.get_or_create(name=pay_name)
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(payment_methods)} payment methods'))
