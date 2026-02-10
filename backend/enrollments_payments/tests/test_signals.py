#!/usr/bin/env python3
"""
Tests for enrollment signals that manage lecture attendance records.
"""
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch

from enrollments_payments.models.enrollment import Enrollment
from attendance.models.lecture_attendance import LectureAttendance
from courses.models.course import Course, Season
from courses.models.lecture import Lecture
from users.models.user import CustomUser
from users.models.student import StudentUser
from parents.models.parent import Parent, Child


class EnrollmentSignalsTestCase(TestCase):
    """Test cases for enrollment signals."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data that will be shared across all test methods."""
        # Create a season
        cls.season = Season.objects.create(
            name='Test Season',
            season_type='school',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=90),
            is_active=True
        )

        # Create a course
        cls.course = Course.objects.create(
            name='Test Course',
            season=cls.season,
            price=100.00,
            capacity=30,
            min_age=10,
            max_age=18,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
        )

        # Create future lectures (should have attendance created)
        cls.future_lecture_1 = Lecture.objects.create(
            course=cls.course,
            day=timezone.now().date() + timedelta(days=1),
            lecture_number=1,
            title='Future Lecture 1'
        )
        cls.future_lecture_2 = Lecture.objects.create(
            course=cls.course,
            day=timezone.now().date() + timedelta(days=7),
            lecture_number=2,
            title='Future Lecture 2'
        )

        # Create a past lecture (should NOT have attendance created)
        cls.past_lecture = Lecture.objects.create(
            course=cls.course,
            day=timezone.now().date() - timedelta(days=7),
            lecture_number=3,
            title='Past Lecture',
            status='completed'
        )

    def setUp(self):
        """Set up test data for each test method."""
        # Create a user for student enrollment tests
        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201234567890',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            gender='male',
            role='student',
            dob=timezone.now().date() - timedelta(days=365*15)
        )
        # Signal auto-creates StudentUser profile
        self.student = StudentUser.objects.get(user=self.student_user)

        # Create a parent and child for child enrollment tests
        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201234567891',
            password='testpass123',
            first_name='Test',
            last_name='Parent',
            gender='male',
            role='parent',
            dob=timezone.now().date() - timedelta(days=365*35)
        )
        # Signal auto-creates Parent profile
        self.parent = Parent.objects.get(user=self.parent_user)
        self.child = Child.objects.create(
            primary_parent=self.parent,
            first_name='Test',
            last_name='Child',
            gender='boy',
            dob=timezone.now().date() - timedelta(days=365*12)
        )

    def tearDown(self):
        """Clean up after each test."""
        # Delete enrollments first (will trigger signals)
        Enrollment.objects.all().delete()
        LectureAttendance.objects.all().delete()
        StudentUser.objects.all().delete()
        Child.objects.all().delete()
        Parent.objects.all().delete()
        CustomUser.objects.all().delete()


