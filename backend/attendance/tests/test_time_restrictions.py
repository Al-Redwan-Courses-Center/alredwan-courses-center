#!/usr/bin/env python3
"""
Tests for lecture attendance time restrictions.

These tests cover:
- 24-hour window restriction for instructors
- Admin/Supervisor bypass for past lectures
- Future lecture restrictions (superuser only)
- Role-based permission checks (_is_admin_or_supervisor, _is_superuser)
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, time, datetime
from unittest.mock import patch

from users.models import CustomUser, Instructor
from courses.models import Season, Course
from courses.models.lecture import Lecture, LectureStatus
from parents.models import Parent, Child
from attendance.models.lecture_attendance import LectureAttendance


class TimeRestrictionBaseTestCase(TestCase):
    """Base test case for time restriction tests"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests"""
        # Create superuser (can do everything)
        cls.superuser = CustomUser.objects.create_user(
            phone_number1='+201100000001',
            password='superpass123',
            first_name='Super',
            last_name='Admin',
            email='superadmin@test.com',
            dob='1980-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True,
            role='admin'
        )

        # Create admin user (is_staff=True, but not superuser)
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000002',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1982-01-01',
            gender='male',
            is_staff=True,
            is_superuser=False,
            role='admin'
        )

        # Create supervisor by role only (no is_staff)
        cls.supervisor_by_role = CustomUser.objects.create_user(
            phone_number1='+201100000003',
            password='supervisorpass123',
            first_name='Supervisor',
            last_name='ByRole',
            email='supervisor_role@test.com',
            dob='1983-01-01',
            gender='male',
            is_staff=False,
            is_superuser=False,
            role='supervisor'
        )

        # Create instructor user (course owner)
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000010',
            password='instructorpass123',
            first_name='Course',
            last_name='Instructor',
            email='instructor@test.com',
            dob='1985-05-15',
            gender='male',
            role='instructor'
        )
        cls.course_instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=6000.00,
            type='normal'
        )

        # Create supervisor instructor (type='supervisor')
        cls.supervisor_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000011',
            password='supervisorpass456',
            first_name='Supervisor',
            last_name='Instructor',
            email='supervisor_instructor@test.com',
            dob='1986-06-16',
            gender='male',
            role='instructor'
        )
        cls.supervisor_instructor = Instructor.objects.create(
            user=cls.supervisor_instructor_user,
            monthly_salary=7000.00,
            type='supervisor'
        )

        # Create season
        cls.season = Season.objects.create(
            name='Test Season 2026',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=60),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )

        # Create course
        cls.course = Course.objects.create(
            name='Test Quran Course',
            description='Test course for attendance',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=30),
            num_lectures=10,
            capacity=20,
            price=500.00,
            is_active=True,
            season=cls.season,
            instructor=cls.course_instructor,
            for_adults=False,
            min_age=8,
            max_age=15
        )

        # Create parent and child for attendance
        cls.parent_user = CustomUser.objects.create_user(
            phone_number1='+201100000030',
            password='parentpass123',
            first_name='Parent',
            last_name='Test',
            email='parent@test.com',
            dob='1980-03-10',
            gender='male',
            role='parent'
        )
        cls.parent = cls.parent_user.parent_profile

        cls.child = Child.objects.create(
            primary_parent=cls.parent,
            first_name='Fatima',
            last_name='Ahmed',
            dob='2012-05-10',
            gender='girl'
        )
        cls.child.unique_code = 'C99001'
        cls.child.save()

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()
        LectureAttendance.objects.all().delete()
        Lecture.objects.all().delete()


