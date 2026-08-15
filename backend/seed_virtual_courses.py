import os
import django
from django.utils import timezone
from datetime import timedelta
import random
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from users.models import Instructor, CustomUser
from courses.models import Course, Tag, Season, CourseSchedule
from courses_online.models import OnlineCourse

def seed_virtual_courses():
    print("Starting to seed virtual courses...")
    
    # Ensure there's a season
    season, _ = Season.objects.get_or_create(
        name='موسم تجريبي 2026',
        defaults={
            'season_type': 'standard',
            'start_date': timezone.now().date(),
            'end_date': (timezone.now() + timedelta(days=60)).date(),
            'is_active': True
        }
    )

    # Ensure there's an instructor
    instructor_user, created = CustomUser.objects.get_or_create(
        phone_number1='+201000000999',
        defaults={
            'first_name': 'معلم',
            'last_name': 'تجريبي',
            'role': 'instructor',
            'is_verified': True,
            'dob': '1990-01-01',
            'gender': 'male',
        }
    )
    if created:
        instructor_user.set_password('12345678')
        instructor_user.save()

    instructor, _ = Instructor.objects.get_or_create(
        user=instructor_user,
        defaults={
            'bio': 'معلم افتراضي للدورات التجريبية.',
            'type': 'normal',
            'monthly_salary': 5000.0
        }
    )

    # Tags
    tag_programming, _ = Tag.objects.get_or_create(name='برمجة')
    tag_language, _ = Tag.objects.get_or_create(name='لغات')
    tag_art, _ = Tag.objects.get_or_create(name='فنون')

    # 1. Create 3 Physical (Offline) Courses
    offline_courses_data = [
        {
            'name': 'دورة تصميم المواقع الحضورية',
            'slug': f'web-design-offline-{uuid.uuid4().hex[:8]}',
            'description': 'تعلم تصميم المواقع بشكل حضوري تفاعلي.',
            'price': 1200,
            'tag': tag_programming
        },
        {
            'name': 'المحادثة باللغة الإنجليزية',
            'slug': f'english-speaking-{uuid.uuid4().hex[:8]}',
            'description': 'دورة تفاعلية لتحسين مهارات التحدث باللغة الإنجليزية.',
            'price': 800,
            'tag': tag_language
        },
        {
            'name': 'أساسيات الرسم والتلوين',
            'slug': f'drawing-basics-{uuid.uuid4().hex[:8]}',
            'description': 'ورشة عمل فنية لتعلم أساسيات الرسم.',
            'price': 500,
            'tag': tag_art
        }
    ]

    for data in offline_courses_data:
        course, created = Course.objects.get_or_create(
            name=data['name'],
            defaults={
                'slug': data['slug'],
                'description': data['description'],
                'start_date': timezone.now().date() + timedelta(days=random.randint(1, 10)),
                'end_date': (timezone.now() + timedelta(days=30)).date(),
                'num_lectures': 12,
                'capacity': 20,
                'price': data['price'],
                'is_active': True,
                'season': season,
                'instructor': instructor,
            }
        )
        if created:
            course.tags.add(data['tag'])
            print(f"Created Offline Course: {course.name}")

    # 2. Create 3 Online Courses
    online_courses_data = [
        {
            'name': 'البرمجة بلغة بايثون (عن بعد)',
            'slug': f'python-online-{uuid.uuid4().hex[:8]}',
            'description': 'دورة مسجلة لتعلم بايثون من الصفر إلى الاحتراف.',
            'price': 400,
            'tag': tag_programming
        },
        {
            'name': 'إتقان القواعد الإنجليزية',
            'slug': f'english-grammar-online-{uuid.uuid4().hex[:8]}',
            'description': 'دورة إلكترونية شاملة لقواعد اللغة الإنجليزية.',
            'price': 300,
            'tag': tag_language
        },
        {
            'name': 'الفن الرقمي',
            'slug': f'digital-art-online-{uuid.uuid4().hex[:8]}',
            'description': 'تعلم الرسم الرقمي باستخدام برامج التصميم.',
            'price': 600,
            'tag': tag_art
        }
    ]

    for data in online_courses_data:
        course, created = OnlineCourse.objects.get_or_create(
            name=data['name'],
            defaults={
                'slug': data['slug'],
                'description': data['description'],
                'price': data['price'],
                'is_active': True,
                'is_published': True,
                'instructor': instructor,
            }
        )
        if created:
            course.tags.add(data['tag'])
            print(f"Created Online Course: {course.name}")

    print("Finished seeding courses.")

if __name__ == '__main__':
    seed_virtual_courses()
