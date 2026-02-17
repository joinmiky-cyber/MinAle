from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("places", "0002_clear_data"),
    ]

    operations = [
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
        migrations.AlterField(
            model_name="place",
            name="opening_hours",
            field=models.JSONField(
                blank=True, default=dict, help_text="Structured operating hours"
            ),
        ),
    ]