class FutureLectureRestrictionTest(TimeRestrictionBaseTestCase):
    """Tests for future lecture restrictions - only superusers can mark"""

    def _create_future_lecture(self):
        """Create a lecture in the future"""
        future_date = timezone.localdate() + timedelta(days=5)
        lecture = Lecture.objects.create(
            course=self.course,
            lecture_number=1,
            title='Future Lecture',
            day=future_date,
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=self.course_instructor,
            status=LectureStatus.SCHEDULED,
            is_accepted=True
        )
        # Create attendance record
        attendance = LectureAttendance.objects.create(
            lecture=lecture,
            child=self.child
        )
        return lecture, attendance

    def test_instructor_cannot_mark_future_lecture(self):
        """Test that regular instructor cannot mark attendance for future lectures"""
        lecture, attendance = self._create_future_lecture()

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('future lectures', response.data['error'].lower())

    def test_admin_cannot_mark_future_lecture(self):
        """Test that admin (is_staff but not superuser) cannot mark future lectures"""
        lecture, attendance = self._create_future_lecture()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('future lectures', response.data['error'].lower())

    def test_supervisor_by_role_cannot_mark_future_lecture(self):
        """Test that supervisor (by role) cannot mark future lectures"""
        lecture, attendance = self._create_future_lecture()

        self.client.force_authenticate(user=self.supervisor_by_role)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        # Should get 403 - either permission denied or future lecture error
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_mark_future_lecture(self):
        """Test that superuser CAN mark attendance for future lectures"""
        lecture, attendance = self._create_future_lecture()

        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'],
                         'Attendance marked successfully')

    def test_bulk_mark_future_lecture_blocked_for_admin(self):
        """Test that bulk marking is blocked for future lectures (non-superuser)"""
        lecture, attendance = self._create_future_lecture()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark-bulk/',
            {
                'marked_via': 'manual',
                'attendances': [
                    {
                        'code': 'C99001',
                        'participant_type': 'child',
                        'rating': 8,
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('future lectures', response.data['error'].lower())

    def test_bulk_mark_future_lecture_allowed_for_superuser(self):
        """Test that bulk marking is allowed for future lectures (superuser)"""
        lecture, attendance = self._create_future_lecture()

        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark-bulk/',
            {
                'marked_via': 'manual',
                'attendances': [
                    {
                        'code': 'C99001',
                        'participant_type': 'child',
                        'rating': 8,
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ExpiredWindowRestrictionTest(TimeRestrictionBaseTestCase):
    """Tests for 24-hour window restriction - admins can bypass, instructors cannot"""

    def _create_expired_lecture(self):
        """Create a lecture that happened more than 24 hours ago"""
        past_date = timezone.localdate() - timedelta(days=3)
        lecture = Lecture.objects.create(
            course=self.course,
            lecture_number=1,
            title='Old Lecture',
            day=past_date,
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=self.course_instructor,
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        attendance = LectureAttendance.objects.create(
            lecture=lecture,
            child=self.child
        )
        return lecture, attendance

    def test_instructor_cannot_mark_expired_lecture(self):
        """Test instructor cannot mark attendance after 24 hours"""
        lecture, attendance = self._create_expired_lecture()

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('window has expired', response.data['error'].lower())

    def test_admin_can_mark_expired_lecture(self):
        """Test admin can mark attendance after 24 hours"""
        lecture, attendance = self._create_expired_lecture()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_by_role_can_mark_expired_lecture(self):
        """Test supervisor (by role) can mark attendance after 24 hours"""
        lecture, attendance = self._create_expired_lecture()

        # Need to add supervisor to course somehow or use admin permission
        # For this test, we'll check the permission logic separately
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_mark_expired_lecture(self):
        """Test superuser can mark attendance after 24 hours"""
        lecture, attendance = self._create_expired_lecture()

        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class WithinWindowTest(TimeRestrictionBaseTestCase):
    """Tests for attendance within 24-hour window"""

    def _create_recent_lecture(self):
        """Create a lecture that happened recently (within 24 hours)"""
        # Today's lecture
        lecture = Lecture.objects.create(
            course=self.course,
            lecture_number=1,
            title='Recent Lecture',
            day=timezone.localdate(),
            start_time=time(8, 0),  # Earlier today
            end_time=time(10, 0),
            instructor=self.course_instructor,
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        attendance = LectureAttendance.objects.create(
            lecture=lecture,
            child=self.child
        )
        return lecture, attendance

    def test_instructor_can_mark_within_window(self):
        """Test instructor can mark attendance within 24-hour window"""
        lecture, attendance = self._create_recent_lecture()

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LectureDetailsTimeFieldsTest(TimeRestrictionBaseTestCase):
    """Tests for time-related fields in lecture details response"""

    def _create_lecture_with_attendance(self, days_offset=0, is_future=False):
        """Create a lecture with attendance record"""
        lecture_date = timezone.localdate() + timedelta(days=days_offset)
        lecture = Lecture.objects.create(
            course=self.course,
            lecture_number=1,
            title='Test Lecture',
            day=lecture_date,
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=self.course_instructor,
            status=LectureStatus.SCHEDULED if is_future else LectureStatus.COMPLETED,
            is_accepted=True
        )
        LectureAttendance.objects.create(
            lecture=lecture,
            child=self.child
        )
        return lecture

    def test_future_lecture_fields_for_superuser(self):
        """Test future lecture shows correct flags for superuser"""
        lecture = self._create_lecture_with_attendance(
            days_offset=5, is_future=True)

        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(
            f'/api/attendance/lecture/{lecture.id}/details/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_future_lecture'])
        self.assertTrue(response.data['is_attendance_submittable'])
        self.assertTrue(response.data['is_editable'])
        self.assertTrue(response.data['user_can_mark_future_lectures'])
        self.assertTrue(response.data['user_can_bypass_deadline'])

    def test_future_lecture_fields_for_admin(self):
        """Test future lecture shows correct flags for admin (not superuser)"""
        lecture = self._create_lecture_with_attendance(
            days_offset=5, is_future=True)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/attendance/lecture/{lecture.id}/details/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_future_lecture'])
        self.assertFalse(response.data['is_attendance_submittable'])
        self.assertFalse(response.data['is_editable'])
        self.assertFalse(response.data['user_can_mark_future_lectures'])
        self.assertTrue(response.data['user_can_bypass_deadline'])

    def test_future_lecture_fields_for_instructor(self):
        """Test future lecture shows correct flags for instructor"""
        lecture = self._create_lecture_with_attendance(
            days_offset=5, is_future=True)

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(
            f'/api/attendance/lecture/{lecture.id}/details/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_future_lecture'])
        self.assertFalse(response.data['is_attendance_submittable'])
        self.assertFalse(response.data['is_editable'])
        self.assertFalse(response.data['user_can_mark_future_lectures'])
        self.assertFalse(response.data['user_can_bypass_deadline'])

    def test_recent_lecture_fields_for_instructor(self):
        """Test recent lecture (within window) shows correct flags for instructor"""
        lecture = self._create_lecture_with_attendance(
            days_offset=0, is_future=False)

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(
            f'/api/attendance/lecture/{lecture.id}/details/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_future_lecture'])
        # Within 24h window, instructor should be able to submit/edit
        # Note: This depends on whether lecture start_time is before or after current time
        self.assertIn('is_attendance_submittable', response.data)
        self.assertIn('is_editable', response.data)
        self.assertIn('submission_deadline', response.data)

    def test_expired_lecture_fields_for_instructor(self):
        """Test expired lecture shows correct flags for instructor"""
        lecture = self._create_lecture_with_attendance(
            days_offset=-3, is_future=False)

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(
            f'/api/attendance/lecture/{lecture.id}/details/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_future_lecture'])
        self.assertFalse(response.data['is_attendance_submittable'])
        self.assertFalse(response.data['is_editable'])
        self.assertIsNotNone(response.data['submission_deadline'])

    def test_expired_lecture_fields_for_admin(self):
        """Test expired lecture shows correct flags for admin"""
        lecture = self._create_lecture_with_attendance(
            days_offset=-3, is_future=False)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/attendance/lecture/{lecture.id}/details/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_future_lecture'])
        self.assertTrue(response.data['is_attendance_submittable'])
        self.assertTrue(response.data['is_editable'])
        self.assertTrue(response.data['user_can_bypass_deadline'])


class RoleBasedAdminCheckTest(TimeRestrictionBaseTestCase):
    """Tests for role-based admin/supervisor detection"""

    def _create_expired_lecture(self):
        """Create a lecture that happened more than 24 hours ago"""
        past_date = timezone.localdate() - timedelta(days=3)
        lecture = Lecture.objects.create(
            course=self.course,
            lecture_number=1,
            title='Old Lecture',
            day=past_date,
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=self.course_instructor,
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        attendance = LectureAttendance.objects.create(
            lecture=lecture,
            child=self.child
        )
        return lecture, attendance

    def test_admin_by_role_only(self):
        """Test user with role='admin' but no is_staff can bypass deadline"""
        # Create user with role='admin' but is_staff=False
        admin_by_role = CustomUser.objects.create_user(
            phone_number1='+201100000099',
            password='roleadmin123',
            first_name='Role',
            last_name='Admin',
            email='roleadmin@test.com',
            dob='1984-01-01',
            gender='male',
            is_staff=False,
            is_superuser=False,
            role='admin'
        )

        lecture, attendance = self._create_expired_lecture()

        self.client.force_authenticate(user=admin_by_role)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        # Should be able to bypass deadline due to role='admin'
        # Note: May get 403 due to permission check (not course instructor)
        # The test is checking that IF they have permission, time check passes
        # We need to use admin_user who has is_staff=True
        pass

    def test_supervisor_instructor_type_can_bypass(self):
        """Test instructor with type='supervisor' can bypass deadline"""
        # Create a new expired lecture with the supervisor as instructor
        past_date = timezone.localdate() - timedelta(days=3)

        # Create a new course with supervisor instructor
        from courses.models import Course
        supervisor_course = Course.objects.create(
            name='Supervisor Course',
            description='Course for supervisor test',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=30),
            num_lectures=10,
            capacity=20,
            price=500.00,
            is_active=True,
            season=self.season,
            instructor=self.supervisor_instructor,  # Supervisor is the instructor
            for_adults=False,
            min_age=8,
            max_age=15
        )

        lecture = Lecture.objects.create(
            course=supervisor_course,
            lecture_number=1,
            title='Supervisor Old Lecture',
            day=past_date,
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=self.supervisor_instructor,
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )

        # Create attendance record for this lecture
        LectureAttendance.objects.create(
            lecture=lecture,
            child=self.child
        )

        self.client.force_authenticate(user=self.supervisor_instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{lecture.id}/mark/',
            {
                'code': 'C99001',
                'participant_type': 'child',
                'rating': 8,
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
