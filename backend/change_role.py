import os
import django

# Force connection to Docker DB container via the host-mapped port 5433
os.environ['DATABASE_HOST'] = 'localhost'
os.environ['DATABASE_PORT'] = '5433'

# Set up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from users.models import CustomUser, StudentUser
from parents.models import Parent

search_phone = '01004009966'
try:
    print(f"Connecting to database at {os.environ['DATABASE_HOST']}:{os.environ['DATABASE_PORT']}...")
    
    # Search for user whose phone contains the digits (e.g. +201004009966 or 01004009966)
    users = CustomUser.objects.filter(phone_number1__icontains=search_phone)
    
    if not users.exists():
        print(f"Error: No user found containing phone number '{search_phone}'")
        # List a few sample users to help diagnose
        print("Sample users in database:")
        for u in CustomUser.objects.all()[:5]:
            print(f" - {u.first_name} {u.last_name} | Phone: '{u.phone_number1}' | Role: {u.role}")
    else:
        for user in users:
            print(f"Found user: {user.get_full_name()} | Phone: '{user.phone_number1}' | Current Role: {user.role}")
            
            # Update role
            user.role = 'parent'
            user.save()
            print(" -> Updated role to 'parent'")
            
            # Delete student profile if exists
            deleted_count, _ = StudentUser.objects.filter(user=user).delete()
            if deleted_count > 0:
                print(" -> Deleted student profile")
            
            # Create parent profile if not exists
            parent, created = Parent.objects.get_or_create(user=user)
            print(f" -> Ensured Parent profile (Created new: {created})")
            
        print("SUCCESS: Role update completed successfully!")
except Exception as e:
    print(f"An error occurred: {e}")
