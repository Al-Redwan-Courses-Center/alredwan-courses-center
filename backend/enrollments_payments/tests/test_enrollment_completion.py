from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from courses.models.course import Course, Season, SeasonChoices
from courses.models.lecture import Lecture, LectureStatus
from users.models.instructor import Instructor
from enrollments_payments.models.enrollment import Enrollment, EnrollmentStatus
from parents.models import Parent, Child
from users.models import CustomUser
from enrollments_payments.cron import mark_completed_enrollments_daily, check_and_complete_course_enrollments


class EnrollmentCompletionTests(TestCase):
    """
    Test suite for enrollment auto-completion feature, manager methods, cron jobs, and signals.
    """

    def setUp(self):
        self.today = timezone.localdate()

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='Password123!',
            first_name='Test',
            last_name='Instructor',
            dob=timezone.now().date() - timedelta(days=10000),
            gender='male',
            role='instructor',
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=5000
        )

        self.season = Season.objects.create(
            name='Test Season Enrollment',
            season_type=SeasonChoices.OTHER,
            start_date=self.today - timedelta(days=60),
            end_date=self.today + timedelta(days=60),
            is_active=True,
        )

        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='Password123!',
            first_name='Parent',
            last_name='Test',
            dob=timezone.now().date() - timedelta(days=15000),
            gender='male',
            role='parent',
        )
        self.parent = self.parent_user.parent_profile

        self.child = Child.objects.create(
            primary_parent=self.parent,
            first_name='Test',
            last_name='Child Enrollment',
            dob=timezone.now().date() - timedelta(days=3650),
            gender='boy',
        )

    def test_end_date_completion(self):
        """Test enrollment completion based on end_date."""
        yesterday = self.today - timedelta(days=1)
        course = Course.objects.create(
            name='Test Course - End Date Passed',
            instructor=self.instructor,
            season=self.season,
            start_date=yesterday - timedelta(days=30),
            end_date=yesterday,
            price=100,
            capacity=30,
        )

        enrollment = Enrollment.objects.create(
            course=course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        self.assertTrue(enrollment.should_be_completed())
        progress = enrollment.get_completion_progress()
        self.assertTrue(progress['end_date_passed'])
        self.assertTrue(progress['is_completable'])

    def test_lecture_completion(self):
        """Test enrollment completion based on all lectures completed."""
        course = Course.objects.create(
            name='Test Course - Lecture Based',
            instructor=self.instructor,
            season=self.season,
            start_date=self.today - timedelta(days=30),
            end_date=None,
            num_lectures=3,
            price=100,
            capacity=30,
        )

        for i in range(3):
            Lecture.objects.create(
                course=course,
                day=self.today + timedelta(days=i + 1),
                lecture_number=i + 1,
                instructor=self.instructor,
                status=LectureStatus.SCHEDULED,
            )

        enrollment = Enrollment.objects.create(
            course=course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        # Before completing lectures
        self.assertFalse(enrollment.should_be_completed())

        # Complete all lectures
        for lecture in course.lectures.all():
            lecture.status = LectureStatus.COMPLETED
            lecture.save()

        enrollment.refresh_from_db()
        if enrollment.status == EnrollmentStatus.ACTIVE:
            self.assertTrue(enrollment.should_be_completed())
        else:
            self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)

        progress = enrollment.get_completion_progress()
        self.assertEqual(progress['total_lectures'], 3)
        self.assertEqual(progress['completed_lectures'], 3)

    def test_manager_get_completable(self):
        """Test EnrollmentManager.get_completable_enrollments()."""
        yesterday = self.today - timedelta(days=1)
        course = Course.objects.create(
            name='Test Course - Manager Check',
            instructor=self.instructor,
            season=self.season,
            start_date=yesterday - timedelta(days=30),
            end_date=yesterday,
            price=100,
            capacity=30,
        )
        enrollment = Enrollment.objects.create(
            course=course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        completable = Enrollment.objects.get_completable_enrollments()
        self.assertIn(enrollment, list(completable))

    def test_cron_job(self):
        """Test cron job mark_completed_enrollments_daily()."""
        yesterday = self.today - timedelta(days=1)
        course = Course.objects.create(
            name='Test Course - Cron Check',
            instructor=self.instructor,
            season=self.season,
            start_date=yesterday - timedelta(days=30),
            end_date=yesterday,
            price=100,
            capacity=30,
        )
        enrollment = Enrollment.objects.create(
            course=course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        count = mark_completed_enrollments_daily()
        self.assertGreaterEqual(count, 1)

        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)

    def test_course_specific_completion(self):
        """Test check_and_complete_course_enrollments()."""
        yesterday = self.today - timedelta(days=1)
        course = Course.objects.create(
            name='Test Course - Course Specific Check',
            instructor=self.instructor,
            season=self.season,
            start_date=yesterday - timedelta(days=30),
            end_date=yesterday,
            price=100,
            capacity=30,
        )
        enrollment = Enrollment.objects.create(
            course=course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        count = check_and_complete_course_enrollments(course.id)
        self.assertEqual(count, 1)

        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)

    def test_signal_trigger(self):
        """Test that signal triggers enrollment completion."""
        course = Course.objects.create(
            name='Test Course - Signal Trigger Check',
            instructor=self.instructor,
            season=self.season,
            start_date=self.today - timedelta(days=30),
            end_date=None,
            num_lectures=2,
            price=100,
            capacity=30,
        )

        Lecture.objects.create(
            course=course,
            day=self.today - timedelta(days=10),
            lecture_number=1,
            instructor=self.instructor,
            status=LectureStatus.COMPLETED,
        )
        lecture2 = Lecture.objects.create(
            course=course,
            day=self.today + timedelta(days=1),
            lecture_number=2,
            instructor=self.instructor,
            status=LectureStatus.SCHEDULED,
        )

        enrollment = Enrollment.objects.create(
            course=course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE,
        )

        lecture2.status = LectureStatus.COMPLETED
        lecture2.save()

        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, EnrollmentStatus.COMPLETED)
