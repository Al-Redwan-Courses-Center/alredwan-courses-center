import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from users.models import CustomUser

# Get the first user or a specific one if we knew the ID
user = CustomUser.objects.filter(image__isnull=False).first()
if user:
    print(f"User {user.phone_number1} has image: {user.image.name}")
    print(f"URL: {user.image.url}")
else:
    print("No user found with an image!")

# Also check the last updated user
user = CustomUser.objects.order_by('-date_joined').first()
if user:
    print(f"Latest user {user.phone_number1} image: {user.image.name if user.image else 'None'}")
