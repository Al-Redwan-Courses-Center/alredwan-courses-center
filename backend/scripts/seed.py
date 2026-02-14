#!/usr/bin/env python3
"""
Seed script for the frontend team to test the API.

Run inside Docker:
    docker compose exec django-web-app python scripts/seed.py

To reset and re-seed:
    docker compose exec django-web-app python scripts/seed.py --reset
"""
import os
import sys

# Ensure the project root is on sys.path (needed when running inside Docker)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Redwan_courses_center.settings')

import django
django.setup()

# ── Imports (after django.setup) ──────────────────────────────────────
from datetime import date, time, timedelta
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone

from users.models.user import CustomUser
from users.models.student import StudentUser
from users.models.instructor import Instructor
from parents.models.parent import Parent, Child
from courses.models.course import Season, SeasonChoices, Tag, Course, CourseSchedule, Weekday
from courses.models.lecture import Lecture, LectureStatus
from enrollments_payments.models.enrollment import Enrollment, EnrollmentStatus
from enrollments_payments.models.enrollment_request import (
    EnrollmentRequest, EnrollmentRequestStatus, PaymentMethod as ERPaymentMethod,
)
from enrollments_payments.models.payment import Payment, PaymentStatus, PaymentMethod
from attendance.models.lecture_attendance import LectureAttendance

# ── Helpers ───────────────────────────────────────────────────────────
RESET = '--reset' in sys.argv
PASSWORD = 'Test@1234'  # shared password for all seeded users
EGYPT = '+20'

print("=" * 60)
print("  🌱  SEEDING DATABASE FOR FRONTEND TESTING")
print("=" * 60)


def phone(number: str) -> str:
    """Build an E.164 Egyptian phone number."""
    return f"{EGYPT}{number}"


def delete_all():
    """Wipe all seeded data (order matters for FK constraints)."""
    print("\n🗑️  Resetting seeded data …")
    LectureAttendance.objects.all().delete()
    Payment.objects.all().delete()
    EnrollmentRequest.objects.all().delete()
    Enrollment.objects.all().delete()
    Lecture.objects.all().delete()
    CourseSchedule.objects.all().delete()
    Course.objects.all().delete()
    Season.objects.all().delete()
    Tag.objects.all().delete()
    Child.objects.all().delete()
    Parent.objects.all().delete()
    StudentUser.objects.all().delete()
    Instructor.objects.all().delete()
    # Delete non-superuser users
    CustomUser.objects.filter(is_superuser=False).delete()
    print("   ✅ Done.\n")


