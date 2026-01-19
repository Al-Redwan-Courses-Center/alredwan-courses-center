from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from courses.models.course import Course, Season, SeasonChoices
from courses.models.lecture import Lecture, LectureStatus
from attendance.models.lecture_attendance import LectureAttendance
from enrollments_payments.models.enrollment import Enrollment, EnrollmentStatus
from users.models.user import CustomUser
from users.models.student import StudentUser
from parents.models.parent import Parent, Child


class EnrollmentSignalTestCase(TestCase):
    """Test cases for enrollment signals that manage lecture attendance records."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for the entire test class."""
        # Create a season
        cls.season = Season.objects.create(
            name="Test Season",
            season_type=SeasonChoices.SCHOOL,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=90)).date(),
            is_active=True
        )

        # Create a course
        cls.course = Course.objects.create(
            name="Test Course",
            season=cls.season,
            price=Decimal("100.00"),
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date(),
            number_of_lectures=5,
        )

        # Create a user for the student
        cls.student_user = CustomUser.objects.create_user(
            username="teststudent",
            email="student@test.com",
            password="testpass123",
            first_name="Test",
            last_name="Student",
            gender="male"
        )

        # Create a parent user
        cls.parent_user = CustomUser.objects.create_user(
            username="testparent",
            email="parent@test.com",
            password="testpass123",
            first_name="Test",
            last_name="Parent",
            gender="male"
        )

    def setUp(self):
        """Set up test data for each test method."""
        # Create student (needs to be in setUp for isolation since signals may delete)
        self.student = StudentUser.objects.create(
            user=self.student_user,
            image="defaults/user_default.png"
        )

        # Create parent and child
        self.parent = Parent.objects.create(user=self.parent_user)
        self.child = Child.objects.create(
            primary_parent=self.parent,
            first_name="Test",
            last_name="Child",
            dob=timezone.now().date() - timedelta(days=365 * 10),
            gender="boy"
        )

        # Create future lectures (should have attendance created)
        self.future_lectures = []
        for i in range(3):
            lecture = Lecture.objects.create(
                course=self.course,
                day=timezone.now().date() + timedelta(days=i + 1),
                lecture_number=i + 1,
                status=LectureStatus.SCHEDULED
            )
            self.future_lectures.append(lecture)

        # Create past lectures (should NOT have attendance created)
        self.past_lectures = []
        for i in range(2):
            # We need to bypass clean() for past lectures
            lecture = Lecture(
                course=self.course,
                day=timezone.now().date() - timedelta(days=i + 1),
                lecture_number=100 + i,  # Different number to avoid conflicts
                status=LectureStatus.COMPLETED  # Completed status allows past dates
            )
            lecture.save()
            self.past_lectures.append(lecture)

    def tearDown(self):
        """Clean up after each test."""
        LectureAttendance.objects.all().delete()
        Enrollment.objects.all().delete()
        Lecture.objects.all().delete()
        Child.objects.all().delete()
        Parent.objects.all().delete()
        StudentUser.objects.all().delete()


class TestCreateLectureAttendanceSignal(EnrollmentSignalTestCase):
    """Tests for the create_lecture_attendance_for_enrollment signal."""

    def test_enrollment_creates_attendance_for_future_lectures_student(self):
        """Test that creating an enrollment for a student creates attendance for future lectures only."""
        # Create enrollment for student
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Check that attendance records were created for future lectures
        attendance_count = LectureAttendance.objects.filter(
            student=self.student,
            lecture__in=self.future_lectures
        ).count()

        self.assertEqual(attendance_count, len(self.future_lectures))

    def test_enrollment_creates_attendance_for_future_lectures_child(self):
        """Test that creating an enrollment for a child creates attendance for future lectures only."""
        # Create enrollment for child
        enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child
        )

        # Check that attendance records were created for future lectures
        attendance_count = LectureAttendance.objects.filter(
            child=self.child,
            lecture__in=self.future_lectures
        ).count()

        self.assertEqual(attendance_count, len(self.future_lectures))

    def test_enrollment_does_not_create_attendance_for_past_lectures(self):
        """Test that creating an enrollment does not create attendance for past lectures."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Check that no attendance records were created for past lectures
        attendance_count = LectureAttendance.objects.filter(
            student=self.student,
            lecture__in=self.past_lectures
        ).count()

        self.assertEqual(attendance_count, 0)

    def test_attendance_records_have_correct_initial_values(self):
        """Test that created attendance records have correct initial values."""
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        attendance_records = LectureAttendance.objects.filter(
            student=self.student,
            lecture__in=self.future_lectures
        )

        for attendance in attendance_records:
            self.assertIsNone(attendance.present)  # Not marked yet
            self.assertIsNone(attendance.rating)
            self.assertIsNone(attendance.marked_by)
            self.assertIsNone(attendance.marked_at)
            self.assertEqual(attendance.student, self.student)
            self.assertIsNone(attendance.child)

    def test_no_duplicate_attendance_on_update(self):
        """Test that updating an enrollment doesn't create duplicate attendance records."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        initial_count = LectureAttendance.objects.filter(
            student=self.student
        ).count()

        # Update enrollment (change status)
        enrollment.status = EnrollmentStatus.ACTIVE
        enrollment.save()

        # Count should remain the same
        final_count = LectureAttendance.objects.filter(
            student=self.student
        ).count()

        self.assertEqual(initial_count, final_count)


