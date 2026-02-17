from django.db import migrations, models

def copy_customer_service_data(apps, schema_editor):
    Review = apps.get_model('places', 'Review')
    for review in Review.objects.all():
        review.customer_service = 5 if review.customer_service_old else 1
        review.save()

class Migration(migrations.Migration):

    dependencies = [
        ("places", "0004_review_reviewimage_helpfulvote"),
    ]

    operations = [
        migrations.AddField(
            model_name="reviewimage",
            name="label",
            field=models.CharField(
                choices=[
                    ("Inside", "Inside"),
                    ("Outside", "Outside"),
                    ("Drink", "Drink"),
                    ("Food", "Food"),
                    ("Menu", "Menu"),
                    ("Amenities", "Amenities"),
                    ("User Photo", "User Photo"),
                ],
                default="User Photo",
                max_length=20,
            ),
        ),
        # Step 1: Rename old field
        migrations.RenameField(
            model_name='review',
            old_name='customer_service',
            new_name='customer_service_old',
        ),
        # Step 2: Add new integer field
        migrations.AddField(
            model_name='review',
            name='customer_service',
            field=models.PositiveSmallIntegerField(default=5, help_text="1-5 rating"),
        ),
        # Step 3: Copy data
        migrations.RunPython(copy_customer_service_data, reverse_code=migrations.RunPython.noop),

        # Step 4: Remove old field
        migrations.RemoveField(
            model_name='review',
            name='customer_service_old',
        ),
    ]
