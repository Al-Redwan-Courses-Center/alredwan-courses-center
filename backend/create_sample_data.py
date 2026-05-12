import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from users.models import CustomUser, Instructor
from courses.models import Course, Tag, Season, CourseSchedule

def create_sample_data():
    from users.models.student import StudentUser
    # 0. Create Student User (The USER)
    student_user, _ = CustomUser.objects.get_or_create(
        phone_number1='+201069158744',
        defaults={
            'first_name': 'محمد',
            'last_name': 'أحمد',
            'role': 'student',
            'gender': 'male',
            'dob': '2000-01-01',
            'is_verified': True
        }
    )
    student_user.set_password('12345678')
    student_user.save()
    StudentUser.objects.get_or_create(user=student_user)
    print(f"Created student user: {student_user}")

    # 1. Create Instructor User
    instructor_user, created = CustomUser.objects.get_or_create(
        phone_number1='+201000000001',
        defaults={
            'first_name': 'أحمد',
            'last_name': 'علي',
            'email': 'ahmed@example.com',
            'role': 'instructor',
            'is_verified': True,
            'dob': '1985-01-01',
            'gender': 'male'
        }
    )
    if created:
        instructor_user.set_password('password123')
        instructor_user.save()
        print(f"Created instructor user: {instructor_user}")
    
    # 2. Create Instructor Profile
    instructor, created = Instructor.objects.get_or_create(
        user=instructor_user,
        defaults={
            'bio': 'مدرس خبير في اللغة العربية والتربية الإسلامية.',
            'type': 'normal',
            'monthly_salary': 5000.00
        }
    )
    if created:
        print(f"Created instructor profile: {instructor}")

    # 3. Create Season
    season, created = Season.objects.get_or_create(
        name='موسم صيف 2026',
        defaults={
            'season_type': 'summer_camp',
            'start_date': timezone.now().date(),
            'end_date': (timezone.now() + timedelta(days=90)).date(),
            'is_active': True
        }
    )
    if created:
        print(f"Created season: {season}")

    # 4. Create Tags
    tag_arabic, _ = Tag.objects.get_or_create(name='اللغة العربية')
    tag_religion, _ = Tag.objects.get_or_create(name='تربية إسلامية')

    # 5. Create Course
    course, created = Course.objects.get_or_create(
        id=1,
        defaults={
            'name': 'تأسيس اللغة العربية للناشئين',
            'slug': 'arabic-basics-junior',
            'description': 'دورة متكاملة لتأسيس الأطفال في قواعد اللغة العربية والقراءة الصحيحة بأسلوب ممتع ومبسط.',
            'start_date': timezone.now().date() + timedelta(days=7),
            'end_date': (timezone.now() + timedelta(days=67)).date(),
            'num_lectures': 24,
            'capacity': 30,
            'price': 1500,
            'is_active': True,
            'season': season,
            'instructor': instructor,
            'for_adults': False,
            'min_age': 6,
            'max_age': 12
        }
    )
    if created:
        course.tags.add(tag_arabic, tag_religion)
        print(f"Created course: {course}")
        
        # 6. Add Schedules
        CourseSchedule.objects.get_or_create(
            course=course,
            weekday=0, # Sunday
            defaults={'start_time': '16:00', 'end_time': '18:00'}
        )
        CourseSchedule.objects.get_or_create(
            course=course,
            weekday=2, # Tuesday
            defaults={'start_time': '16:00', 'end_time': '18:00'}
        )
        print("Added schedules to course.")
    else:
        print(f"Course already exists: {course}")

if __name__ == '__main__':
    create_sample_data()
