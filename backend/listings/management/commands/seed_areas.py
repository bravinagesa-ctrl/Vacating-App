from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from listings.models import Area

# Approximate centre points. Check each one on the map in /admin/ and adjust.
# Scores start at 3 (neutral): replace them with real local knowledge in /admin/.
AREAS = [
    ("Uthiru", "Nairobi", -1.2744, 36.7183),
    ("Kilimani", "Nairobi", -1.2896, 36.7867),
    ("Westlands", "Nairobi", -1.2676, 36.8108),
    ("Kasarani", "Nairobi", -1.2216, 36.8990),
    ("Ruaka", "Kiambu", -1.2050, 36.7750),
    ("Syokimau", "Machakos", -1.3586, 36.9366),
    ("Rongai", "Kajiado", -1.3967, 36.7436),
    ("Kahawa West", "Nairobi", -1.1850, 36.9100),
]


class Command(BaseCommand):
    help = "Create starter neighbourhoods (safe to run more than once)."

    def handle(self, *args, **options):
        created = 0
        for name, county, lat, lng in AREAS:
            _, was_created = Area.objects.get_or_create(
                slug=name.lower().replace(" ", "-"),
                defaults={"name": name, "county": county, "center": Point(lng, lat, srid=4326)},
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"{created} new areas added."))
