#!/usr/bin/env python3
"""Tests for attendance cron jobs"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from users.models import CustomUser, Instructor
from courses.models import Season, Lecture, Course, Tag
from attendance.models import InstructorAttendance, AttendanceCronLog, SupervisorSchedule
from attendance.cron import generate_instructor_attendance_weekly, mark_absent_daily


class CronJobTestCase(TestCase):
    """Base test case with common setup for cron job tests"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class"""
        # Create a test user
        cls.user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='testpass123',
            first_name='Test',
            last_name='Instructor',
            email='instructor@test.com',
            dob='1990-01-01',
            gender='male'
        )

        # Create instructor
        cls.instructor = Instructor.objects.create(
            user=cls.user,
            monthly_salary=5000.00,
            type='supervisor'
        )

        # Create a season
        cls.season = Season.objects.create(
            name='Test Season',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )


class GenerateInstructorAttendanceWeeklyTest(CronJobTestCase):
    """Tests for the generate_instructor_attendance_weekly cron job"""

    def setUp(self):
        """Set up for each test"""
        # Clear any existing attendance records
        InstructorAttendance.objects.all().delete()
        AttendanceCronLog.objects.all().delete()

    def test_generates_attendance_for_supervisor_with_schedule(self):
        """Test that attendance is generated for supervisors with schedules"""
        today = timezone.localdate()

        # Create a schedule for today's weekday
        schedule = SupervisorSchedule.objects.create(
            instructor=self.instructor,
            day_of_week=today.weekday(),
            start_time='08:00:00',
            end_time='14:00:00'
        )

        # Run the cron job
        generate_instructor_attendance_weekly()

        # Check that attendance was created
        attendance_count = InstructorAttendance.objects.filter(
            instructor=self.instructor,
            date__gte=today,
            date__lte=today + timedelta(days=7)
        ).count()

        # Should have at least 1 record (for today, and possibly next week's same day)
        self.assertGreaterEqual(attendance_count, 1)

        # Check that cron log was created
        log = AttendanceCronLog.objects.filter(
            job_name='generate_attendance_weekly'
        ).first()
        self.assertIsNotNone(log)
        self.assertIn('Created', log.details)

    def test_does_not_create_duplicate_attendance(self):
        """Test that running cron twice doesn't create duplicate records"""
        today = timezone.localdate()

        # Create a schedule
        SupervisorSchedule.objects.create(
            instructor=self.instructor,
            day_of_week=today.weekday(),
            start_time='08:00:00',
            end_time='14:00:00'
        )

        # Run the cron job twice
        generate_instructor_attendance_weekly()
        initial_count = InstructorAttendance.objects.count()

        generate_instructor_attendance_weekly()
        final_count = InstructorAttendance.objects.count()

        # Count should remain the same
        self.assertEqual(initial_count, final_count)

    def test_cron_log_is_created(self):
        """Test that a cron log entry is created"""
        generate_instructor_attendance_weekly()

        log = AttendanceCronLog.objects.filter(
            job_name='generate_attendance_weekly'
        ).first()

        self.assertIsNotNone(log)
        self.assertIn('Created', log.details)
        self.assertIn('attendance records', log.details)


class MarkAbsentDailyTest(CronJobTestCase):
    """Tests for the mark_absent_daily cron job"""

    def setUp(self):
        """Set up for each test"""
        InstructorAttendance.objects.all().delete()
        AttendanceCronLog.objects.all().delete()

    def test_marks_pending_as_absent(self):
        """Test that pending attendance is marked as absent"""
        today = timezone.localdate()

        # Create a pending attendance record
        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status='pending',
            season=self.season
        )

        # Run the cron job
        mark_absent_daily()

        # Refresh from database
        attendance.refresh_from_db()

        # Status should now be absent
        self.assertEqual(attendance.status, 'absent')

    def test_marks_not_started_as_absent(self):
        """Test that not_started attendance is marked as absent"""
        today = timezone.localdate()

        # Create a not_started attendance record
        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status='not_started',
            season=self.season
        )

        # Run the cron job
        mark_absent_daily()

        # Refresh from database
        attendance.refresh_from_db()

        # Status should now be absent
        self.assertEqual(attendance.status, 'absent')

    def test_does_not_change_present_status(self):
        """Test that present attendance is not changed"""
        today = timezone.localdate()

        # Create a present attendance record
        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status='present',
            season=self.season
        )

        # Run the cron job
        mark_absent_daily()

        # Refresh from database
        attendance.refresh_from_db()

        # Status should still be present
        self.assertEqual(attendance.status, 'present')

    def test_does_not_change_late_status(self):
        """Test that late attendance is not changed"""
        today = timezone.localdate()

        # Create a late attendance record
        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status='late',
            season=self.season
        )

        # Run the cron job
        mark_absent_daily()

        # Refresh from database
        attendance.refresh_from_db()

        # Status should still be late
        self.assertEqual(attendance.status, 'late')

    def test_only_affects_todays_records(self):
        """Test that only today's records are affected"""
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        # Create attendance for yesterday (should not be affected)
        yesterday_attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=yesterday,
            status='pending',
            season=self.season
        )

        # Create another instructor for today
        user2 = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='testpass123',
            first_name='Test2',
            last_name='Instructor2',
            dob='1991-01-01',
            gender='male'
        )
        instructor2 = Instructor.objects.create(
            user=user2,
            monthly_salary=4000.00
        )

        today_attendance = InstructorAttendance.objects.create(
            instructor=instructor2,
            date=today,
            status='pending',
            season=self.season
        )

        # Run the cron job
        mark_absent_daily()

        # Refresh from database
        yesterday_attendance.refresh_from_db()
        today_attendance.refresh_from_db()

        # Yesterday's should still be pending
        self.assertEqual(yesterday_attendance.status, 'pending')
        # Today's should be absent
        self.assertEqual(today_attendance.status, 'absent')

    def test_cron_log_is_created(self):
        """Test that a cron log entry is created"""
        mark_absent_daily()

        log = AttendanceCronLog.objects.filter(
            job_name='mark_absent_daily'
        ).first()

        self.assertIsNotNone(log)
        self.assertIn('Marked', log.details)
        self.assertIn('ABSENT', log.details)

    def test_cron_log_shows_correct_count(self):
        """Test that the cron log shows the correct count of updated records"""
        today = timezone.localdate()

        # Create multiple pending records
        user2 = CustomUser.objects.create_user(
            phone_number1='+201000000003',
            password='pass',
            first_name='Test3',
            last_name='Instructor3',
            dob='1992-01-01',
            gender='male'
        )
        instructor2 = Instructor.objects.create(user=user2, monthly_salary=3000)

        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status='pending',
            season=self.season
        )
        InstructorAttendance.objects.create(
            instructor=instructor2,
            date=today,
            status='not_started',
            season=self.season
        )

        # Run the cron job
        mark_absent_daily()

        log = AttendanceCronLog.objects.filter(
            job_name='mark_absent_daily'
        ).first()

        self.assertIn('2', log.details)  # Should mention 2 instructors marked absent
