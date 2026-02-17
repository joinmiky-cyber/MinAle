from django.db import migrations

def delete_all_places(apps, schema_editor):
    Place = apps.get_model('places', 'Place')
    PlaceImage = apps.get_model('places', 'PlaceImage')
    PlaceImage.objects.all().delete()
    Place.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ("places", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(delete_all_places, reverse_code=migrations.RunPython.noop),
    ]
