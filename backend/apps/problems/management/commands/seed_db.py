from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os


class Command(BaseCommand):
    help = "Clears the database and seeds it with initial data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # 1. Flush database
        self.stdout.write("Flushing database...")
        call_command("flush", "--no-input")

        # 2. Load fixtures
        fixtures_dir = os.path.join(settings.BASE_DIR, "fixtures")

        fixtures = ["users.json", "languages.json", "problems.json"]

        for fixture in fixtures:
            fixture_path = os.path.join(fixtures_dir, fixture)
            if os.path.exists(fixture_path):
                self.stdout.write(f"Loading {fixture}...")
                call_command("loaddata", fixture_path)
            else:
                self.stdout.write(
                    self.style.WARNING(f"Fixture {fixture} not found at {fixture_path}")
                )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
