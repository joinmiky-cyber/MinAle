from django.db import migrations, models

def delete_all_places(apps, schema_editor):
    Place = apps.get_model('places', 'Place')
    Place.objects.all().delete()
    # Also delete images since they depend on places
    PlaceImage = apps.get_model('places', 'PlaceImage')
    PlaceImage.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ("places", "0001_initial"),
    ]

    operations = [
        # 1. Clear existing data to avoid type conversion errors
        migrations.RunPython(delete_all_places),

        # 2. Add label to PlaceImage
        migrations.AddField(
            model_name="placeimage",
            name="label",
            field=models.CharField(
                choices=[
                    ("Inside", "Inside"),
                    ("Outside", "Outside"),
                    ("Drink", "Drink"),
                    ("Food", "Food"),
                    ("Menu", "Menu"),
                    ("Amenities", "Amenities"),
                ],
                default="Inside",
                max_length=20,
            ),
        ),
        # 3. Alter opening_hours to JSONField
        migrations.AlterField(
            model_name="place",
            name="opening_hours",
            field=models.JSONField(
                blank=True, default=dict, help_text="Structured operating hours"
            ),
        ),
    ]
