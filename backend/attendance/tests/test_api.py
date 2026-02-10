#!/usr/bin/env python3
"""
Tests for attendance API views - Fingerprint device integration and admin dashboard

These tests cover:
- Fingerprint check-in/check-out endpoints
- Admin dashboard endpoints
- Rating functionality
- Manual check-in/check-out
- Attendance listing and filtering
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, time
from decimal import Decimal

from users.models import CustomUser, Instructor
from courses.models import Season
from attendance.models import (
    InstructorAttendance,
    SupervisorSchedule,
    AttendanceDevice,
    AttendanceStatus,
    AttendanceType,
    CheckInMethod,
)


class BaseAPITestCase(TestCase):
    """Base test case with common setup for all API tests"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class"""
        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        # Create regular user (not admin)
        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='userpass123',
            first_name='Regular',
            last_name='User',
            email='user@test.com',
            dob='1990-01-01',
            gender='male'
        )

        # Create instructors
        cls.instructor = Instructor.objects.create(
            user=cls.regular_user,
            monthly_salary=5000.00,
            type='normal',
            fingerprint_id='FP_TEST_001'
        )

        # Create season
        cls.season = Season.objects.create(
            name='Test Season 2026',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )

        # Create device
        cls.device = AttendanceDevice.objects.create(
            device_id='DEVICE_TEST_001',
            name='Test Device',
            location='Test Location',
            is_active=True
        )

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()
        InstructorAttendance.objects.all().delete()


