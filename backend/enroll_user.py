import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from users.models.user import CustomUser
from users.models.student import StudentUser
from courses.models.course import Course
from enrollments_payments.models.enrollment import Enrollment, EnrollmentStatus

def enroll_user(phone, course_name):
    try:
        user = CustomUser.objects.get(phone_number1=phone)
        course = Course.objects.filter(name__icontains=course_name).first()
        
        if not course:
            print(f"Course '{course_name}' not found.")
            return

        if user.role == 'student':
            student, _ = StudentUser.objects.get_or_create(user=user)
            enrollment, created = Enrollment.objects.get_or_create(
                course=course,
                student=student,
                defaults={'status': EnrollmentStatus.ACTIVE}
            )
            if created:
                print(f"Enrolled student {user.get_full_name()} in {course.name}")
            else:
                print(f"Student {user.get_full_name()} already enrolled in {course.name}")
        
        elif user.role == 'parent':
            from parents.models.parent import Child, Parent
            parent = Parent.objects.get(user=user)
            child = Child.objects.filter(primary_parent=parent).first()
            if not child:
                print(f"Parent {user.get_full_name()} has no children to enroll.")
                return
            
            enrollment, created = Enrollment.objects.get_or_create(
                course=course,
                child=child,
                defaults={'status': EnrollmentStatus.ACTIVE}
            )
            if created:
                print(f"Enrolled child {child.first_name} (Parent: {user.get_full_name()}) in {course.name}")
            else:
                print(f"Child {child.first_name} already enrolled in {course.name}")
        else:
            print(f"User role {user.role} cannot be enrolled directly.")

    except CustomUser.DoesNotExist:
        print(f"User with phone {phone} not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    enroll_user('+201069158744', 'تأسيس اللغة العربية')
