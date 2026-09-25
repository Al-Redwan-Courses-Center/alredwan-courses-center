#!/usr/bin/env python3
"""
Standalone script to seed the database with test data.
Usage: python scripts/seed_data.py [--clear] [--base-date YYYY-MM-DD]
"""

import os
import sys
import django

# Add the parent directory (backend) to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Redwan_courses_center.settings")
django.setup()

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta, date, time
import random
from decimal import Decimal

from users.models import CustomUser, StudentUser, Instructor
from users.models.student_instructor_rating import (
    StudentInstructorRating,
    ParentInstructorRating,
    StudentCourseRating,
    ParentCourseRating,
)
from users.models.landingPageInstructor import LandingPageInstructor
from parents.models import Parent, Child, ParentLinkRequest
from courses.models import (
    Season,
    Tag,
    Course,
    CourseSchedule,
    Lecture,
    Weekday,
    LectureStatus,
)
from courses.models.landing_page_course import LandingPageCourse
from courses.models.exam import Exam, ExamResult, ExamChoices
from enrollments_payments.models import (
    Enrollment,
    Payment,
    PaymentMethod,
    PaymentStatus,
)
from enrollments_payments.models.enrollment_request import (
    EnrollmentRequest,
    EnrollmentRequestStatus,
)
from attendance.models import (
    LectureAttendance,
    InstructorAttendance,
    SupervisorSchedule,
    AttendanceStatus,
    AttendanceType,
    CheckInMethod,
    AttendanceDevice,
    FingerprintScanLog,
    ScanAction,
)


