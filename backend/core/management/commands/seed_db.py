import random
import uuid
import datetime
from datetime import date, timedelta, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.conf import settings

from users.models import CustomUser, Instructor, StudentUser
from parents.models import Parent, Child
from courses.models import Season, Tag, Course, CourseSchedule, SeasonChoices, Weekday
from courses.models import Lecture, LectureStatus
from enrollments_payments.models import Enrollment, EnrollmentStatus
from enrollments_payments.models import EnrollmentRequest, EnrollmentRequestStatus
from attendance.models import LectureAttendance
from courses_online.models import OnlineCourse, VideoLecture, OnlineLectureMaterial, VideoWatchProgress, VideoPlatform, MaterialType

# ==========================================
# MOCK DATA FROM db.ts
# ==========================================

ARABIC_MALE_NAMES = [
    "محمد", "أحمد", "محمود", "علي", "عمر", "يوسف", "إبراهيم", "خالد", "حسن", "حسين",
    "مصطفى", "عبدالله", "عبدالرحمن", "ياسين", "حمزة", "زياد", "كريم", "طارق", "وائل", "سيف",
]
ARABIC_FEMALE_NAMES = [
    "فاطمة", "مريم", "عائشة", "سارة", "نور", "ليلى", "جنى", "حلا", "سلمى", "هدى",
    "رانيا", "نادية", "منى", "هبة", "ياسمين", "فريدة", "رقية", "خديجة", "أميرة", "نهى",
]
ARABIC_LAST_NAMES = [
    "المصري", "السعيد", "كمال", "إبراهيم", "عادل", "زكي", "فاروق", "جمال", "عثمان", "صلاح",
    "غانم", "سليم", "راضي", "فوزي", "هلال", "نجيب", "منصور", "عباس", "جاد", "النجار",
]
JOBS_AR = [
    "مهندس برمجيات", "طبيب", "معلم", "محاسب", "محامي", "صيدلي", "مهندس معماري",
    "مهندس مدني", "مصمم جرافيك", "رجل أعمال", "ممرض", "طاهي",
]

SEASONS_DATA = [
    {
        "name": "معسكر الصيف 2025",
        "type": SeasonChoices.SUMMER_CAMP,
        "description": "دورات صيفية مكثفة لجميع الأعمار.",
        "is_active": True,
        "start_date": date(2025, 6, 1),
        "end_date": date(2025, 8, 30),
    },
    {
        "name": "الفصل الدراسي الأول 2025",
        "type": SeasonChoices.SCHOOL,
        "description": "دروس تقوية للمناهج الدراسية.",
        "is_active": False,
        "start_date": date(2025, 9, 15),
        "end_date": date(2026, 1, 15),
    },
    {
        "name": "برنامج رمضان 1446",
        "type": SeasonChoices.RAMADAN,
        "description": "مسابقات ودورات دينية.",
        "is_active": False,
        "start_date": date(2025, 3, 1),
        "end_date": date(2025, 3, 30),
    },
]

TAGS_DATA = [
    {"name": "برمجة"},
    {"name": "رياضيات"},
    {"name": "فيزياء"},
    {"name": "قرآن كريم"},
    {"name": "فنون"},
    {"name": "روبوتيكس"},
    {"name": "لغات"},
    {"name": "تنمية مهارات"},
]

INSTRUCTORS_DATA = [
    {
        "first_name": "أحمد",
        "last_name": "علي",
        "gender": "male",
        "email": "ahmed.ali@example.com",
        "bio": "خبير برمجة.",
        "monthly_salary": 8000,
    },
    {
        "first_name": "سارة",
        "last_name": "محمد",
        "gender": "female",
        "email": "sara.mohamed@example.com",
        "bio": "دكتوراه فيزياء.",
        "monthly_salary": 9500,
    },
    {
        "first_name": "محمود",
        "last_name": "حسن",
        "gender": "male",
        "email": "mahmoud.h@example.com",
        "bio": "حافظ للقرآن.",
        "monthly_salary": 6000,
    },
    {
        "first_name": "ليلى",
        "last_name": "حسين",
        "gender": "female",
        "email": "laila.h@example.com",
        "bio": "فنانة تشكيلية.",
        "monthly_salary": 5000,
    },
]

