import os
import django
import random
from datetime import date, datetime, time, timedelta
from django.utils import timezone
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')
django.setup()

from users.models import CustomUser, Instructor
from courses.models import Tag, Season, Course, Lecture
from attendance.models import InstructorAttendance, AttendanceStatus, AttendanceType, SupervisorSchedule

def seed_fake_instructors():
    print("Performing TOTAL cleanup of broken data...")
    # Delete anything containing '?' in major fields
    CustomUser.objects.filter(Q(first_name__contains='?') | Q(last_name__contains='?') | Q(email__contains='?')).delete()
    Instructor.objects.filter(Q(bio__contains='?') | Q(user__isnull=True)).delete()
    Tag.objects.filter(name__contains='?').delete()
    Course.objects.filter(name__contains='?').delete()
    Lecture.objects.filter(title__contains='?').delete()
    SupervisorSchedule.objects.all().delete() # Clean schedules too

    first_names = ["محمد", "أحمد", "ياسين", "عبد الله", "يوسف", "عمر", "حمزة", "زياد", "إبراهيم", "خالد"]
    last_names = ["محمود", "السيد", "علي", "منصور", "إسماعيل", "حسن", "النجار", "خليل", "حماد", "رزق"]
    courses_pool = ["دورة التجويد", "أساسيات النحو", "تحفيظ جزء عم", "تفسير سورة البقرة", "القاعدة النورانية"]
    
    # Create valid tags
    tags_pool = ["اللغة العربية", "القرآن الكريم", "التربية الإسلامية", "تحفيظ", "تجويد", "نحو", "تفسير"]
    for tag_name in tags_pool:
        Tag.objects.get_or_create(name=tag_name)
    all_tags = list(Tag.objects.all())
    
    season, _ = Season.objects.get_or_create(
        name="موسم صيف 2026",
        defaults={'season_type': 'summer_camp', 'start_date': date(2026, 5, 1), 'end_date': date(2026, 8, 30), 'is_active': True}
    )
    
    created_courses = []
    for c_name in courses_pool:
        course, _ = Course.objects.get_or_create(
            name=c_name, 
            defaults={'description': f"وصف {c_name}", 'is_active': True, 'start_date': date(2026, 5, 1), 'capacity': 30, 'price': 500, 'season': season}
        )
        created_courses.append(course)

    admin_user = CustomUser.objects.filter(role='admin', is_staff=True).first()

    print(f"Seeding 10 instructors with FULL realistic data...")
    
    for i in range(10):
        phone = f"+2010{random.randint(10000000, 99999999)}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        
        user, created = CustomUser.objects.get_or_create(
            phone_number1=phone,
            defaults={
                'first_name': fname, 'last_name': lname, 'role': 'instructor', 'gender': 'male',
                'dob': date(1980 + random.randint(0, 20), random.randint(1, 12), random.randint(1, 28)), 'is_verified': True
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            
            instructor = Instructor.objects.create(
                user=user,
                bio=f"مدرس متخصص في {random.choice(tags_pool)}، لديه خبرة تزيد عن 10 سنوات في التربية والتعليم.",
                type='normal' if i > 3 else 'supervisor',
                monthly_salary=random.randint(4000, 9000)
            )
            instructor.tags.add(*random.sample(all_tags, k=random.randint(2, 3)))
            
            today = date.today()
            for d in range(30):
                att_date = today - timedelta(days=d)
                if att_date.weekday() == 4: continue 
                
                is_present = random.random() < 0.9
                
                # Create a lecture for EVERY record to fill the columns
                course = random.choice(created_courses)
                lecture = Lecture.objects.create(
                    course=course,
                    lecture_number=random.randint(1, 1000000),
                    title=f"محاضرة {random.choice(tags_pool)}",
                    day=att_date,
                    start_time=time(9, 0),
                    end_time=time(11, 0),
                    instructor=instructor
                )
                
                check_in = None
                check_out = None
                rating = None
                if is_present:
                    check_in = timezone.make_aware(datetime.combine(att_date, time(9, random.randint(0, 15))))
                    check_out = timezone.make_aware(datetime.combine(att_date, time(11, random.randint(0, 15))))
                    rating = random.uniform(8.0, 10.0)
                
                InstructorAttendance.objects.create(
                    instructor=instructor,
                    date=att_date,
                    attendance_type=AttendanceType.LECTURE,
                    status=AttendanceStatus.PRESENT if is_present else AttendanceStatus.ABSENT,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    rating=rating if rating else 0.0,
                    rated_by=admin_user if rating else None,
                    rated_at=timezone.now() if rating else None,
                    season=season,
                    lecture=lecture
                )
            
            print(f"Done: {user.get_full_name()}")

    print("Success! Database is now clean and full of realistic data.")

if __name__ == "__main__":
    seed_fake_instructors()