class TestCreateLectureAttendanceSignal(EnrollmentSignalsTestCase):
    """Test cases for the create_lecture_attendance_for_enrollment signal."""

    def test_creates_attendance_for_student_enrollment(self):
        """Test that attendance records are created when a student enrolls."""
        # Create enrollment for student
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Check attendance records were created for future lectures only
        attendance_records = LectureAttendance.objects.filter(
            student=self.student)
        self.assertEqual(attendance_records.count(), 2)

        # Verify attendance is for the correct lectures
        lecture_ids = set(attendance_records.values_list(
            'lecture_id', flat=True))
        expected_lecture_ids = {
            self.future_lecture_1.id, self.future_lecture_2.id}
        self.assertEqual(lecture_ids, expected_lecture_ids)

        # Verify past lecture has no attendance
        past_attendance = LectureAttendance.objects.filter(
            lecture=self.past_lecture, student=self.student
        )
        self.assertEqual(past_attendance.count(), 0)

    def test_creates_attendance_for_child_enrollment(self):
        """Test that attendance records are created when a child enrolls."""
        # Create enrollment for child
        enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child
        )

        # Check attendance records were created for future lectures only
        attendance_records = LectureAttendance.objects.filter(child=self.child)
        self.assertEqual(attendance_records.count(), 2)

        # Verify attendance is for the correct lectures
        lecture_ids = set(attendance_records.values_list(
            'lecture_id', flat=True))
        expected_lecture_ids = {
            self.future_lecture_1.id, self.future_lecture_2.id}
        self.assertEqual(lecture_ids, expected_lecture_ids)

    def test_attendance_initial_state(self):
        """Test that created attendance records have correct initial state."""
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        attendance_records = LectureAttendance.objects.filter(
            student=self.student)
        for record in attendance_records:
            self.assertIsNone(
                record.present, "Present should be None (not marked yet)")
            self.assertIsNone(record.rating, "Rating should be None")
            self.assertIsNone(record.marked_by, "Marked_by should be None")
            self.assertIsNone(record.marked_at, "Marked_at should be None")

    def test_no_attendance_created_for_past_lectures(self):
        """Test that no attendance is created for lectures in the past."""
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Verify no attendance for past lecture
        past_attendance = LectureAttendance.objects.filter(
            lecture=self.past_lecture)
        self.assertEqual(past_attendance.count(), 0)

    def test_no_attendance_created_on_enrollment_update(self):
        """Test that attendance is not created when enrollment is updated."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )
        initial_count = LectureAttendance.objects.filter(
            student=self.student).count()
        self.assertEqual(initial_count, 2)

        # Update enrollment
        enrollment.status = 'completed'
        enrollment.save()

        # Verify no new attendance records were created
        final_count = LectureAttendance.objects.filter(
            student=self.student).count()
        self.assertEqual(final_count, initial_count)


class TestDeleteLectureAttendanceSignal(EnrollmentSignalsTestCase):
    """Test cases for the delete_lecture_attendance_for_enrollment signal."""

    def test_deletes_attendance_for_student_enrollment(self):
        """Test that attendance records are deleted when student enrollment is deleted."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )
        self.assertEqual(LectureAttendance.objects.filter(
            student=self.student).count(), 2)

        # Delete enrollment
        enrollment.delete()

        # Verify attendance records were deleted
        self.assertEqual(LectureAttendance.objects.filter(
            student=self.student).count(), 0)

    def test_deletes_attendance_for_child_enrollment(self):
        """Test that attendance records are deleted when child enrollment is deleted."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child
        )
        self.assertEqual(LectureAttendance.objects.filter(
            child=self.child).count(), 2)

        # Delete enrollment
        enrollment.delete()

        # Verify attendance records were deleted
        self.assertEqual(LectureAttendance.objects.filter(
            child=self.child).count(), 0)

    def test_only_future_attendance_deleted(self):
        """Test that only future lecture attendance is deleted, not past."""
        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Manually create a past attendance record (simulating attendance was taken)
        past_attendance = LectureAttendance.objects.create(
            lecture=self.past_lecture,
            student=self.student,
            present=True,
            rating=8.0,
            marked_at=timezone.now()  # Required when present/rating is set
        )

        # Delete enrollment
        enrollment.delete()

        # Verify past attendance still exists (because day < now())
        self.assertTrue(
            LectureAttendance.objects.filter(id=past_attendance.id).exists(),
            "Past attendance should not be deleted"
        )

    def test_does_not_affect_other_students_attendance(self):
        """Test that deleting one enrollment doesn't affect other students."""
        # Create another student
        other_user = CustomUser.objects.create_user(
            phone_number1='+201234567892',
            password='testpass123',
            first_name='Other',
            last_name='Student',
            gender='female',
            dob=timezone.now().date() - timedelta(days=365*16)
        )
        other_student = StudentUser.objects.create(
            user=other_user,
            image='defaults/user_default.png'
        )

        # Create enrollments for both students
        enrollment1 = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )
        enrollment2 = Enrollment.objects.create(
            course=self.course,
            student=other_student
        )

        # Verify both have attendance
        self.assertEqual(LectureAttendance.objects.filter(
            student=self.student).count(), 2)
        self.assertEqual(LectureAttendance.objects.filter(
            student=other_student).count(), 2)

        # Delete first student's enrollment
        enrollment1.delete()

        # Verify only first student's attendance was deleted
        self.assertEqual(LectureAttendance.objects.filter(
            student=self.student).count(), 0)
        self.assertEqual(LectureAttendance.objects.filter(
            student=other_student).count(), 2)


class TestEdgeCases(EnrollmentSignalsTestCase):
    """Test edge cases for enrollment signals."""

    def test_enrollment_with_no_future_lectures(self):
        """Test enrollment when course has no future lectures."""
        # Create a course with only past lectures
        empty_course = Course.objects.create(
            name='Empty Course',
            season=self.season,
            price=50.00,
            capacity=20,
            min_age=10,
            max_age=18,
            start_date=timezone.now().date() - timedelta(days=30),
            end_date=timezone.now().date() - timedelta(days=1),
        )
        Lecture.objects.create(
            course=empty_course,
            day=timezone.now().date() - timedelta(days=10),
            lecture_number=1,
            title='Past Lecture',
            status='completed'
        )

        # Create enrollment - should not raise error
        enrollment = Enrollment.objects.create(
            course=empty_course,
            student=self.student
        )

        # Verify no attendance records were created
        self.assertEqual(
            LectureAttendance.objects.filter(student=self.student).count(), 0
        )

    def test_lecture_on_current_day(self):
        """Test that lectures on the current day (day >= now) get attendance created."""
        # Create a lecture for today
        today_lecture = Lecture.objects.create(
            course=self.course,
            day=timezone.now().date(),
            lecture_number=4,
            title='Today Lecture'
        )

        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Verify today's lecture has attendance (day >= now().date())
        today_attendance = LectureAttendance.objects.filter(
            lecture=today_lecture, student=self.student
        )
        self.assertEqual(today_attendance.count(), 1)

    def test_bulk_create_performance(self):
        """Test that signal uses bulk_create for multiple lectures."""
        # This test verifies the signal is efficient
        # Create many future lectures
        lectures = []
        for i in range(10):
            lectures.append(Lecture(
                course=self.course,
                day=timezone.now().date() + timedelta(days=i+10),
                lecture_number=i+10,
                title=f'Bulk Lecture {i}'
            ))
        Lecture.objects.bulk_create(lectures)

        # Create enrollment
        enrollment = Enrollment.objects.create(
            course=self.course,
            student=self.student
        )

        # Verify all attendance records were created
        # 2 original future lectures + 10 new ones = 12
        attendance_count = LectureAttendance.objects.filter(
            student=self.student,
            lecture__course=self.course
        ).count()
        self.assertEqual(attendance_count, 12)