# GLOBAL SIMULATION DATE
TODAY_DATE = date(2026, 2, 3)

class Command(BaseCommand):
    help = 'Seeds the database with test data matching the frontend mock-up'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write("Clearing existing data...")
            self.clear_data()

        self.stdout.write("Starting database seeding...")
        
        try:
            with transaction.atomic():
                self.seed_tags()
                self.seed_seasons()
                self.seed_instructors()
                self.seed_admins()
                self.seed_parents_and_children()
                self.seed_independent_students()
                self.seed_courses_and_lectures()
                self.seed_online_courses()
                self.seed_enrollments_and_attendance()
                self.seed_online_enrollments_and_progress()
                self.seed_enrollment_requests()
                
            self.stdout.write(self.style.SUCCESS("Successfully seeded the database!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Seeding failed: {e}"))
            import traceback
            traceback.print_exc()
            raise e

    def clear_data(self):
        # Delete in order to respect foreign keys
        LectureAttendance.objects.all().delete()
        VideoWatchProgress.objects.all().delete()
        Enrollment.objects.all().delete()
        EnrollmentRequest.objects.all().delete()
        Lecture.objects.all().delete()
        CourseSchedule.objects.all().delete()
        Course.objects.all().delete()
        OnlineLectureMaterial.objects.all().delete()
        VideoLecture.objects.all().delete()
        OnlineCourse.objects.all().delete()
        Tag.objects.all().delete()
        Season.objects.all().delete()
        Child.objects.all().delete()
        Parent.objects.all().delete()
        StudentUser.objects.all().delete()
        Instructor.objects.all().delete()
        # Keep superusers if you want, or wipe all except the current one if running locally
        CustomUser.objects.exclude(is_superuser=True).delete()

    def get_random_phone(self):
        # Ensure global format and uniqueness
        prefix = random.choice(["+2010", "+2011", "+2012", "+2015"])
        phone = f"{prefix}{random.randint(10000000, 99999999)}"
        while CustomUser.objects.filter(phone_number1=phone).exists():
             phone = f"{prefix}{random.randint(10000000, 99999999)}"
        return phone

    def seed_tags(self):
        self.stdout.write("Seeding tags...")
        for tag_data in TAGS_DATA:
            Tag.objects.get_or_create(name=tag_data["name"])

    def seed_seasons(self):
        self.stdout.write("Seeding seasons...")
        for season_data in SEASONS_DATA:
            Season.objects.get_or_create(
                name=season_data["name"],
                defaults={
                    "season_type": season_data["type"],
                    "description": season_data["description"],
                    "is_active": season_data["is_active"],
                    "start_date": season_data["start_date"],
                    "end_date": season_data["end_date"],
                }
            )

    def seed_instructors(self):
        self.stdout.write("Seeding instructors...")
        # Core instructors from db.ts
        for i, data in enumerate(INSTRUCTORS_DATA):
            phone = f"+2012{random.randint(10000000, 99999999)}"
            user, created = CustomUser.objects.get_or_create(
                email=data["email"],
                defaults={
                    "phone_number1": phone,
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "gender": data["gender"],
                    "role": "instructor",
                    "dob": date(1980 + i, 1, 1),
                    "is_verified": True,
                }
            )
            if created:
                user.set_password("password123")
                user.save()
            
            Instructor.objects.get_or_create(
                user=user,
                defaults={
                    "bio": data["bio"],
                    "monthly_salary": Decimal(data["monthly_salary"]),
                }
            )
        
        # Additional random instructors for stress test
        for i in range(5):
            is_male = random.random() < 0.5
            fname = random.choice(ARABIC_MALE_NAMES if is_male else ARABIC_FEMALE_NAMES)
            lname = random.choice(ARABIC_LAST_NAMES)
            user = CustomUser.objects.create(
                phone_number1=self.get_random_phone(),
                first_name=fname,
                last_name=lname,
                gender="male" if is_male else "female",
                role="instructor",
                dob=date(1975 + random.randint(0, 20), 1, 1),
                is_verified=True,
            )
            user.set_password("password123")
            user.save()
            Instructor.objects.create(
                user=user,
                bio=f"مدرب متخصص في {random.choice(TAGS_DATA)['name']}",
                monthly_salary=Decimal(random.randint(4000, 12000))
            )

    def seed_admins(self):
        self.stdout.write("Seeding admins...")
        phone = "+201000000000"
        user, created = CustomUser.objects.get_or_create(
            phone_number1=phone,
            defaults={
                "first_name": "مدير",
                "last_name": "النظام",
                "gender": "male",
                "role": "admin",
                "dob": date(1990, 1, 1),
                "is_verified": True,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created:
            user.set_password("admin123")
            user.save()

    def seed_parents_and_children(self):
        self.stdout.write("Seeding parents and children...")
        for i in range(1, 101): # Increased to 100 for stress testing
            is_male = random.random() < 0.6
            fname = random.choice(ARABIC_MALE_NAMES if is_male else ARABIC_FEMALE_NAMES)
            lname = random.choice(ARABIC_LAST_NAMES)
            
            user = CustomUser.objects.create(
                phone_number1=self.get_random_phone(),
                first_name=fname,
                last_name=lname,
                gender="male" if is_male else "female",
                role="parent",
                dob=date(1980 + random.randint(0, 15), 1, 1),
                is_verified=True,
            )
            user.set_password("password123")
            user.save()
            
            # Use get_or_create to avoid IntegrityError if a user somehow already has a profile
            parent, _ = Parent.objects.get_or_create(user=user)
            
            # Create 1-3 children
            for j in range(random.randint(1, 3)):
                is_boy = random.random() < 0.5
                cfname = random.choice(ARABIC_MALE_NAMES if is_boy else ARABIC_FEMALE_NAMES)
                
                Child.objects.create(
                    primary_parent=parent,
                    first_name=cfname,
                    last_name=user.first_name,
                    gender="boy" if is_boy else "girl",
                    dob=date(2015 + random.randint(0, 5), 1, 1),
                )

    def seed_independent_students(self):
        self.stdout.write("Seeding independent students...")
        for i in range(1, 151): # Increased to 150
            is_male = random.random() < 0.5
            fname = random.choice(ARABIC_MALE_NAMES if is_male else ARABIC_FEMALE_NAMES)
            lname = random.choice(ARABIC_LAST_NAMES)
            
            user = CustomUser.objects.create(
                phone_number1=self.get_random_phone(),
                first_name=fname,
                last_name=lname,
                gender="male" if is_male else "female",
                role="student",
                dob=date(2005 + random.randint(0, 10), 1, 1),
                is_verified=True,
            )
            user.set_password("password123")
            user.save()
            
            StudentUser.objects.get_or_create(user=user)

    def seed_courses_and_lectures(self):
        self.stdout.write("Seeding courses and lectures...")
        instructors = list(Instructor.objects.all())
        seasons = list(Season.objects.all())
        tags = list(Tag.objects.all())
        
        COURSES_MOCK = [
            {"name": "أساسيات البرمجة بلغة بايثون", "slug": "python-basics", "price": 1500, "capacity": 60, "tag_idx": 0, "season_idx": 0, "schedule": [(Weekday.MONDAY, "10:00", "12:00"), (Weekday.TUESDAY, "10:00", "12:00")], "adults": True},
            {"name": "الرياضيات المتقدمة", "slug": "advanced-math", "price": 2500, "capacity": 30, "tag_idx": 1, "season_idx": 1, "schedule": [(Weekday.SUNDAY, "16:00", "18:00"), (Weekday.TUESDAY, "16:00", "18:00")], "adults": True},
            {"name": "مطور الويب الصغير", "slug": "web-dev-junior", "price": 2200, "capacity": 60, "tag_idx": 0, "season_idx": 0, "schedule": [(Weekday.TUESDAY, "14:00", "16:00"), (Weekday.THURSDAY, "14:00", "16:00")], "adults": False, "min_age": 8, "max_age": 12},
            {"name": "الفيزياء المسلية", "slug": "fun-physics", "price": 2000, "capacity": 40, "tag_idx": 2, "season_idx": 0, "schedule": [(Weekday.TUESDAY, "14:00", "16:00"), (Weekday.THURSDAY, "14:00", "16:00")], "adults": False, "min_age": 10, "max_age": 15},
            {"name": "تحفيظ جزء عم", "slug": "juz-amma", "price": 500, "capacity": 50, "tag_idx": 3, "season_idx": 0, "schedule": [(Weekday.SATURDAY, "09:00", "11:00")], "adults": False, "min_age": 5, "max_age": 15},
            {"name": "الفنان الصغير", "slug": "little-artist", "price": 1200, "capacity": 45, "tag_idx": 4, "season_idx": 0, "schedule": [(Weekday.FRIDAY, "14:00", "16:00")], "adults": False, "min_age": 6, "max_age": 12},
            {"name": "روبوتيكس (Lego)", "slug": "lego-robotics", "price": 3000, "capacity": 25, "tag_idx": 5, "season_idx": 0, "schedule": [(Weekday.SATURDAY, "12:00", "15:00")], "adults": False, "min_age": 9, "max_age": 14},
            {"name": "محادثة إنجليزية", "slug": "english-conversation", "price": 1800, "capacity": 40, "tag_idx": 6, "season_idx": 1, "schedule": [(Weekday.SUNDAY, "18:00", "20:00"), (Weekday.WEDNESDAY, "18:00", "20:00")], "adults": True},
            {"name": "فن الخط العربي", "slug": "arabic-calligraphy", "price": 1000, "capacity": 30, "tag_idx": 4, "season_idx": 2, "schedule": [(Weekday.FRIDAY, "20:00", "22:00")], "adults": True},
        ]
        
        for mock in COURSES_MOCK:
            season = seasons[mock["season_idx"]] if mock["season_idx"] < len(seasons) else seasons[0]
            # Use get_or_create for course to avoid duplicate slugs on re-run
            course, _ = Course.objects.get_or_create(
                slug=mock["slug"],
                defaults={
                    "name": mock["name"],
                    "price": Decimal(mock["price"]),
                    "capacity": mock["capacity"],
                    "instructor": random.choice(instructors),
                    "season": season,
                    "start_date": season.start_date,
                    "end_date": season.end_date or (season.start_date + timedelta(days=90)),
                    "num_lectures": random.randint(8, 24),
                    "for_adults": mock.get("adults", True),
                    "min_age": mock.get("min_age"),
                    "max_age": mock.get("max_age"),
                }
            )
            course.tags.add(tags[mock["tag_idx"]])
            
            for day, start, end in mock["schedule"]:
                CourseSchedule.objects.get_or_create(
                    course=course,
                    weekday=day,
                    defaults={
                        "start_time": time.fromisoformat(start),
                        "end_time": time.fromisoformat(end),
                    }
                )
            
            # Generate lectures only if they don't exist
            if course.lectures.count() == 0:
                course.generate_lectures()

    def seed_enrollments_and_attendance(self):
        self.stdout.write("Seeding enrollments and attendance...")
        courses = list(Course.objects.all())
        students = list(StudentUser.objects.all())
        children = list(Child.objects.all())
        participants = students + children
        
        admin_user = CustomUser.objects.filter(role="admin").first()

        for course in courses:
            # Randomly enroll 30-90% capacity
            count = random.randint(int(course.capacity * 0.3), int(course.capacity * 0.9))
            chosen = random.sample(participants, min(count, len(participants)))
            
            for p in chosen:
                is_student = isinstance(p, StudentUser)
                
                # Check for existing enrollment to avoid unique constraint error
                existing = Enrollment.objects.filter(
                    course=course,
                    student=p if is_student else None,
                    child=None if is_student else p
                ).exists()
                
                if not existing:
                    Enrollment.objects.create(
                        course=course,
                        student=p if is_student else None,
                        child=None if is_student else p,
                        status=EnrollmentStatus.ACTIVE if random.random() < 0.9 else EnrollmentStatus.DROPPED,
                        created_by=admin_user
                    )
            
            # Mark attendance for past lectures
            past_lectures = course.lectures.filter(day__lt=TODAY_DATE)
            active_enrollments = course.enrollments.filter(status=EnrollmentStatus.ACTIVE)
            
            for lecture in past_lectures:
                if lecture.lecture_attendances.count() > 0:
                    continue
                    
                for enr in active_enrollments:
                    LectureAttendance.objects.create(
                        lecture=lecture,
                        student=enr.student,
                        child=enr.child,
                        present=random.random() < 0.85,
                        rating=random.randint(7, 10),
                        marked_by=admin_user,
                        marked_at=timezone.make_aware(datetime.datetime.combine(lecture.day, lecture.start_time or time(12, 0)), timezone.get_current_timezone()),
                        marked_via='manual'
                    )
                lecture.attendance_taken = True
                lecture.status = LectureStatus.COMPLETED
                lecture.save()

    def seed_enrollment_requests(self):
        self.stdout.write("Seeding enrollment requests...")
        courses = list(Course.objects.all())
        online_courses = list(OnlineCourse.objects.all())
        students = list(StudentUser.objects.all())
        children = list(Child.objects.all())
        
        for i in range(75): # Stress testing
            is_online = random.random() < 0.3
            course = random.choice(online_courses) if (is_online and online_courses) else random.choice(courses)
            status = random.choice(EnrollmentRequestStatus.choices)[0]
            
            q_kwargs = {}
            if is_online:
                q_kwargs['online_course'] = course
            else:
                q_kwargs['course'] = course

            if random.random() < 0.5:
                # Student request
                student = random.choice(students)
                q_kwargs['student'] = student
                if not EnrollmentRequest.objects.filter(**q_kwargs).exists():
                    EnrollmentRequest.objects.create(
                        status=status,
                        price=course.price,
                        **q_kwargs
                    )
            else:
                # Parent/Child request
                child = random.choice(children)
                q_kwargs['child'] = child
                q_kwargs['parent'] = child.primary_parent
                if not EnrollmentRequest.objects.filter(**q_kwargs).exists():
                    EnrollmentRequest.objects.create(
                        status=status,
                        price=course.price,
                        **q_kwargs
                    )

    def seed_online_courses(self):
        self.stdout.write("Seeding online courses...")
        instructors = list(Instructor.objects.all())
        tags = list(Tag.objects.all())
        
        ONLINE_COURSES_MOCK = [
            {
                "name": "تعلم الآلة والذكاء الاصطناعي للشباب",
                "slug": "ml-ai-youth",
                "price": 1800,
                "tag_idx": 0, # programming
                "lectures": [
                    {"title": "مقدمة في الذكاء الاصطناعي", "duration": 1800, "platform": VideoPlatform.YOUTUBE, "url": "https://www.youtube.com/watch?v=mock1"},
                    {"title": "ما هو تعلم الآلة؟", "duration": 2400, "platform": VideoPlatform.BUNNY, "url": "https://bunny.net/mock2"},
                    {"title": "بناء النموذج الأول الخاص بك", "duration": 3600, "platform": VideoPlatform.VIMEO, "url": "https://vimeo.com/mock3"},
                ]
            },
            {
                "name": "تجويد القرآن الكريم برواية حفص",
                "slug": "tajweed-hafs",
                "price": 600,
                "tag_idx": 3, # quran
                "lectures": [
                    {"title": "أحكام النون الساكنة والتنوين", "duration": 1500, "platform": VideoPlatform.YOUTUBE, "url": "https://www.youtube.com/watch?v=mock4"},
                    {"title": "أحكام الميم الساكنة", "duration": 1200, "platform": VideoPlatform.YOUTUBE, "url": "https://www.youtube.com/watch?v=mock5"},
                    {"title": "مخارج الحروف والصفات", "duration": 2000, "platform": VideoPlatform.YOUTUBE, "url": "https://www.youtube.com/watch?v=mock6"},
                ]
            },
            {
                "name": "تطوير تطبيقات الموبايل باستخدام فلاتر",
                "slug": "flutter-apps",
                "price": 2400,
                "tag_idx": 0, # programming
                "lectures": [
                    {"title": "تهيئة بيئة العمل وفهم Flutter", "duration": 2700, "platform": VideoPlatform.BUNNY, "url": "https://bunny.net/mock7"},
                    {"title": "بناء الواجهات والـ Widgets الأساسية", "duration": 3200, "platform": VideoPlatform.BUNNY, "url": "https://bunny.net/mock8"},
                    {"title": "التعامل مع الحالة State Management", "duration": 3600, "platform": VideoPlatform.BUNNY, "url": "https://bunny.net/mock9"},
                    {"title": "ربط التطبيق بقاعدة البيانات", "duration": 4000, "platform": VideoPlatform.BUNNY, "url": "https://bunny.net/mock10"},
                ]
            }
        ]

        for mock in ONLINE_COURSES_MOCK:
            course, _ = OnlineCourse.objects.get_or_create(
                slug=mock["slug"],
                defaults={
                    "name": mock["name"],
                    "price": Decimal(mock["price"]),
                    "instructor": random.choice(instructors) if instructors else None,
                    "is_published": True,
                    "is_active": True,
                }
            )
            if tags and mock["tag_idx"] < len(tags):
                course.tags.add(tags[mock["tag_idx"]])

            for idx, lec_data in enumerate(mock["lectures"]):
                lecture, _ = VideoLecture.objects.get_or_create(
                    course=course,
                    order=idx + 1,
                    defaults={
                        "title": lec_data["title"],
                        "duration_seconds": lec_data["duration"],
                        "video_platform": lec_data["platform"],
                        "video_url": lec_data["url"],
                    }
                )
                
                # Add mock materials for first video lecture
                if idx == 0:
                    OnlineLectureMaterial.objects.get_or_create(
                        lecture=lecture,
                        title="ملخص المحاضرة PDF",
                        defaults={
                            "external_url": "https://drive.google.com/file/d/mockpdf/view",
                            "file_type": MaterialType.PDF,
                            "order": 1,
                        }
                    )

    def seed_online_enrollments_and_progress(self):
        self.stdout.write("Seeding online enrollments and progress...")
        online_courses = list(OnlineCourse.objects.all())
        students = list(StudentUser.objects.all())
        children = list(Child.objects.all())
        participants = students + children
        admin_user = CustomUser.objects.filter(role="admin").first()

        for course in online_courses:
            # Enroll 15-40 students/children randomly
            count = random.randint(15, min(40, len(participants)))
            chosen = random.sample(participants, count)
            
            for p in chosen:
                is_student = isinstance(p, StudentUser)
                existing = Enrollment.objects.filter(
                    online_course=course,
                    student=p if is_student else None,
                    child=None if is_student else p
                ).exists()
                
                if not existing:
                    enrollment = Enrollment.objects.create(
                        online_course=course,
                        student=p if is_student else None,
                        child=None if is_student else p,
                        status=EnrollmentStatus.ACTIVE if random.random() < 0.95 else EnrollmentStatus.DROPPED,
                        created_by=admin_user
                    )
                    
                    # If enrollment is active, seed some progress for the lectures
                    if enrollment.status == EnrollmentStatus.ACTIVE:
                        for lecture in course.video_lectures.all():
                            # Random chance student has watched this video
                            if random.random() < 0.7:
                                watched_pct = random.uniform(0.1, 1.0)
                                is_completed = watched_pct >= 0.9
                                total_sec = lecture.duration_seconds
                                watched_sec = int(total_sec * watched_pct)
                                
                                VideoWatchProgress.objects.create(
                                    lecture=lecture,
                                    student=p if is_student else None,
                                    child=None if is_student else p,
                                    watched_seconds=watched_sec,
                                    total_seconds=total_sec,
                                    completion_percentage=watched_pct * 100,
                                    is_completed=is_completed,
                                    last_position_seconds=watched_sec if not is_completed else 0,
                                    watch_count=1 if is_completed else 0,
                                )
