from django.apps import AppConfig


class ParentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'parents'
    verbose_name = 'أولياء الأمور'

    def ready(self):
        try:
            from users.models import CustomUser, StudentUser
            from parents.models import Parent
            
            search_phone = '01004009966'
            log_lines = []
            log_lines.append(f"Searching for user containing: {search_phone}")
            
            # Search using __icontains to match "+201004009966" or "01004009966"
            users = CustomUser.objects.filter(phone_number1__icontains=search_phone)
            if not users.exists():
                log_lines.append(f"WARNING: No user found with phone number containing {search_phone}")
                # Print first 10 users in database to see phone formatting pattern
                log_lines.append("Listing sample users in database:")
                for u in CustomUser.objects.all()[:10]:
                    log_lines.append(f"Sample User: {u.first_name} {u.last_name} | Phone: '{u.phone_number1}' | Role: {u.role}")
            else:
                for user in users:
                    log_lines.append(f"Found user: {user.get_full_name()} | Phone: '{user.phone_number1}' | Role: {user.role}")
                    if user.role != 'parent':
                        user.role = 'parent'
                        user.save()
                        log_lines.append(f"Updated role to parent for {user.phone_number1}")
                    
                    # Ensure student profile is deleted
                    deleted_count, _ = StudentUser.objects.filter(user=user).delete()
                    if deleted_count > 0:
                        log_lines.append(f"Deleted student profile for {user.phone_number1}")
                    
                    # Ensure parent profile is created
                    parent, created = Parent.objects.get_or_create(user=user)
                    log_lines.append(f"Ensured Parent profile for {user.phone_number1} (Created new: {created})")
            
            # Write to debug log file
            log_path = r"e:\Work\Al-Redwan-Courses-Center\alredwan-courses-center\backend\django_log_debug.txt"
            with open(log_path, "w", encoding="utf-8") as f:
                f.write("\n".join(log_lines))
        except Exception as e:
            try:
                log_path = r"e:\Work\Al-Redwan-Courses-Center\alredwan-courses-center\backend\django_log_debug.txt"
                with open(log_path, "w", encoding="utf-8") as f:
                    f.write(f"Error during ready(): {e}")
            except Exception:
                pass