class FingerprintCheckInAPITest(BaseAPITestCase):
    """Tests for the fingerprint check-in endpoint"""

    def test_check_in_success(self):
        """Test successful fingerprint check-in"""
        # Create attendance record for today
        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.post('/api/attendance/check-in/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'DEVICE_TEST_001',
            'method': 'fingerprint'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Check-in successful')
        self.assertIn('instructor', response.data)
        self.assertIn('records', response.data)

    def test_check_in_invalid_fingerprint(self):
        """Test check-in with invalid fingerprint ID"""
        response = self.client.post('/api/attendance/check-in/', {
            'fingerprint_id': 'INVALID_FP',
            'device_id': 'DEVICE_TEST_001'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_in_invalid_device(self):
        """Test check-in with invalid device ID"""
        response = self.client.post('/api/attendance/check-in/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'INVALID_DEVICE'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_in_inactive_device(self):
        """Test check-in with inactive device"""
        inactive_device = AttendanceDevice.objects.create(
            device_id='INACTIVE_DEVICE',
            name='Inactive Device',
            is_active=False
        )

        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.post('/api/attendance/check-in/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'INACTIVE_DEVICE'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_in_no_attendance_record(self):
        """Test check-in when no attendance record exists for today"""
        response = self.client.post('/api/attendance/check-in/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'DEVICE_TEST_001'
        })

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_in_already_checked_in(self):
        """Test check-in when already checked in"""
        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            check_in_time=timezone.now() - timedelta(hours=1),
            season=self.season
        )

        response = self.client.post('/api/attendance/check-in/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'DEVICE_TEST_001'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Already checked in')


class FingerprintCheckOutAPITest(BaseAPITestCase):
    """Tests for the fingerprint check-out endpoint"""

    def test_check_out_success(self):
        """Test successful fingerprint check-out"""
        # Create and check-in attendance
        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            check_in_time=timezone.now() - timedelta(hours=4),
            season=self.season
        )

        response = self.client.post('/api/attendance/check-out/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'DEVICE_TEST_001',
            'method': 'fingerprint'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Check-out successful')

    def test_check_out_without_check_in(self):
        """Test check-out without prior check-in"""
        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.post('/api/attendance/check-out/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'DEVICE_TEST_001'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_out_already_checked_out(self):
        """Test check-out when already checked out"""
        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            check_in_time=timezone.now() - timedelta(hours=6),
            check_out_time=timezone.now() - timedelta(hours=1),
            season=self.season
        )

        response = self.client.post('/api/attendance/check-out/', {
            'fingerprint_id': 'FP_TEST_001',
            'device_id': 'DEVICE_TEST_001'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Already checked out')


class TodayAttendanceAPITest(BaseAPITestCase):
    """Tests for today's attendance listing"""

    def test_today_attendance_requires_auth(self):
        """Test that today's attendance requires authentication"""
        response = self.client.get('/api/attendance/today/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_today_attendance_requires_admin(self):
        """Test that today's attendance requires admin user"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/attendance/today/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_today_attendance_success(self):
        """Test successful retrieval of today's attendance"""
        self.client.force_authenticate(user=self.admin_user)

        # Create attendance record
        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.get('/api/attendance/today/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)


class TodaySummaryAPITest(BaseAPITestCase):
    """Tests for today's attendance summary"""

    def test_summary_success(self):
        """Test successful retrieval of summary"""
        self.client.force_authenticate(user=self.admin_user)

        # Create various attendance records
        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            check_in_time=timezone.now(),
            season=self.season
        )

        response = self.client.get('/api/attendance/today/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_expected', response.data)
        self.assertIn('present', response.data)
        self.assertIn('absent', response.data)
        self.assertEqual(response.data['present'], 1)


class RateAttendanceAPITest(BaseAPITestCase):
    """Tests for rating attendance"""

    def test_rate_attendance_success(self):
        """Test successful rating of attendance"""
        self.client.force_authenticate(user=self.admin_user)

        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            season=self.season
        )

        response = self.client.post(f'/api/attendance/{attendance.id}/rate/', {
            'rating': 8.5,
            'notes': 'أداء ممتاز'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['rating']), Decimal('8.5'))

    def test_rate_absent_attendance_fails(self):
        """Test that rating absent attendance fails"""
        self.client.force_authenticate(user=self.admin_user)

        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.ABSENT,
            season=self.season
        )

        response = self.client.post(f'/api/attendance/{attendance.id}/rate/', {
            'rating': 8.5
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rate_out_of_range_fails(self):
        """Test that rating out of range fails"""
        self.client.force_authenticate(user=self.admin_user)

        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            season=self.season
        )

        # Rating too high
        response = self.client.post(f'/api/attendance/{attendance.id}/rate/', {
            'rating': 15.0
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ManualCheckInOutAPITest(BaseAPITestCase):
    """Tests for manual check-in/check-out by admin"""

    def test_manual_check_in_success(self):
        """Test successful manual check-in"""
        self.client.force_authenticate(user=self.admin_user)

        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.post(
            f'/api/attendance/{attendance.id}/manual-check-in/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['check_in_time'])
        self.assertEqual(
            response.data['check_in_method'], CheckInMethod.MANUAL)

    def test_manual_check_out_success(self):
        """Test successful manual check-out"""
        self.client.force_authenticate(user=self.admin_user)

        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.PRESENT,
            check_in_time=timezone.now() - timedelta(hours=4),
            season=self.season
        )

        response = self.client.post(
            f'/api/attendance/{attendance.id}/manual-check-out/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['check_out_time'])

    def test_mark_absent_success(self):
        """Test marking attendance as absent"""
        self.client.force_authenticate(user=self.admin_user)

        attendance = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=timezone.localdate(),
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.post(
            f'/api/attendance/{attendance.id}/mark-absent/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], AttendanceStatus.ABSENT)


class DeviceAPITest(BaseAPITestCase):
    """Tests for device management endpoints"""

    def test_list_devices(self):
        """Test listing devices"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get('/api/attendance/devices/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_device(self):
        """Test creating a new device"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post('/api/attendance/devices/', {
            'device_id': 'NEW_DEVICE_001',
            'name': 'New Test Device',
            'location': 'New Location',
            'is_active': True
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['device_id'], 'NEW_DEVICE_001')


class ScheduleAPITest(BaseAPITestCase):
    """Tests for supervisor schedule management endpoints"""

    def test_list_schedules(self):
        """Test listing schedules"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get('/api/attendance/schedules/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_schedule(self):
        """Test creating a new schedule"""
        self.client.force_authenticate(user=self.admin_user)

        # Create a supervisor instructor
        supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201000000099',
            password='pass123',
            first_name='Test',
            last_name='Supervisor',
            dob='1990-01-01',
            gender='male'
        )
        supervisor = Instructor.objects.create(
            user=supervisor_user,
            monthly_salary=6000.00,
            type='supervisor'
        )

        response = self.client.post('/api/attendance/schedules/', {
            'instructor': supervisor.id,
            'day_of_week': 0,  # Sunday
            'start_time': '08:00:00',
            'end_time': '14:00:00',
            'grace_period_minutes': 15,
            'auto_absent_after_minutes': 60
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class AttendanceByDateAPITest(BaseAPITestCase):
    """Tests for attendance by date endpoint"""

    def test_get_attendance_by_date(self):
        """Test getting attendance for a specific date"""
        self.client.force_authenticate(user=self.admin_user)

        today = timezone.localdate()

        InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status=AttendanceStatus.NOT_STARTED,
            season=self.season
        )

        response = self.client.get(
            f'/api/attendance/date/{today.strftime("%Y-%m-%d")}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_invalid_date_format(self):
        """Test handling of invalid date format"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get('/api/attendance/date/invalid-date/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)


class InstructorHistoryAPITest(BaseAPITestCase):
    """Tests for instructor attendance history"""

    def test_get_instructor_history(self):
        """Test getting attendance history for an instructor"""
        self.client.force_authenticate(user=self.admin_user)

        # Create multiple attendance records
        for i in range(5):
            InstructorAttendance.objects.create(
                instructor=self.instructor,
                date=timezone.localdate() - timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                season=self.season
            )

        response = self.client.get(
            f'/api/attendance/instructor/{self.instructor.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 5)