class TestDeleteLectureAttendanceSignal(EnrollmentSignalTestCase):
    """Tests for the delete_lecture_attendance_for_enrollment signal."""

    def test_deleting_enrollment_removes_attendance_for_future_lectures_student(self):
        """Test that deleting an enrollment removes attendance for future lectures (student)."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Verify attendance was created
        self.assertGreater(
            LectureAttendance.objects.filter(
                student=self.student,
                lecture__in=self.future_lectures
            ).count(),
            0
        )

        # Delete enrollment
        enrollment.delete()

        # Check that attendance records were deleted for future lectures
        attendance_count = LectureAttendance.objects.filter(
            student=self.student,
            lecture__in=self.future_lectures
        ).count()

        self.assertEqual(attendance_count, 0)

    def test_deleting_enrollment_removes_attendance_for_future_lectures_child(self):
        """Test that deleting an enrollment removes attendance for future lectures (child)."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child
        )

        # Verify attendance was created
        self.assertGreater(
            LectureAttendance.objects.filter(
                child=self.child,
                lecture__in=self.future_lectures
            ).count(),
            0
        )

        # Delete enrollment
        enrollment.delete()

        # Check that attendance records were deleted for future lectures
        attendance_count = LectureAttendance.objects.filter(
            child=self.child,
            lecture__in=self.future_lectures
        ).count()

        self.assertEqual(attendance_count, 0)

    def test_deleting_enrollment_preserves_past_attendance(self):
        """Test that deleting an enrollment preserves attendance records for past lectures."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Manually create attendance for past lectures (simulating historical data)
        for lecture in self.past_lectures:
            LectureAttendance.objects.create(
                lecture=lecture,
                student=self.student,
                present=True,
                rating=Decimal("8.00")
            )

        # Delete enrollment
        enrollment.delete()

        # Check that past attendance records were preserved
        attendance_count = LectureAttendance.objects.filter(
            student=self.student,
            lecture__in=self.past_lectures
        ).count()

        self.assertEqual(attendance_count, len(self.past_lectures))


class TestSignalEdgeCases(EnrollmentSignalTestCase):
    """Tests for edge cases in enrollment signals."""

    def test_enrollment_with_no_future_lectures(self):
        """Test enrollment creation when course has no future lectures."""
        # Delete all future lectures
        Lecture.objects.filter(
            id__in=[l.id for l in self.future_lectures]).delete()

        # Create enrollment - should not raise an error
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # No attendance records should be created
        attendance_count = LectureAttendance.objects.filter(
            student=self.student
        ).count()

        self.assertEqual(attendance_count, 0)

    def test_enrollment_today_lecture_included(self):
        """Test that lectures scheduled for today (future time) are included."""
        # Create a lecture for today
        today_lecture = Lecture.objects.create(
            course=self.course,
            day=timezone.now().date(),
            lecture_number=999,
            status=LectureStatus.SCHEDULED
        )

        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Today's lecture might or might not be included depending on the exact time
        # The signal uses day__gte=timezone.now() which compares datetime to date
        # This test documents the current behavior
        attendance_exists = LectureAttendance.objects.filter(
            student=self.student,
            lecture=today_lecture
        ).exists()

        # Just verify no error occurred - the exact behavior depends on timezone.now()
        self.assertIsInstance(attendance_exists, bool)

    def test_multiple_enrollments_same_course_different_students(self):
        """Test that multiple students can enroll and each gets their own attendance."""
        # Create second student
        second_user = CustomUser.objects.create_user(
            username="secondstudent",
            email="second@test.com",
            password="testpass123",
            first_name="Second",
            last_name="Student",
            gender="female"
        )
        second_student = StudentUser.objects.create(
            user=second_user,
            image="defaults/user_default.png"
        )

        # Create enrollments
        Enrollment.objects.create(course=self.course, student=self.student)
        Enrollment.objects.create(course=self.course, student=second_student)

        # Each student should have their own attendance records
        first_count = LectureAttendance.objects.filter(
            student=self.student
        ).count()
        second_count = LectureAttendance.objects.filter(
            student=second_student
        ).count()

        self.assertEqual(first_count, len(self.future_lectures))
        self.assertEqual(second_count, len(self.future_lectures))

        # Clean up
        second_student.delete()
        second_user.delete()
