import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

admin_phone = '+201000000000'
normal_phone = '+201111111111'

# Create Admin User
if not User.objects.filter(phone_number1=admin_phone).exists():
    admin_user = User.objects.create_superuser(
        phone_number1=admin_phone, 
        password='adminpassword123',
        email='admin@example.com',
        first_name='Admin',
        last_name='User',
        dob=date(1990, 1, 1),
        gender='male'
    )
    print(f"Admin user created: phone='{admin_phone}', password='adminpassword123'")
else:
    print(f"Admin user {admin_phone} already exists. Password might be unchanged.")
    admin_user = User.objects.get(phone_number1=admin_phone)
    admin_user.set_password('adminpassword123')
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.save()
    print(f"Admin user password reset to 'adminpassword123'")

# Create Normal User
if not User.objects.filter(phone_number1=normal_phone).exists():
    normal_user = User.objects.create_user(
        phone_number1=normal_phone, 
        password='userpassword123',
        email='user@example.com',
        first_name='Normal',
        last_name='User',
        dob=date(2000, 1, 1),
        gender='male'
    )
    print(f"Normal user created: phone='{normal_phone}', password='userpassword123'")
else:
    print(f"Normal user {normal_phone} already exists.")
    normal_user = User.objects.get(phone_number1=normal_phone)
    normal_user.set_password('userpassword123')
    normal_user.save()
    print(f"Normal user password reset to 'userpassword123'")