# ── Main ──────────────────────────────────────────────────────────────
@transaction.atomic
def seed():
    if RESET:
        delete_all()

    # ----------------------------------------------------------------
    # 1. TAGS
    # ----------------------------------------------------------------
    print("\n📌  Creating tags …")
    tag_names = ['قرآن', 'تجويد', 'فقه', 'سيرة', 'حديث', 'لغة عربية', 'أخلاق', 'تفسير']
    tags = {}
    for name in tag_names:
        tag, _ = Tag.objects.get_or_create(name=name)
        tags[name] = tag
    print(f"   ✅ {len(tags)} tags")

    # ----------------------------------------------------------------
    # 2. SEASONS
    # ----------------------------------------------------------------
    print("\n📅  Creating seasons …")
    today = timezone.localdate()

    season_data = [
        {
            'name': 'موسم رمضان 2026',
            'season_type': SeasonChoices.RAMADAN,
            'start_date': date(2026, 2, 18),
            'end_date': date(2026, 3, 19),
            'is_active': False,
        },
        {
            'name': 'موسم منتصف السنة 2026',
            'season_type': SeasonChoices.MID_YEAR,
            'start_date': date(2026, 1, 15),
            'end_date': date(2026, 2, 15),
            'is_active': True,
        },
        {
            'name': 'المعسكر الصيفي 2026',
            'season_type': SeasonChoices.SUMMER_CAMP,
            'start_date': date(2026, 6, 1),
            'end_date': date(2026, 8, 31),
            'is_active': False,
        },
        {
            'name': 'موسم المدرسة 2025-2026',
            'season_type': SeasonChoices.SCHOOL,
            'start_date': date(2025, 9, 15),
            'end_date': date(2026, 6, 15),
            'is_active': True,
        },
    ]

    seasons = {}
    for s in season_data:
        season, _ = Season.objects.get_or_create(
            name=s['name'],
            defaults=s,
        )
        seasons[s['name']] = season
    print(f"   ✅ {len(seasons)} seasons")

    # ----------------------------------------------------------------
    # 3. ADMIN USER
    # ----------------------------------------------------------------
    print("\n👤  Creating admin user …")
    admin_user, created = CustomUser.objects.get_or_create(
        phone_number1=phone('1000000000'),
        defaults={
            'first_name': 'أحمد', 'last_name': 'المدير',
            'dob': date(1985, 3, 15),
            'gender': 'male',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
            'is_verified': True,
        },
    )
    if created:
        admin_user.set_password(PASSWORD)
        admin_user.save()
    print(f"   ✅ Admin: {admin_user.phone_number1}")

    # ----------------------------------------------------------------
    # 4. INSTRUCTORS (3)
    # ----------------------------------------------------------------
    print("\n🧑‍🏫  Creating instructors …")
    instructor_data = [
        {
            'phone': phone('1010000001'), 'first': 'محمد', 'last': 'علي حسين',
            'dob': date(1990, 5, 10), 'gender': 'male', 'bio': 'معلم قرآن كريم خبرة ١٠ سنوات',
            'salary': Decimal('5000.00'), 'type': 'normal',
            'tags': ['قرآن', 'تجويد'],
        },
        {
            'phone': phone('1010000002'), 'first': 'خالد', 'last': 'عبد الرحمن',
            'dob': date(1988, 8, 22), 'gender': 'male', 'bio': 'مشرف ومعلم فقه وسيرة',
            'salary': Decimal('6000.00'), 'type': 'supervisor',
            'tags': ['فقه', 'سيرة'],
        },
        {
            'phone': phone('1010000003'), 'first': 'فاطمة', 'last': 'أحمد محمود',
            'dob': date(1992, 12, 1), 'gender': 'female', 'bio': 'معلمة لغة عربية وتفسير',
            'salary': Decimal('4500.00'), 'type': 'normal',
            'tags': ['لغة عربية', 'تفسير'],
        },
    ]

    instructors = []
    for d in instructor_data:
        user, user_created = CustomUser.objects.get_or_create(
            phone_number1=d['phone'],
            defaults={
                'first_name': d['first'], 'last_name': d['last'],
                'dob': d['dob'], 'gender': d['gender'],
                'role': 'instructor', 'is_verified': True,
            },
        )
        if user_created:
            user.set_password(PASSWORD)
            user.save()

        instructor, _ = Instructor.objects.get_or_create(
            user=user,
            defaults={
                'bio': d['bio'],
                'monthly_salary': d['salary'],
                'type': d['type'],
            },
        )
        instructor.tags.set([tags[t] for t in d['tags']])
        instructors.append(instructor)

    print(f"   ✅ {len(instructors)} instructors")

    # ----------------------------------------------------------------
    # 5. STUDENT USERS (5 adult students)
    # ----------------------------------------------------------------
    print("\n🎓  Creating student users …")
    student_data = [
        {'phone': phone('1020000001'), 'first': 'يوسف', 'last': 'عمر أحمد',
         'dob': date(2000, 3, 15), 'gender': 'male'},
        {'phone': phone('1020000002'), 'first': 'عبد الله', 'last': 'محمد سعيد',
         'dob': date(1999, 7, 20), 'gender': 'male'},
        {'phone': phone('1020000003'), 'first': 'مريم', 'last': 'حسن إبراهيم',
         'dob': date(2001, 11, 5), 'gender': 'female'},
        {'phone': phone('1020000004'), 'first': 'عمر', 'last': 'خالد عبد العزيز',
         'dob': date(1998, 1, 30), 'gender': 'male'},
        {'phone': phone('1020000005'), 'first': 'نور', 'last': 'سامي محمود',
         'dob': date(2002, 9, 12), 'gender': 'female'},
    ]

    students = []
    for d in student_data:
        user, user_created = CustomUser.objects.get_or_create(
            phone_number1=d['phone'],
            defaults={
                'first_name': d['first'], 'last_name': d['last'],
                'dob': d['dob'], 'gender': d['gender'],
                'role': 'student', 'is_verified': True,
            },
        )
        if user_created:
            user.set_password(PASSWORD)
            user.save()

        student, _ = StudentUser.objects.get_or_create(user=user)
        students.append(student)

    print(f"   ✅ {len(students)} students")

    # ----------------------------------------------------------------
    # 6. PARENTS & CHILDREN (2 parents, 4 children)
    # ----------------------------------------------------------------
    print("\n👨‍👩‍👧‍👦  Creating parents and children …")
    parent_data = [
        {
            'phone': phone('1030000001'), 'first': 'أحمد', 'last': 'عبد الله محمد',
            'dob': date(1980, 4, 10), 'gender': 'male',
            'children': [
                {'first': 'عمر', 'last': 'أحمد عبد الله', 'dob': date(2015, 6, 20), 'gender': 'boy'},
                {'first': 'آية', 'last': 'أحمد عبد الله', 'dob': date(2017, 2, 14), 'gender': 'girl'},
            ],
        },
        {
            'phone': phone('1030000002'), 'first': 'سارة', 'last': 'محمد إبراهيم',
            'dob': date(1983, 9, 25), 'gender': 'female',
            'children': [
                {'first': 'حمزة', 'last': 'خالد محمد', 'dob': date(2014, 3, 8), 'gender': 'boy'},
                {'first': 'ليلى', 'last': 'خالد محمد', 'dob': date(2016, 11, 30), 'gender': 'girl'},
            ],
        },
    ]

    parents = []
    children = []
    for d in parent_data:
        user, user_created = CustomUser.objects.get_or_create(
            phone_number1=d['phone'],
            defaults={
                'first_name': d['first'], 'last_name': d['last'],
                'dob': d['dob'], 'gender': d['gender'],
                'role': 'parent', 'is_verified': True,
            },
        )
        if user_created:
            user.set_password(PASSWORD)
            user.save()

        parent, _ = Parent.objects.get_or_create(user=user)
        parents.append(parent)

        for c in d['children']:
            child, _ = Child.objects.get_or_create(
                primary_parent=parent,
                first_name=c['first'],
                last_name=c['last'],
                defaults={
                    'dob': c['dob'],
                    'gender': c['gender'],
                },
            )
            children.append(child)

    print(f"   ✅ {len(parents)} parents, {len(children)} children")

    # ----------------------------------------------------------------
    # 7. COURSES (6 courses — mix of adult and children)
    # ----------------------------------------------------------------
    print("\n📚  Creating courses …")
    mid_year = seasons['موسم منتصف السنة 2026']
    school = seasons['موسم المدرسة 2025-2026']
    summer = seasons['المعسكر الصيفي 2026']

    course_data = [
        # --- Active courses (mid-year) ---
        {
            'name': 'حفظ القرآن الكريم - مستوى مبتدئ',
            'description': 'دورة حفظ القرآن الكريم للمبتدئين مع شرح أحكام التجويد الأساسية',
            'start_date': date(2026, 1, 17),  # Saturday
            'num_lectures': 10,
            'capacity': 25,
            'price': Decimal('200.00'),
            'season': mid_year,
            'instructor': instructors[0],
            'for_adults': True,
            'tags': ['قرآن', 'تجويد'],
            'schedules': [
                {'weekday': Weekday.SATURDAY, 'start': time(10, 0), 'end': time(12, 0)},
                {'weekday': Weekday.TUESDAY, 'start': time(10, 0), 'end': time(12, 0)},
            ],
        },
        {
            'name': 'فقه العبادات',
            'description': 'دورة في فقه العبادات: الصلاة والصيام والزكاة',
            'start_date': date(2026, 1, 18),  # Sunday
            'num_lectures': 8,
            'capacity': 30,
            'price': Decimal('150.00'),
            'season': mid_year,
            'instructor': instructors[1],
            'for_adults': True,
            'tags': ['فقه'],
            'schedules': [
                {'weekday': Weekday.SUNDAY, 'start': time(14, 0), 'end': time(16, 0)},
                {'weekday': Weekday.WEDNESDAY, 'start': time(14, 0), 'end': time(16, 0)},
            ],
        },
        {
            'name': 'السيرة النبوية للأطفال',
            'description': 'قصص من السيرة النبوية الشريفة بأسلوب مبسط للأطفال',
            'start_date': date(2026, 1, 17),  # Saturday
            'num_lectures': 8,
            'capacity': 20,
            'price': Decimal('100.00'),
            'season': mid_year,
            'instructor': instructors[1],
            'for_adults': False,
            'min_age': 7,
            'max_age': 14,
            'tags': ['سيرة', 'أخلاق'],
            'schedules': [
                {'weekday': Weekday.SATURDAY, 'start': time(16, 0), 'end': time(17, 30)},
                {'weekday': Weekday.THURSDAY, 'start': time(16, 0), 'end': time(17, 30)},
            ],
        },
        {
            'name': 'حفظ القرآن للأطفال',
            'description': 'برنامج حفظ جزء عم للأطفال مع التجويد',
            'start_date': date(2026, 1, 19),  # Monday
            'num_lectures': 12,
            'capacity': 15,
            'price': Decimal('120.00'),
            'season': mid_year,
            'instructor': instructors[0],
            'for_adults': False,
            'min_age': 6,
            'max_age': 12,
            'tags': ['قرآن', 'تجويد'],
            'schedules': [
                {'weekday': Weekday.MONDAY, 'start': time(15, 0), 'end': time(16, 30)},
                {'weekday': Weekday.WEDNESDAY, 'start': time(15, 0), 'end': time(16, 30)},
            ],
        },
        # --- School season course ---
        {
            'name': 'اللغة العربية - النحو والصرف',
            'description': 'أساسيات النحو والصرف في اللغة العربية',
            'start_date': date(2025, 10, 4),  # Saturday
            'end_date': date(2026, 1, 10),
            'capacity': 20,
            'price': Decimal('300.00'),
            'season': school,
            'instructor': instructors[2],
            'for_adults': True,
            'tags': ['لغة عربية'],
            'schedules': [
                {'weekday': Weekday.SATURDAY, 'start': time(18, 0), 'end': time(20, 0)},
            ],
            'is_active': False,  # completed course
        },
        # --- Future summer course ---
        {
            'name': 'المعسكر الصيفي لتحفيظ القرآن',
            'description': 'برنامج صيفي مكثف لحفظ القرآن الكريم',
            'start_date': date(2026, 6, 6),  # Saturday
            'num_lectures': 24,
            'capacity': 40,
            'price': Decimal('500.00'),
            'season': summer,
            'instructor': instructors[0],
            'for_adults': False,
            'min_age': 8,
            'max_age': 16,
            'tags': ['قرآن', 'تجويد', 'حديث'],
            'schedules': [
                {'weekday': Weekday.SATURDAY, 'start': time(9, 0), 'end': time(12, 0)},
                {'weekday': Weekday.MONDAY, 'start': time(9, 0), 'end': time(12, 0)},
                {'weekday': Weekday.WEDNESDAY, 'start': time(9, 0), 'end': time(12, 0)},
            ],
        },
    ]

    courses = []
    for d in course_data:
        course, created = Course.objects.get_or_create(
            name=d['name'],
            defaults={
                'description': d['description'],
                'start_date': d['start_date'],
                'end_date': d.get('end_date'),
                'num_lectures': d.get('num_lectures'),
                'capacity': d['capacity'],
                'price': d['price'],
                'season': d['season'],
                'instructor': d['instructor'],
                'for_adults': d['for_adults'],
                'min_age': d.get('min_age'),
                'max_age': d.get('max_age'),
                'is_active': d.get('is_active', True),
            },
        )
        if created:
            course.tags.set([tags[t] for t in d['tags']])
            # Schedules are created here; the signal will auto-generate lectures
            for sched in d['schedules']:
                CourseSchedule.objects.get_or_create(
                    course=course,
                    weekday=sched['weekday'],
                    defaults={
                        'start_time': sched['start'],
                        'end_time': sched['end'],
                    },
                )
        courses.append(course)

    print(f"   ✅ {len(courses)} courses")
    for c in courses:
        lec_count = c.lectures.count()
        sched_count = c.schedules.count()
        print(f"      • {c.name}: {lec_count} lectures, {sched_count} schedules")

    # ----------------------------------------------------------------
    # 8. ENROLLMENTS (students → adult courses, children → kids courses)
    # ----------------------------------------------------------------
    print("\n📝  Creating enrollments …")
    enrollment_count = 0

    # Adult courses (indices 0, 1 = quran adults, fiqh)
    adult_courses = [courses[0], courses[1]]
    for student in students[:3]:
        for course in adult_courses:
            _, created = Enrollment.objects.get_or_create(
                course=course,
                student=student,
                defaults={
                    'status': EnrollmentStatus.ACTIVE,
                    'created_by': admin_user,
                },
            )
            if created:
                enrollment_count += 1

    # Also enroll 2 more students in just the first adult course
    for student in students[3:]:
        _, created = Enrollment.objects.get_or_create(
            course=courses[0],
            student=student,
            defaults={
                'status': EnrollmentStatus.ACTIVE,
                'created_by': admin_user,
            },
        )
        if created:
            enrollment_count += 1

    # Children courses (index 2 = sira kids, index 3 = quran kids)
    kids_courses = [courses[2], courses[3]]
    for child in children:
        for course in kids_courses:
            _, created = Enrollment.objects.get_or_create(
                course=course,
                child=child,
                defaults={
                    'status': EnrollmentStatus.ACTIVE,
                    'created_by': admin_user,
                },
            )
            if created:
                enrollment_count += 1

    print(f"   ✅ {enrollment_count} enrollments created")

    # ----------------------------------------------------------------
    # 9. ENROLLMENT REQUESTS (pending & processed)
    # ----------------------------------------------------------------
    print("\n📨  Creating enrollment requests …")
    er_count = 0

    # Pending request: student[3] wants to join fiqh course
    _, created = EnrollmentRequest.objects.get_or_create(
        course=courses[1],
        student=students[3],
        defaults={
            'price': courses[1].price,
            'status': EnrollmentRequestStatus.PENDING,
            'payment_method': ERPaymentMethod.CASH,
            'notes': 'أريد الالتحاق بدورة الفقه',
        },
    )
    if created:
        er_count += 1

    # Pending request: parent[1] wants child[2] (حمزة) in adult course (testing rejection)
    _, created = EnrollmentRequest.objects.get_or_create(
        course=courses[0],
        parent=parents[1],
        child=children[2],
        defaults={
            'price': courses[0].price,
            'status': EnrollmentRequestStatus.PENDING,
            'payment_method': ERPaymentMethod.VODAFONE_CASH,
        },
    )
    if created:
        er_count += 1

    # Accepted request (already enrolled above) — student[0] for quran course
    _, created = EnrollmentRequest.objects.get_or_create(
        course=courses[0],
        student=students[0],
        defaults={
            'price': courses[0].price,
            'status': EnrollmentRequestStatus.ACCEPTED,
            'payment_method': ERPaymentMethod.INSTAPAY,
            'processed_by': admin_user,
            'processed_at': timezone.now(),
        },
    )
    if created:
        er_count += 1

    # Expired request — must bypass model validation since expires_at is in the past
    er_qs = EnrollmentRequest.objects.filter(course=courses[4], student=students[4])
    if not er_qs.exists():
        er = EnrollmentRequest(
            course=courses[4],
            student=students[4],
            price=courses[4].price,
            status=EnrollmentRequestStatus.EXPIRED,
            payment_method=ERPaymentMethod.CASH,
            expires_at=timezone.now() - timedelta(days=30),
        )
        # Use super().save() via Model.save_base to skip full_clean
        models.Model.save(er, force_insert=True)
        er_count += 1

    print(f"   ✅ {er_count} enrollment requests")

    # ----------------------------------------------------------------
    # 10. PAYMENTS
    # ----------------------------------------------------------------
    print("\n💰  Creating payments …")
    pay_count = 0

    # Paid payments for enrolled students
    for student in students[:3]:
        enrollment = Enrollment.objects.filter(
            course=courses[0], student=student).first()
        if enrollment:
            payment, created = Payment.objects.get_or_create(
                enrollment=enrollment,
                payer_student=student,
                defaults={
                    'amount': courses[0].price,
                    'method': PaymentMethod.CASH,
                    'status': PaymentStatus.PAID,
                    'processed_by': admin_user,
                    'processed_at': timezone.now(),
                },
            )
            if created:
                pay_count += 1

    # Pending payment for student[3]
    enrollment = Enrollment.objects.filter(
        course=courses[0], student=students[3]).first()
    if enrollment:
        _, created = Payment.objects.get_or_create(
            enrollment=enrollment,
            payer_student=students[3],
            defaults={
                'amount': courses[0].price,
                'method': PaymentMethod.INSTAPAY,
                'status': PaymentStatus.PENDING,
            },
        )
        if created:
            pay_count += 1

    # Paid payment for children (parent pays)
    for child in children[:2]:
        enrollment = Enrollment.objects.filter(
            course=courses[2], child=child).first()
        if enrollment:
            _, created = Payment.objects.get_or_create(
                enrollment=enrollment,
                payer_parent=parents[0],
                defaults={
                    'amount': courses[2].price,
                    'method': PaymentMethod.VODAFONE_CASH,
                    'status': PaymentStatus.PAID,
                    'processed_by': admin_user,
                    'processed_at': timezone.now(),
                },
            )
            if created:
                pay_count += 1

    # Pending parent payment for quran kids
    for child in children[2:]:
        enrollment = Enrollment.objects.filter(
            course=courses[3], child=child).first()
        if enrollment:
            _, created = Payment.objects.get_or_create(
                enrollment=enrollment,
                payer_parent=parents[1],
                defaults={
                    'amount': courses[3].price,
                    'method': PaymentMethod.CASH,
                    'status': PaymentStatus.PENDING,
                },
            )
            if created:
                pay_count += 1

    print(f"   ✅ {pay_count} payments")

    # ----------------------------------------------------------------
    # 11. MARK SOME LECTURES AS COMPLETED (for past dates)
    # ----------------------------------------------------------------
    print("\n📖  Marking past lectures as completed …")
    past_lectures = Lecture.objects.filter(day__lt=today)
    updated = past_lectures.update(status=LectureStatus.COMPLETED)
    print(f"   ✅ {updated} past lectures marked as completed")

    # ----------------------------------------------------------------
    # 12. MARK SOME LECTURE ATTENDANCE (for completed lectures)
    # ----------------------------------------------------------------
    print("\n✅  Marking attendance for completed lectures …")
    att_count = 0
    completed_lectures = Lecture.objects.filter(status=LectureStatus.COMPLETED)[:6]

    import random
    for lecture in completed_lectures:
        attendances = LectureAttendance.objects.filter(lecture=lecture)
        for att in attendances:
            present = random.choice([True, True, True, False])  # 75% attendance
            rating = random.randint(5, 10) if present else random.randint(1, 4)
            att.present = present
            att.rating = rating
            att.marked_by = admin_user
            att.marked_at = timezone.now()
            att.save()
            att_count += 1

    print(f"   ✅ {att_count} attendance records marked")

    # ----------------------------------------------------------------
    # SUMMARY
    # ----------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  ✅  SEEDING COMPLETE!")
    print("=" * 60)
    print(f"""
📊 Summary:
   Tags:                 {Tag.objects.count()}
   Seasons:              {Season.objects.count()}
   Users:                {CustomUser.objects.count()}
   Instructors:          {Instructor.objects.count()}
   Students:             {StudentUser.objects.count()}
   Parents:              {Parent.objects.count()}
   Children:             {Child.objects.count()}
   Courses:              {Course.objects.count()}
   Course Schedules:     {CourseSchedule.objects.count()}
   Lectures:             {Lecture.objects.count()}
   Enrollments:          {Enrollment.objects.count()}
   Enrollment Requests:  {EnrollmentRequest.objects.count()}
   Payments:             {Payment.objects.count()}
   Attendance Records:   {LectureAttendance.objects.count()}

🔐 Login credentials (all users):
   Password: {PASSWORD}

👤 Test accounts:
   Admin:         {phone('1000000000')}
   Instructor 1:  {phone('1010000001')}  (محمد علي حسين - قرآن/تجويد)
   Instructor 2:  {phone('1010000002')}  (خالد عبد الرحمن - فقه/سيرة/مشرف)
   Instructor 3:  {phone('1010000003')}  (فاطمة أحمد محمود - لغة عربية)
   Student 1:     {phone('1020000001')}  (يوسف عمر أحمد)
   Student 2:     {phone('1020000002')}  (عبد الله محمد سعيد)
   Student 3:     {phone('1020000003')}  (مريم حسن إبراهيم)
   Student 4:     {phone('1020000004')}  (عمر خالد عبد العزيز)
   Student 5:     {phone('1020000005')}  (نور سامي محمود)
   Parent 1:      {phone('1030000001')}  (أحمد عبد الله محمد)
   Parent 2:      {phone('1030000002')}  (سارة محمد إبراهيم)
""")


if __name__ == '__main__':
    seed()
