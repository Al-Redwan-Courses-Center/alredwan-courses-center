from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config
from datetime import date


class Command(BaseCommand):
    help = "Create a superuser from environment variables if it doesn't exist"

    def handle(self, *args, **options):
        User = get_user_model()
        
        phone = config("DJANGO_SUPERUSER_PHONE", default=None)
        password = config("DJANGO_SUPERUSER_PASSWORD", default=None)
        first_name = config("DJANGO_SUPERUSER_FIRST_NAME", default="Admin")
        last_name = config("DJANGO_SUPERUSER_LAST_NAME", default="User")
        
        if not phone or not password:
            self.stdout.write(
                self.style.WARNING(
                    "DJANGO_SUPERUSER_PHONE and DJANGO_SUPERUSER_PASSWORD must be set"
                )
            )
            return
        
        if User.objects.filter(phone_number1=phone).exists():
            self.stdout.write(
                self.style.WARNING(f"Superuser with phone {phone} already exists")
            )
            return
        
        User.objects.create_superuser(
            phone_number1=phone,
            password=password,
            first_name=first_name,
            last_name=last_name,
            dob=date(1990, 1, 1),  # Default DOB for admin
            gender="male",  # Default gender for admin
        )
        
        self.stdout.write(
            self.style.SUCCESS(f"Superuser created with phone: {phone}")
        )