class Command(BaseCommand):
    help = "Seed the database with test data based on a configurable timestamp"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )
        parser.add_argument(
            "--base-date",
            type=str,
            default=None,
            help="Base date for seeding (YYYY-MM-DD). Defaults to today.",
        )
        parser.add_argument(
            "--students",
            type=int,
            default=20,
            help="Number of students to create (default: 20)",
        )
        parser.add_argument(
            "--instructors",
            type=int,
            default=5,
            help="Number of instructors to create (default: 5)",
        )
        parser.add_argument(
            "--courses",
            type=int,
            default=10,
            help="Number of courses to create (default: 10)",
        )
        parser.add_argument(
            "--parents",
            type=int,
            default=10,
            help="Number of parents to create (default: 10)",
        )

    def handle(self, *args, **options):
        # Parse base date
        if options["base_date"]:
            try:
                base_date = datetime.strptime(options["base_date"], "%Y-%m-%d").date()
            except ValueError:
                self.stdout.write(
                    self.style.ERROR("Invalid date format. Use YYYY-MM-DD")
                )
                return
        else:
            base_date = timezone.now().date()

        print(f"Base date: {base_date}")

        # Clear existing data if requested (OUTSIDE transaction to ensure commit)
        if options["clear"]:
            self.clear_data()

            # Force a complete database refresh by closing all connections
            from django.db import connections

            for conn in connections.all():
                conn.close()

        # Seed data
        with transaction.atomic():
            print("Creating tags...")
            tags = self.create_tags()

            print("Creating seasons...")
            seasons = self.create_seasons(base_date)

            print("Creating instructors...")
            instructors = self.create_instructors(
                options["instructors"], base_date, tags
            )

            print("Creating supervisor schedules...")
            self.create_supervisor_schedules(instructors)

            print("Creating attendance devices...")
            devices = self.create_attendance_devices()

            print("Creating students...")
            students = self.create_students(options["students"], base_date)

            print("Creating parents and children...")
            parents, children = self.create_parents_and_children(
                options["parents"], base_date
            )

            print("Creating parent link requests...")
            self.create_parent_link_requests(parents, children)

            print("Creating courses...")
            courses = self.create_courses(
                options["courses"], base_date, seasons, instructors, tags
            )

            print("Creating landing page features...")
            self.create_landing_page_features(courses, instructors)

            print("Creating course schedules...")
            self.create_course_schedules(courses)

            print("Generating lectures...")
            self.generate_lectures(courses)

            print("Creating enrollments...")
            enrollments = self.create_enrollments(
                courses, students, children, base_date
            )

            print("Creating enrollment requests...")
            self.create_enrollment_requests(courses, students, children, base_date)

            print("Creating payments...")
            self.create_payments(enrollments, base_date)

            print("Creating exams...")
            self.create_exams(courses, base_date)

            print("Creating exam results...")
            self.create_exam_results(enrollments, base_date)

            print("Creating lecture attendance records...")
            self.create_lecture_attendance(enrollments, base_date)

            print("Creating instructor attendance records...")
            self.create_instructor_attendance(courses, base_date, seasons, devices)

            print("Creating fingerprint scan logs...")
            self.create_fingerprint_scans(base_date, devices)

            print("Creating ratings...")
            self.create_ratings(students, parents, instructors, courses, enrollments)

        print(self.style.SUCCESS("✓ Database seeded successfully!"))
        self.print_summary(
            tags,
            seasons,
            instructors,
            students,
            parents,
            children,
            courses,
            enrollments,
        )

    def clear_data(self):
        """Clear existing data from the database."""
        from django.db import connection

        print("⚠️  Clearing existing data...")

        with connection.cursor() as cursor:
            # Disable foreign key checks temporarily
            cursor.execute("SET session_replication_role = 'replica';")

            # Truncate all tables in the correct order
            print("  Truncating attendance tables...")
            cursor.execute(
                "TRUNCATE TABLE attendance_fingerprintscanlog RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE attendance_instructorattendance RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE attendance_lectureattendance RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE attendance_supervisorschedule RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE attendance_attendancedevice RESTART IDENTITY CASCADE;"
            )

            print("  Truncating exam tables...")
            cursor.execute(
                "TRUNCATE TABLE courses_examresult RESTART IDENTITY CASCADE;"
            )
            cursor.execute("TRUNCATE TABLE courses_exam RESTART IDENTITY CASCADE;")

            print("  Truncating enrollment tables...")
            cursor.execute(
                "TRUNCATE TABLE enrollments_payments_enrollmentrequest RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE enrollments_payments_payment RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE enrollments_payments_enrollment RESTART IDENTITY CASCADE;"
            )

            print("  Truncating rating tables...")
            cursor.execute(
                "TRUNCATE TABLE users_studentinstructorrating RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE users_parentinstructorrating RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE users_studentcourserating RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE users_parentcourserating RESTART IDENTITY CASCADE;"
            )

            print("  Truncating course tables...")
            cursor.execute(
                "TRUNCATE TABLE courses_landingpagecourse RESTART IDENTITY CASCADE;"
            )
            cursor.execute("TRUNCATE TABLE courses_lecture RESTART IDENTITY CASCADE;")
            cursor.execute(
                "TRUNCATE TABLE courses_courseschedule RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE courses_course_tags RESTART IDENTITY CASCADE;"
            )
            cursor.execute("TRUNCATE TABLE courses_course RESTART IDENTITY CASCADE;")
            cursor.execute("TRUNCATE TABLE courses_season RESTART IDENTITY CASCADE;")
            cursor.execute("TRUNCATE TABLE courses_tag RESTART IDENTITY CASCADE;")

            print("  Truncating parent and child tables...")
            cursor.execute(
                "TRUNCATE TABLE parents_parentlinkrequest RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE parents_childparents RESTART IDENTITY CASCADE;"
            )
            cursor.execute("TRUNCATE TABLE parents_child RESTART IDENTITY CASCADE;")
            cursor.execute("TRUNCATE TABLE parents_parent RESTART IDENTITY CASCADE;")

            print("  Truncating user tables...")
            cursor.execute(
                "TRUNCATE TABLE users_landingpageinstructor RESTART IDENTITY CASCADE;"
            )
            cursor.execute(
                "TRUNCATE TABLE users_instructor_tags RESTART IDENTITY CASCADE;"
            )
            cursor.execute("TRUNCATE TABLE users_instructor RESTART IDENTITY CASCADE;")
            cursor.execute("TRUNCATE TABLE users_studentuser RESTART IDENTITY CASCADE;")

            # Delete non-superuser CustomUser records BEFORE re-enabling constraints
            print("  Deleting non-superuser accounts...")
            cursor.execute("DELETE FROM users_customuser WHERE is_superuser = false;")

            # Re-enable foreign key checks
            cursor.execute("SET session_replication_role = 'origin';")

        # Verify all user profile tables are empty
        print("  Verifying data cleanup...")
        student_count = StudentUser.objects.count()
        instructor_count = Instructor.objects.count()
        parent_count = Parent.objects.count()

        if student_count > 0 or instructor_count > 0 or parent_count > 0:
            print(
                f"  ⚠️  Warning: Found orphaned records - Students: {student_count}, Instructors: {instructor_count}, Parents: {parent_count}"
            )
            print("  Cleaning up orphaned records...")

            # Force delete any remaining records
            StudentUser.objects.all().delete()
            Instructor.objects.all().delete()
            Parent.objects.all().delete()

            # Delete orphaned CustomUser records again
            CustomUser.objects.filter(is_superuser=False).delete()

        # Commit the transaction to ensure all changes are persisted
        from django.db import transaction

        transaction.commit()

        print("✓ Data cleared")

    def create_tags(self):
        """Create course tags."""
        tag_names = [
            "القرآن الكريم",
            "التجويد",
            "الحفظ",
            "التلاوة",
            "التفسير",
            "العقيدة",
            "الفقه",
            "السيرة النبوية",
        ]
        tags = []
        for name in tag_names:
            tag, created = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        return tags

    def create_seasons(self, base_date):
        """Create seasons based on base date."""
        seasons = []

        # Previous season (completed)
        prev_season = Season.objects.create(
            name="موسم شتاء 2025",
            season_type="school",
            start_date=base_date - timedelta(days=180),
            end_date=base_date - timedelta(days=30),
            description="موسم شتاء منتهي",
            is_active=False,
        )
        seasons.append(prev_season)

        # Current active season
        current_season = Season.objects.create(
            name="موسم صيف 2026",
            season_type="summer_camp",
            start_date=base_date - timedelta(days=30),
            end_date=base_date + timedelta(days=60),
            description="موسم صيفي نشط حاليًا",
            is_active=True,
        )
        seasons.append(current_season)

        # Future season
        future_season = Season.objects.create(
            name="موسم رمضان 2026",
            season_type="ramadan",
            start_date=base_date + timedelta(days=90),
            end_date=base_date + timedelta(days=120),
            description="موسم رمضان القادم",
            is_active=False,
        )
        seasons.append(future_season)

        return seasons

    def create_instructors(self, count, base_date, tags):
        """Create instructor users and profiles."""
        instructors = []

        first_names = [
            "أحمد",
            "محمد",
            "عبدالله",
            "خالد",
            "عمر",
            "فاطمة",
            "عائشة",
            "خديجة",
            "مريم",
            "زينب",
        ]
        last_names = [
            "الأحمدي",
            "المحمدي",
            "العبدلي",
            "الخالدي",
            "العمري",
            "الفاطمي",
            "السعيد",
            "الرشيد",
            "الكريم",
            "الحسن",
        ]

        for i in range(count):
            # Create user
            phone = f"+20100{1000000 + i:07d}"
            dob = base_date - timedelta(
                days=random.randint(9000, 18000)
            )  # 25-50 years old
            gender = random.choice(["male", "female"])

            user = CustomUser.objects.create_user(
                phone_number1=phone,
                password="password123",
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                dob=dob,
                gender=gender,
                role="instructor",
                is_verified=True,
            )

            # Create instructor profile
            instructor_type = "supervisor" if i < 2 else "normal"
            instructor = Instructor.objects.create(
                user=user,
                bio=f"معلم متخصص في تحفيظ القرآن الكريم - خبرة {random.randint(3, 15)} سنوات",
                monthly_salary=Decimal(random.randint(3000, 8000)),
                type=instructor_type,
                fingerprint_id=f"FP{1000 + i}" if random.random() > 0.3 else None,
            )

            # Add random tags
            instructor.tags.set(random.sample(tags, random.randint(1, 3)))
            instructors.append(instructor)

        return instructors

    def create_supervisor_schedules(self, instructors):
        """Create weekly schedules for supervisors."""
        supervisors = [i for i in instructors if i.type == "supervisor"]

        for supervisor in supervisors:
            # Each supervisor has 3-5 shifts per week
            num_shifts = random.randint(3, 5)
            used_days = set()

            for _ in range(num_shifts):
                # Pick random weekday
                while True:
                    weekday = random.randint(0, 6)
                    if weekday not in used_days:
                        used_days.add(weekday)
                        break

                # Morning or evening shift
                if random.random() < 0.5:
                    start_time = time(8, 0)
                    end_time = time(13, 0)
                else:
                    start_time = time(14, 0)
                    end_time = time(19, 0)

                SupervisorSchedule.objects.create(
                    instructor=supervisor,
                    day_of_week=weekday,
                    start_time=start_time,
                    end_time=end_time,
                    grace_period_minutes=random.choice([15, 20, 30]),
                    auto_absent_after_minutes=random.choice([60, 90, 120]),
                )

    def create_attendance_devices(self):
        """Create attendance devices (fingerprint, RFID, etc.)."""
        devices = []

        device_configs = [
            {
                "device_id": "FP-MAIN-001",
                "name": "جهاز البصمة - المدخل الرئيسي",
                "location": "المدخل الرئيسي",
            },
            {
                "device_id": "FP-CLASS-001",
                "name": "جهاز البصمة - قاعة 1",
                "location": "الطابق الأول - قاعة 1",
            },
            {
                "device_id": "FP-CLASS-002",
                "name": "جهاز البصمة - قاعة 2",
                "location": "الطابق الأول - قاعة 2",
            },
            {
                "device_id": "RFID-MAIN-001",
                "name": "جهاز RFID - المدخل",
                "location": "البوابة الرئيسية",
            },
        ]

        for config in device_configs:
            device = AttendanceDevice.objects.create(**config, is_active=True)
            devices.append(device)

        self.stdout.write(f"  Created {len(devices)} attendance devices")
        return devices

    def create_students(self, count, base_date):
        """Create student users and profiles."""
        students = []

        first_names = [
            "علي",
            "حسن",
            "حسين",
            "يوسف",
            "إبراهيم",
            "عمر",
            "فاطمة",
            "سارة",
            "ليلى",
            "نور",
        ]
        last_names = [
            "العلي",
            "الحسن",
            "اليوسف",
            "الإبراهيمي",
            "العمري",
            "المحمدي",
            "السعيد",
            "الكريم",
            "الرحيم",
            "الجميل",
        ]

        for i in range(count):
            phone = f"+20101{2000000 + i:07d}"
            # Students: 8-30 years old
            dob = base_date - timedelta(days=random.randint(2920, 10950))
            gender = random.choice(["male", "female"])

            user = CustomUser.objects.create_user(
                phone_number1=phone,
                password="password123",
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                dob=dob,
                gender=gender,
                role="student",
                is_verified=True,
            )

            # Signal already creates StudentUser, just fetch it
            student = StudentUser.objects.get(user=user)
            students.append(student)

        return students

    def create_parents_and_children(self, count, base_date):
        """Create parent users and their children."""
        parents = []
        children = []

        parent_first_names = [
            "أبو أحمد",
            "أبو محمد",
            "أبو عبدالله",
            "أم فاطمة",
            "أم عائشة",
            "أم خديجة",
        ]
        parent_last_names = ["الأحمدي", "المحمدي", "العبدلي", "الخالدي", "العمري"]
        child_first_names = [
            "أحمد",
            "محمد",
            "فاطمة",
            "عائشة",
            "يوسف",
            "مريم",
            "زينب",
            "علي",
        ]

        for i in range(count):
            phone = f"+20102{3000000 + i:07d}"
            dob = base_date - timedelta(
                days=random.randint(10000, 18000)
            )  # 27-49 years old
            gender = random.choice(["male", "female"])

            # Create parent user
            parent_user = CustomUser.objects.create_user(
                phone_number1=phone,
                password="password123",
                first_name=random.choice(parent_first_names),
                last_name=random.choice(parent_last_names),
                dob=dob,
                gender=gender,
                role="parent",
                is_verified=True,
            )

            # Signal already creates Parent, just fetch it
            parent = Parent.objects.get(user=parent_user)
            parents.append(parent)

            # Create 1-3 children for each parent
            num_children = random.randint(1, 3)
            for j in range(num_children):
                # Children: 5-15 years old
                child_dob = base_date - timedelta(days=random.randint(1825, 5475))
                child_gender = random.choice(["male", "female"])

                child = Child.objects.create(
                    primary_parent=parent,
                    first_name=random.choice(child_first_names),
                    last_name=parent_user.last_name,
                    dob=child_dob,
                    gender=child_gender,
                )
                children.append(child)

        return parents, children

    def create_parent_link_requests(self, parents, children):
        """Create parent link requests (secondary parent requests)."""
        if len(parents) < 2 or len(children) < 1:
            return 0

        request_count = 0

        for _ in range(min(5, len(children))):
            child = random.choice(children)
            primary_parent = child.primary_parent

            # Pick a different parent as requester
            potential_requesters = [p for p in parents if p != primary_parent]
            if not potential_requesters:
                continue

            requester = random.choice(potential_requesters)

            # Skip if already linked as secondary parent
            if child.extra_parents.filter(parent=requester).exists():
                continue

            # Skip if a request already exists for this exact triple
            if ParentLinkRequest.objects.filter(
                child=child, requester=requester, primary_parent=primary_parent
            ).exists():
                continue

            status = random.choice(["pending", "pending", "approved", "rejected"])

            # Use a savepoint so a race-condition duplicate doesn't abort the outer transaction
            try:
                with transaction.atomic():
                    request = ParentLinkRequest.objects.create(
                        child=child,
                        requester=requester,
                        primary_parent=primary_parent,
                        status=status,
                    )
                    if status == "approved":
                        from parents.models import ChildParents

                        ChildParents.objects.get_or_create(
                            child=child, parent=requester
                        )
                request_count += 1
            except Exception:
                pass  # Skip duplicate – savepoint already rolled back this iteration only

        self.stdout.write(f"  Created {request_count} parent link requests")
        return request_count

    def create_courses(self, count, base_date, seasons, instructors, tags):
        """Create courses."""
        courses = []

        course_names = [
            "تحفيظ القرآن الكريم - مستوى مبتدئ",
            "تحفيظ القرآن الكريم - مستوى متقدم",
            "أحكام التجويد",
            "حفظ جزء عم",
            "حفظ جزء تبارك",
            "التلاوة الصحيحة",
            "تفسير القرآن الكريم",
            "دورة العقيدة الإسلامية",
            "دورة الفقه الإسلامي",
            "السيرة النبوية للأطفال",
            "القرآن الكريم للكبار",
            "برنامج الحفظ المكثف",
        ]

        for i in range(min(count, len(course_names))):
            season = random.choice(seasons)
            instructor = random.choice(instructors)

            # Course starts within the season
            days_after_season_start = random.randint(0, 20)
            course_start = season.start_date + timedelta(days=days_after_season_start)

            # Course duration: 1-3 months
            num_lectures = random.randint(12, 36)
            course_end = course_start + timedelta(days=num_lectures * 3)  # Approximate

            # Ensure course end doesn't exceed season end
            if season.end_date and course_end > season.end_date:
                course_end = season.end_date

            # Determine if for adults or children
            for_adults = random.choice([True, False])
            if for_adults:
                min_age = random.choice([15, 18, 20])
                max_age = None
            else:
                min_age = random.choice([5, 7, 8])
                max_age = random.choice([14, 15, 16])

            course = Course.objects.create(
                name=course_names[i],
                description=f"دورة تعليمية متميزة في {course_names[i]}",
                start_date=course_start,
                end_date=course_end,
                num_lectures=num_lectures,
                capacity=random.randint(15, 40),
                price=Decimal(random.randint(500, 3000)),
                season=season,
                instructor=instructor,
                for_adults=for_adults,
                min_age=min_age,
                max_age=max_age,
                is_active=season.is_active,
            )

            # Add random tags
            course.tags.set(random.sample(tags, random.randint(1, 4)))
            courses.append(course)

        return courses

    def create_landing_page_features(self, courses, instructors):
        """Create landing page featured courses and instructors."""
        feature_count = 0

        # Feature top 3-5 active courses
        active_courses = [c for c in courses if c.is_active]
        if active_courses:
            num_featured = min(random.randint(3, 5), len(active_courses))
            featured_courses = random.sample(active_courses, num_featured)

            for idx, course in enumerate(featured_courses):
                LandingPageCourse.objects.create(
                    course=course,
                    order=len(featured_courses) - idx,  # Higher order = shown first
                )
                feature_count += 1

        # Feature top 2-4 instructors
        if instructors:
            num_featured = min(random.randint(2, 4), len(instructors))
            featured_instructors = random.sample(instructors, num_featured)

            for idx, instructor in enumerate(featured_instructors):
                LandingPageInstructor.objects.create(
                    instructor=instructor, order=len(featured_instructors) - idx
                )
                feature_count += 1

        self.stdout.write(f"  Created {feature_count} landing page features")
        return feature_count

    def create_course_schedules(self, courses):
        """Create schedules for courses."""
        for course in courses:
            # Each course has 1-3 weekly sessions
            num_sessions = random.randint(1, 3)
            used_days = set()

            for _ in range(num_sessions):
                # Pick a random weekday (0=Sat, 6=Fri)
                while True:
                    weekday = random.randint(0, 6)
                    if weekday not in used_days:
                        used_days.add(weekday)
                        break

                # Random time slots
                hour = random.choice([8, 9, 10, 14, 15, 16, 17, 18, 19])
                start_time = time(hour, random.choice([0, 30]))
                end_time = time(hour + random.randint(1, 2), random.choice([0, 30]))

                CourseSchedule.objects.create(
                    course=course,
                    weekday=weekday,
                    start_time=start_time,
                    end_time=end_time,
                )

    def generate_lectures(self, courses):
        """Generate lectures for courses based on schedules."""
        for course in courses:
            try:
                with (
                    transaction.atomic()
                ):  # savepoint – failure only rolls back this course
                    course.generate_lectures()

                    # Mark some past lectures as completed
                    past_lectures = course.lectures.filter(
                        day__lt=timezone.now().date()
                    )
                    for lecture in past_lectures:
                        if random.random() < 0.9:
                            lecture.status = LectureStatus.COMPLETED
                            lecture.save()
                        elif random.random() < 0.1:
                            lecture.status = LectureStatus.CANCELLED
                            lecture.save()

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Could not generate lectures for {course}: {e}")
                )

    def create_enrollments(self, courses, students, children, base_date):
        """Create enrollments for students and children."""
        enrollments = []

        # Active courses
        active_courses = [c for c in courses if c.is_active]

        # Enroll students
        for student in students:
            # Each student enrolls in 1-3 courses
            num_enrollments = random.randint(1, min(3, len(active_courses)))
            selected_courses = random.sample(active_courses, num_enrollments)

            for course in selected_courses:
                # Check eligibility
                if not course.is_participant_eligible(student):
                    continue

                # Check if not full
                if course.is_full:
                    continue

                # Enrollment date: between course start and now
                days_range = (base_date - course.start_date).days
                if days_range > 0:
                    enrolled_days_ago = random.randint(0, days_range)
                    enrolled_at = timezone.make_aware(
                        datetime.combine(
                            base_date - timedelta(days=enrolled_days_ago), time(10, 0)
                        )
                    )
                else:
                    enrolled_at = timezone.now()

                enrollment = Enrollment.objects.create(
                    course=course,
                    student=student,
                    enrolled_at=enrolled_at,
                    status="active",
                )
                enrollments.append(enrollment)

        # Enroll children
        for child in children:
            # Each child enrolls in 1-2 courses
            num_enrollments = random.randint(1, min(2, len(active_courses)))
            selected_courses = random.sample(active_courses, num_enrollments)

            for course in selected_courses:
                # Check eligibility
                if not course.is_participant_eligible(child):
                    continue

                # Check if not full
                if course.is_full:
                    continue

                # Enrollment date
                days_range = (base_date - course.start_date).days
                if days_range > 0:
                    enrolled_days_ago = random.randint(0, days_range)
                    enrolled_at = timezone.make_aware(
                        datetime.combine(
                            base_date - timedelta(days=enrolled_days_ago), time(10, 0)
                        )
                    )
                else:
                    enrolled_at = timezone.now()

                enrollment = Enrollment.objects.create(
                    course=course,
                    child=child,
                    enrolled_at=enrolled_at,
                    status="active",
                )
                enrollments.append(enrollment)

        return enrollments

    def create_enrollment_requests(self, courses, students, children, base_date):
        """Create enrollment requests (pending, processing, rejected)."""
        request_count = 0

        active_courses = [c for c in courses if c.is_active]
        if not active_courses:
            return 0

        # Create requests from students
        for student in random.sample(students, min(5, len(students))):
            # Check if already enrolled
            enrolled_courses = Enrollment.objects.filter(student=student).values_list(
                "course", flat=True
            )
            available_courses = [
                c for c in active_courses if c.id not in enrolled_courses
            ]

            if available_courses:
                course = random.choice(available_courses)
                status = random.choice(["pending", "pending", "processing", "rejected"])

                EnrollmentRequest.objects.create(
                    course=course,
                    student=student,
                    price=course.price
                    if random.random() < 0.7
                    else course.price * Decimal("0.5"),
                    status=status,
                    payment_method=random.choice(list(PaymentMethod.values)),
                    expires_at=timezone.now() + timedelta(days=7),
                )
                request_count += 1

        # Create requests from parents for children
        for child in random.sample(children, min(5, len(children))):
            enrolled_courses = Enrollment.objects.filter(child=child).values_list(
                "course", flat=True
            )
            available_courses = [
                c for c in active_courses if c.id not in enrolled_courses
            ]

            if available_courses:
                course = random.choice(available_courses)
                parent = child.primary_parent
                status = random.choice(["pending", "pending", "processing", "rejected"])

                EnrollmentRequest.objects.create(
                    course=course,
                    parent=parent,
                    child=child,
                    price=course.price,
                    status=status,
                    payment_method=random.choice(list(PaymentMethod.values)),
                    expires_at=timezone.now() + timedelta(days=7),
                )
                request_count += 1

        self.stdout.write(f"  Created {request_count} enrollment requests")
        return request_count

    def create_payments(self, enrollments, base_date):
        """Create payments for enrollments."""
        payments = []

        for enrollment in enrollments:
            course_price = enrollment.course.price
            payment_scenario = random.choice(["full", "partial", "installments"])

            # Resolve payer for child enrollments via primary_parent
            payer_parent = enrollment.child.primary_parent if enrollment.child else None

            if payment_scenario == "full":
                payment = Payment.objects.create(
                    enrollment=enrollment,
                    payer_student=enrollment.student if enrollment.student else None,
                    payer_parent=payer_parent,
                    amount=course_price,
                    method=random.choice(list(PaymentMethod.values)),
                    status=PaymentStatus.PAID,
                    processed_at=enrollment.enrolled_at + timedelta(hours=1),
                )
                payments.append(payment)

            elif payment_scenario == "partial":
                paid_percentage = random.uniform(0.5, 0.8)
                paid_amount = Decimal(float(course_price) * paid_percentage).quantize(
                    Decimal("0.01")
                )
                payment = Payment.objects.create(
                    enrollment=enrollment,
                    payer_student=enrollment.student if enrollment.student else None,
                    payer_parent=payer_parent,
                    amount=paid_amount,
                    method=random.choice(list(PaymentMethod.values)),
                    status=PaymentStatus.PAID,
                    processed_at=enrollment.enrolled_at + timedelta(hours=1),
                )
                payments.append(payment)

            else:
                num_installments = random.randint(2, 3)
                installment_amount = (course_price / num_installments).quantize(
                    Decimal("0.01")
                )
                for i in range(num_installments):
                    is_paid = (i == 0) or (random.random() < 0.7)
                    payment_date = enrollment.enrolled_at + timedelta(days=i * 30)
                    payment = Payment.objects.create(
                        enrollment=enrollment,
                        payer_student=enrollment.student
                        if enrollment.student
                        else None,
                        payer_parent=payer_parent,
                        amount=installment_amount,
                        method=random.choice(list(PaymentMethod.values)),
                        status=PaymentStatus.PAID if is_paid else PaymentStatus.PENDING,
                        processed_at=payment_date if is_paid else None,
                    )
                    payments.append(payment)

        return payments

    def create_exams(self, courses, base_date):
        """Create exams for courses."""
        exam_count = 0

        for course in courses:
            # Each course has 2-4 exams
            num_exams = random.randint(2, 4)

            # Get course duration
            course_duration = (course.end_date - course.start_date).days

            for i in range(num_exams):
                exam_type = random.choice(list(ExamChoices.values))

                # Schedule exam within course period
                days_into_course = random.randint(10, max(11, course_duration - 5))
                exam_date = course.start_date + timedelta(days=days_into_course)
                exam_datetime = timezone.make_aware(
                    datetime.combine(exam_date, time(random.choice([9, 10, 14, 15]), 0))
                )

                # Only create if exam date has passed or is near
                if exam_date <= base_date + timedelta(days=30):
                    Exam.objects.create(
                        name=f"امتحان {exam_type} - {course.name}",
                        course=course,
                        instructor=course.instructor,
                        exam_type=exam_type,
                        scheduled_at=exam_datetime,
                        total_marks=Decimal(random.choice([50, 100, 150])),
                        description=f"امتحان {exam_type} للدورة",
                    )
                    exam_count += 1

        self.stdout.write(f"  Created {exam_count} exams")
        return exam_count

    def create_exam_results(self, enrollments, base_date):
        """Create exam results for enrolled students."""
        result_count = 0

        # Get all past exams
        past_exams = Exam.objects.filter(scheduled_at__lte=timezone.now())

        for exam in past_exams:
            # Get all enrollments for this course
            course_enrollments = Enrollment.objects.filter(
                course=exam.course, status="active"
            )

            for enrollment in course_enrollments:
                # 80% chance student took the exam
                if random.random() < 0.8:
                    # Generate realistic marks (60-100% of total)
                    percentage = random.uniform(60, 100)
                    marks = (exam.total_marks * Decimal(percentage / 100)).quantize(
                        Decimal("0.01")
                    )

                    ExamResult.objects.create(
                        exam=exam,
                        student=enrollment.student if enrollment.student else None,
                        child=enrollment.child if enrollment.child else None,
                        marks_obtained=marks,
                        percentage=Decimal(percentage).quantize(Decimal("0.01")),
                        passed=percentage >= 50,
                        notes=random.choice([None, "ممتاز", "جيد جداً", "جيد", None]),
                        entered_by=exam.instructor.user if exam.instructor else None,
                        entered_at=exam.scheduled_at
                        + timedelta(days=random.randint(1, 7)),
                    )
                    result_count += 1

        self.stdout.write(f"  Created {result_count} exam results")
        return result_count

    def create_lecture_attendance(self, enrollments, base_date):
        """Create lecture attendance records for enrolled students/children."""
        attendance_count = 0

        for enrollment in enrollments:
            # Get all lectures for this course that have happened
            past_lectures = enrollment.course.lectures.filter(
                day__lte=base_date, status=LectureStatus.COMPLETED
            )

            for lecture in past_lectures:
                # 85% chance student attended
                if random.random() < 0.85:
                    present = True
                    rating = random.randint(7, 10)  # Good ratings
                else:
                    present = False
                    rating = random.randint(1, 6)  # Lower ratings for absences

                # Create attendance record
                attendance = LectureAttendance.objects.create(
                    lecture=lecture,
                    student=enrollment.student if enrollment.student else None,
                    child=enrollment.child if enrollment.child else None,
                    present=present,
                    rating=rating,
                    notes=random.choice(
                        [None, "ممتاز", "جيد جداً", "يحتاج تحسين", None, None]
                    ),
                    marked_by=lecture.instructor.user if lecture.instructor else None,
                    marked_via="manual",
                    marked_at=timezone.make_aware(
                        datetime.combine(
                            lecture.day,
                            time(lecture.end_time.hour, lecture.end_time.minute),
                        )
                    )
                    if lecture.end_time
                    else None,
                )
                attendance_count += 1

        self.stdout.write(f"  Created {attendance_count} lecture attendance records")
        return attendance_count

    def create_instructor_attendance(self, courses, base_date, seasons, devices):
        """Create instructor attendance records with device tracking."""
        active_season = next((s for s in seasons if s.is_active), None)
        if not active_season:
            return 0

        attendance_count = 0
        default_device = devices[0] if devices else None

        # Get all lectures that have happened
        past_lectures = Lecture.objects.filter(
            day__lte=base_date,
            status__in=[LectureStatus.COMPLETED, LectureStatus.CANCELLED],
        )

        for lecture in past_lectures:
            if not lecture.instructor:
                continue

            # Create instructor attendance for lecture
            if lecture.status == LectureStatus.COMPLETED:
                # Instructor attended
                check_in_time = (
                    timezone.make_aware(
                        datetime.combine(
                            lecture.day,
                            time(
                                lecture.start_time.hour - random.randint(0, 1),
                                random.randint(0, 59),
                            ),
                        )
                    )
                    if lecture.start_time
                    else None
                )

                check_out_time = (
                    timezone.make_aware(
                        datetime.combine(
                            lecture.day,
                            time(lecture.end_time.hour, lecture.end_time.minute),
                        )
                    )
                    if lecture.end_time and check_in_time
                    else None
                )

                # Determine if late
                if lecture.start_time and check_in_time:
                    scheduled_start = timezone.make_aware(
                        datetime.combine(lecture.day, lecture.start_time)
                    )
                    if check_in_time > scheduled_start + timedelta(minutes=15):
                        status = AttendanceStatus.LATE
                    else:
                        status = AttendanceStatus.PRESENT
                else:
                    status = AttendanceStatus.PRESENT

                # Rating for attended instructors
                rating = Decimal(random.uniform(7.5, 10.0)).quantize(Decimal("0.01"))

                # Random device
                device = random.choice(devices) if devices else None

                attendance = InstructorAttendance.objects.create(
                    instructor=lecture.instructor,
                    date=lecture.day,
                    check_in_time=check_in_time,
                    check_out_time=check_out_time,
                    check_in_device=device,
                    check_out_device=device,
                    check_in_method=random.choice(list(CheckInMethod.values)),
                    check_out_method=random.choice(list(CheckInMethod.values)),
                    status=status,
                    attendance_type=AttendanceType.LECTURE,
                    lecture=lecture,
                    season=active_season,
                    rating=rating,
                    rated_by=None,
                    rated_at=check_out_time if check_out_time else None,
                )
                attendance_count += 1
            else:
                # Lecture was cancelled - instructor might be absent
                if random.random() < 0.3:
                    attendance = InstructorAttendance.objects.create(
                        instructor=lecture.instructor,
                        date=lecture.day,
                        status=AttendanceStatus.ABSENT,
                        attendance_type=AttendanceType.LECTURE,
                        lecture=lecture,
                        season=active_season,
                        rating=None,
                    )
                    attendance_count += 1

        # Create supervisor attendance for schedules
        supervisor_schedules = SupervisorSchedule.objects.all()
        for schedule in supervisor_schedules:
            current_date = active_season.start_date
            while current_date <= min(base_date, active_season.end_date or base_date):
                if current_date.weekday() == schedule.day_of_week:
                    if random.random() < 0.95:
                        check_in_time = timezone.make_aware(
                            datetime.combine(
                                current_date,
                                time(schedule.start_time.hour, random.randint(0, 30)),
                            )
                        )
                        check_out_time = timezone.make_aware(
                            datetime.combine(
                                current_date,
                                time(schedule.end_time.hour, random.randint(0, 30)),
                            )
                        )

                        scheduled_start = timezone.make_aware(
                            datetime.combine(current_date, schedule.start_time)
                        )
                        if check_in_time > scheduled_start + timedelta(
                            minutes=schedule.grace_period_minutes
                        ):
                            status = AttendanceStatus.LATE
                        else:
                            status = AttendanceStatus.PRESENT

                        rating = Decimal(random.uniform(8.0, 10.0)).quantize(
                            Decimal("0.01")
                        )
                        device = random.choice(devices) if devices else None

                        InstructorAttendance.objects.create(
                            instructor=schedule.instructor,
                            date=current_date,
                            check_in_time=check_in_time,
                            check_out_time=check_out_time,
                            check_in_device=device,
                            check_out_device=device,
                            check_in_method=CheckInMethod.FINGERPRINT,
                            check_out_method=CheckInMethod.FINGERPRINT,
                            status=status,
                            attendance_type=AttendanceType.SUPERVISION,
                            schedule=schedule,
                            season=active_season,
                            rating=rating,
                        )
                        attendance_count += 1

                current_date += timedelta(days=1)

        self.stdout.write(f"  Created {attendance_count} instructor attendance records")
        return attendance_count

    def create_fingerprint_scans(self, base_date, devices):
        """Create fingerprint scan logs for instructor attendance."""
        if not devices:
            return 0

        scan_count = 0

        # Get all instructor attendances with fingerprint check-in
        attendances = InstructorAttendance.objects.filter(
            check_in_method=CheckInMethod.FINGERPRINT, check_in_time__isnull=False
        )

        for attendance in attendances:
            device = attendance.check_in_device or random.choice(devices)

            # Create check-in scan
            FingerprintScanLog.objects.create(
                attendance=attendance,
                instructor=attendance.instructor,
                scan_time=attendance.check_in_time,
                device=device,
                action=ScanAction.CHECK_IN,
                is_processed=True,
                notes="تسجيل دخول ناجح",
            )
            scan_count += 1

            # Create check-out scan if exists
            if attendance.check_out_time:
                FingerprintScanLog.objects.create(
                    attendance=attendance,
                    instructor=attendance.instructor,
                    scan_time=attendance.check_out_time,
                    device=device,
                    action=ScanAction.CHECK_OUT,
                    is_processed=True,
                    notes="تسجيل خروج ناجح",
                )
                scan_count += 1

            # Occasionally add duplicate/ignored scans
            if random.random() < 0.1:
                FingerprintScanLog.objects.create(
                    attendance=attendance,
                    instructor=attendance.instructor,
                    scan_time=attendance.check_in_time + timedelta(seconds=30),
                    device=device,
                    action=ScanAction.IGNORED,
                    is_processed=False,
                    notes="تجاهل - بصمة مكررة",
                )
                scan_count += 1

        self.stdout.write(f"  Created {scan_count} fingerprint scan logs")
        return scan_count

    def create_ratings(self, students, parents, instructors, courses, enrollments):
        """Create ratings from students/parents for instructors and courses."""
        rating_count = 0

        # Student ratings for instructors (based on enrollments)
        for enrollment in enrollments:
            if not enrollment.student:
                continue

            course = enrollment.course
            instructor = course.instructor

            if not instructor:
                continue

            # 60% chance student rates instructor
            if random.random() < 0.6:
                try:
                    StudentInstructorRating.objects.create(
                        student=enrollment.student,
                        instructor=instructor,
                        course=course,
                        rating=random.randint(7, 10),
                        feedback=random.choice(
                            [
                                None,
                                "معلم ممتاز ماشاء الله",
                                "استفدت كثيراً من الدورة",
                                "شرح واضح ومفيد",
                                "جزاه الله خيراً",
                                None,
                            ]
                        ),
                    )
                    rating_count += 1
                except:
                    pass  # Skip if duplicate

        # Parent ratings for instructors
        for enrollment in enrollments:
            if not enrollment.child:
                continue

            course = enrollment.course
            instructor = course.instructor
            parent = enrollment.child.primary_parent

            if not instructor or not parent:
                continue

            # 50% chance parent rates instructor
            if random.random() < 0.5:
                try:
                    ParentInstructorRating.objects.create(
                        parent=parent,
                        instructor=instructor,
                        course=course,
                        rating=random.randint(7, 10),
                        feedback=random.choice(
                            [
                                None,
                                "ولدي استفاد كثيراً",
                                "معلم متميز بارك الله فيه",
                                "تحسن ملحوظ في مستوى ابني",
                                None,
                            ]
                        ),
                    )
                    rating_count += 1
                except:
                    pass

        # Student ratings for courses
        for enrollment in enrollments:
            if not enrollment.student:
                continue

            # 55% chance student rates course
            if random.random() < 0.55:
                try:
                    StudentCourseRating.objects.create(
                        student=enrollment.student,
                        course=enrollment.course,
                        rating=random.randint(6, 10),
                        feedback=random.choice(
                            [
                                None,
                                "دورة مفيدة جداً",
                                "المحتوى ممتاز",
                                "استمتعت بالحضور",
                                None,
                            ]
                        ),
                    )
                    rating_count += 1
                except:
                    pass

        # Parent ratings for courses
        for enrollment in enrollments:
            if not enrollment.child:
                continue

            parent = enrollment.child.primary_parent
            if not parent:
                continue

            # 45% chance parent rates course
            if random.random() < 0.45:
                try:
                    ParentCourseRating.objects.create(
                        parent=parent,
                        course=enrollment.course,
                        rating=random.randint(7, 10),
                        feedback=random.choice(
                            [
                                None,
                                "دورة ممتازة لأطفالي",
                                "مناسبة لعمر ابني",
                                "ننصح بها",
                                None,
                            ]
                        ),
                    )
                    rating_count += 1
                except:
                    pass

        self.stdout.write(f"  Created {rating_count} ratings")
        return rating_count

    def print_summary(
        self,
        tags,
        seasons,
        instructors,
        students,
        parents,
        children,
        courses,
        enrollments,
    ):
        """Print a summary of created data."""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("SEEDING SUMMARY"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"Tags:                      {len(tags)}")
        self.stdout.write(f"Seasons:                   {len(seasons)}")
        self.stdout.write(f"Instructors:               {len(instructors)}")
        self.stdout.write(
            f"Supervisor Schedules:      {SupervisorSchedule.objects.count()}"
        )
        self.stdout.write(
            f"Attendance Devices:        {AttendanceDevice.objects.count()}"
        )
        self.stdout.write(f"Students:                  {len(students)}")
        self.stdout.write(f"Parents:                   {len(parents)}")
        self.stdout.write(f"Children:                  {len(children)}")
        self.stdout.write(
            f"Parent Link Requests:      {ParentLinkRequest.objects.count()}"
        )
        self.stdout.write(f"Courses:                   {len(courses)}")
        self.stdout.write(
            f"Landing Page Features:     {LandingPageCourse.objects.count() + LandingPageInstructor.objects.count()}"
        )
        self.stdout.write(f"Lectures:                  {Lecture.objects.count()}")
        self.stdout.write(f"Enrollments:               {len(enrollments)}")
        self.stdout.write(
            f"Enrollment Requests:       {EnrollmentRequest.objects.count()}"
        )
        self.stdout.write(f"Payments:                  {Payment.objects.count()}")
        self.stdout.write(f"Exams:                     {Exam.objects.count()}")
        self.stdout.write(f"Exam Results:              {ExamResult.objects.count()}")
        self.stdout.write(
            f"Lecture Attendance:        {LectureAttendance.objects.count()}"
        )
        self.stdout.write(
            f"Instructor Attendance:     {InstructorAttendance.objects.count()}"
        )
        self.stdout.write(
            f"Fingerprint Scans:         {FingerprintScanLog.objects.count()}"
        )
        self.stdout.write(
            f"Ratings (All):             {StudentInstructorRating.objects.count() + ParentInstructorRating.objects.count() + StudentCourseRating.objects.count() + ParentCourseRating.objects.count()}"
        )
        self.stdout.write("=" * 60 + "\n")

        # Print login credentials
        self.stdout.write(self.style.WARNING("TEST ACCOUNT CREDENTIALS:"))
        self.stdout.write("Student:     +201012000000 / password123")
        self.stdout.write("Instructor:  +201001000000 / password123")
        self.stdout.write("Parent:      +201023000000 / password123")
        self.stdout.write(
            "Supervisor:  +201001000000 / password123 (first 2 instructors)"
        )
        self.stdout.write("=" * 60 + "\n")


# Main execution for standalone script
if __name__ == "__main__":
    import argparse

    # Create argument parser
    parser = argparse.ArgumentParser(description="Seed the database with test data")
    parser.add_argument(
        "--clear", action="store_true", help="Clear existing data before seeding"
    )
    parser.add_argument(
        "--base-date", type=str, default=None, help="Base date for seeding (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--students", type=int, default=20, help="Number of students to create"
    )
    parser.add_argument(
        "--instructors", type=int, default=5, help="Number of instructors to create"
    )
    parser.add_argument(
        "--courses", type=int, default=10, help="Number of courses to create"
    )
    parser.add_argument(
        "--parents", type=int, default=10, help="Number of parents to create"
    )

    args = parser.parse_args()

    # Create command instance and run
    command = Command()
    command.stdout = command.stderr = type(
        "obj",
        (object,),
        {
            "write": lambda self, msg: print(msg),
            "style": type(
                "obj",
                (object,),
                {
                    "SUCCESS": lambda msg: f"\033[92m{msg}\033[0m",
                    "ERROR": lambda msg: f"\033[91m{msg}\033[0m",
                    "WARNING": lambda msg: f"\033[93m{msg}\033[0m",
                },
            )(),
        },
    )()

    # Run the seeding
    command.handle(
        base_date=args.base_date,
        clear=args.clear,
        students=args.students,
        instructors=args.instructors,
        courses=args.courses,
        parents=args.parents,
    )
