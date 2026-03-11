#!/usr/bin/env python3
"""
Tests for attendance API views - Fingerprint device integration and admin dashboard

These tests cover:
- Fingerprint check-in/check-out endpoints
- Admin dashboard endpoints
- Rating functionality
- Manual check-in/check-out
- Attendance listing and filtering
- Lecture attendance marking (single and bulk)
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, time
from decimal import Decimal

from users.models import CustomUser, Instructor
from courses.models import Season, Course, Tag
from courses.models.lecture import Lecture, LectureStatus
from parents.models import Parent, Child
from attendance.models import (
    InstructorAttendance,
    SupervisorSchedule,
    AttendanceDevice,
    AttendanceStatus,
    AttendanceType,
    CheckInMethod,
)
from attendance.models.lecture_attendance import LectureAttendance


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


class LectureAttendanceBaseTestCase(BaseAPITestCase):
    """Base test case for lecture attendance with additional setup"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for lecture attendance tests"""
        super().setUpTestData()

        # Create instructor user
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000010',
            password='instructorpass123',
            first_name='Course',
            last_name='Instructor',
            email='instructor@test.com',
            dob='1985-05-15',
            gender='male'
        )
        cls.course_instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=6000.00,
            type='normal'
        )

        # Create another instructor user (for permission tests)
        cls.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000011',
            password='instructorpass456',
            first_name='Other',
            last_name='Instructor',
            email='other@test.com',
            dob='1986-06-16',
            gender='male'
        )
        cls.other_instructor = Instructor.objects.create(
            user=cls.other_instructor_user,
            monthly_salary=6000.00,
            type='normal'
        )

        # Create course
        cls.course = Course.objects.create(
            name='Test Quran Course',
            description='Test course for attendance',
            start_date=timezone.localdate() - timedelta(days=7),
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

        # Create another course for permission tests
        cls.other_course = Course.objects.create(
            name='Other Course',
            description='Another test course',
            start_date=timezone.localdate() - timedelta(days=7),
            end_date=timezone.localdate() + timedelta(days=30),
            num_lectures=10,
            capacity=20,
            price=500.00,
            is_active=True,
            season=cls.season,
            instructor=cls.other_instructor,
            for_adults=False,
            min_age=8,
            max_age=15
        )

        # Create lecture - use COMPLETED status to avoid past date validation
        cls.lecture = Lecture.objects.create(
            course=cls.course,
            lecture_number=1,
            title='Test Lecture 1',
            day=timezone.localdate(),
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=cls.course_instructor,
            status=LectureStatus.COMPLETED,  # Use COMPLETED to allow past dates
            is_accepted=True
        )

        # Create lecture for other course
        cls.other_lecture = Lecture.objects.create(
            course=cls.other_course,
            lecture_number=1,
            title='Other Lecture 1',
            day=timezone.localdate(),
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=cls.other_instructor,
            status=LectureStatus.COMPLETED,  # Use COMPLETED to allow past dates
            is_accepted=True
        )

        # Create student user
        cls.student_user = CustomUser.objects.create_user(
            phone_number1='+201000000020',
            password='studentpass123',
            first_name='Ahmed',
            last_name='Ali',
            email='student@test.com',
            dob='2010-01-15',
            gender='male',
            role='student'
        )
        # StudentUser is auto-created by signal, just get it
        cls.student = cls.student_user.student_profile
        # Set the unique_code manually for testing
        cls.student.unique_code = 'M64793'
        cls.student.save()

        # Create another student
        cls.student_user2 = CustomUser.objects.create_user(
            phone_number1='+201000000021',
            password='studentpass456',
            first_name='Mohammed',
            last_name='Hassan',
            email='student2@test.com',
            dob='2011-02-20',
            gender='male',
            role='student'
        )
        # StudentUser is auto-created by signal, just get it
        cls.student2 = cls.student_user2.student_profile
        # Set the unique_code manually for testing
        cls.student2.unique_code = 'M54321'
        cls.student2.save()

        # Create parent user
        cls.parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000030',
            password='parentpass123',
            first_name='Parent',
            last_name='Test',
            email='parent@test.com',
            dob='1980-03-10',
            gender='male',
            role='parent'
        )
        # Parent is auto-created by signal, just get it
        cls.parent = cls.parent_user.parent_profile

        # Create child with correct field name
        cls.child = Child.objects.create(
            primary_parent=cls.parent,
            first_name='Fatima',
            last_name='Ahmed',
            dob='2012-05-10',
            gender='girl'
        )
        # Set the code manually for testing
        cls.child.unique_code = 'C12345'
        cls.child.save()

        # Create another child
        cls.child2 = Child.objects.create(
            primary_parent=cls.parent,
            first_name='Sara',
            last_name='Ahmed',
            dob='2013-06-15',
            gender='girl'
        )
        # Set the code manually for testing
        cls.child2.unique_code = 'C67890'
        cls.child2.save()

    def setUp(self):
        """Set up for each test"""
        super().setUp()
        LectureAttendance.objects.all().delete()


class LectureAttendanceMarkSingleAPITest(LectureAttendanceBaseTestCase):
    """Tests for marking single lecture attendance"""

    def test_mark_attendance_success_as_admin(self):
        """Test successful attendance marking by admin"""
        # Create attendance record
        attendance = LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 8,
                'notes': 'Good performance today'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'],
                         'Attendance marked successfully')
        self.assertEqual(response.data['lecture_id'], self.lecture.id)
        self.assertIsNotNone(response.data['attendance'])
        self.assertEqual(response.data['attendance']['rating'], 8)
        self.assertTrue(response.data['attendance']['present'])
        self.assertEqual(response.data['attendance']
                         ['notes'], 'Good performance today')

        # Verify database
        attendance.refresh_from_db()
        self.assertTrue(attendance.present)
        self.assertEqual(attendance.rating, 8)
        self.assertEqual(attendance.marked_by, self.admin_user)
        self.assertIsNotNone(attendance.marked_at)

    def test_mark_attendance_success_as_course_instructor(self):
        """Test successful attendance marking by course instructor"""
        # Create attendance record
        attendance = LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 9,
                'notes': 'Excellent work'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'],
                         'Attendance marked successfully')

        # Verify database
        attendance.refresh_from_db()
        self.assertTrue(attendance.present)
        self.assertEqual(attendance.rating, 9)
        self.assertEqual(attendance.marked_by, self.instructor_user)

    def test_mark_attendance_success_as_supervisor(self):
        """Test that supervisors can mark attendance for any course"""
        # Create supervisor
        supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201000000099',
            password='supervisorpass123',
            first_name='Super',
            last_name='Visor',
            email='supervisor@test.com',
            dob='1984-04-14',
            gender='male'
        )
        supervisor = Instructor.objects.create(
            user=supervisor_user,
            monthly_salary=8000.00,
            type='supervisor'
        )

        # Create attendance record
        attendance = LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=supervisor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 9,
                'notes': 'Supervisor marked attendance'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'],
                         'Attendance marked successfully')

        # Verify database
        attendance.refresh_from_db()
        self.assertTrue(attendance.present)
        self.assertEqual(attendance.rating, 9)
        self.assertEqual(attendance.marked_by, supervisor_user)

    def test_mark_attendance_forbidden_for_other_instructor(self):
        """Test that other instructors cannot mark attendance"""
        # Create attendance record
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=self.other_instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 8,
                'notes': 'Good'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Error can come from permission check ('error' key) or time window check ('non_field_errors')
        self.assertTrue(
            'error' in response.data or 'non_field_errors' in response.data or 'detail' in response.data,
            f"Expected error response but got: {response.data}"
        )

    def test_mark_attendance_forbidden_for_regular_user(self):
        """Test that regular users cannot mark attendance"""
        # Create attendance record
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 8,
                'notes': 'Good'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_attendance_requires_authentication(self):
        """Test that authentication is required"""
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 8
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_attendance_lecture_not_found(self):
        """Test marking attendance for non-existent lecture"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            '/api/attendance/lecture/99999/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 8
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_attendance_student_not_found(self):
        """Test marking attendance for non-existent student"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M99999',
                'participant_type': 'student',
                'rating': 8
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # The error is returned in non_field_errors, not 'code'
        self.assertIn('non_field_errors', response.data)
        self.assertIn('not found', str(
            response.data['non_field_errors'][0]).lower())

    def test_mark_attendance_no_record_exists(self):
        """Test marking attendance when no record exists"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 8
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_mark_attendance_invalid_rating(self):
        """Test marking attendance with invalid rating"""
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=self.admin_user)

        # Rating too high
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 15
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Rating too low
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student',
                'rating': 0
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_attendance_missing_required_fields(self):
        """Test marking attendance with missing required fields"""
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student
        )

        self.client.force_authenticate(user=self.admin_user)

        # Missing code
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'participant_type': 'student',
                'rating': 8
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing rating
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'M64793',
                'participant_type': 'student'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_attendance_for_child(self):
        """Test marking attendance for a child"""
        # Create attendance record for child
        attendance = LectureAttendance.objects.create(
            lecture=self.lecture,
            child=self.child
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark/',
            {
                'code': 'C12345',
                'participant_type': 'child',
                'rating': 10,
                'notes': 'Outstanding participation'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['attendance']['rating'], 10)

        # Verify database
        attendance.refresh_from_db()
        self.assertTrue(attendance.present)
        self.assertEqual(attendance.rating, 10)


class LectureAttendanceBulkMarkAPITest(LectureAttendanceBaseTestCase):
    """Tests for bulk lecture attendance marking"""

    def test_bulk_mark_all_successful_as_admin(self):
        """Test successful bulk attendance marking by admin"""
        # Create attendance records
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student2)
        LectureAttendance.objects.create(
            lecture=self.lecture, child=self.child)
        LectureAttendance.objects.create(
            lecture=self.lecture, child=self.child2)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'marked_via': 'qr_scan',
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'notes': 'Good performance',
                        'present': True
                    },
                    {
                        'code': 'M54321',
                        'participant_type': 'student',
                        'rating': 7,
                        'notes': 'Needs improvement',
                        'present': True
                    },
                    {
                        'code': 'C12345',
                        'participant_type': 'child',
                        'rating': 9,
                        'notes': 'Excellent',
                        'present': True
                    },
                    {
                        'code': 'C67890',
                        'participant_type': 'child',
                        'rating': 10,
                        'notes': 'Outstanding',
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'],
                         'Bulk attendance marking completed')
        self.assertEqual(response.data['summary']['total_received'], 4)
        self.assertEqual(response.data['summary']['successful'], 4)
        self.assertEqual(response.data['summary']['failed'], 0)
        self.assertEqual(response.data['summary']['marked_via'], 'qr_scan')
        self.assertEqual(len(response.data['successful_records']), 4)
        self.assertEqual(len(response.data['failed_records']), 0)

    def test_bulk_mark_success_as_course_instructor(self):
        """Test successful bulk marking by course instructor"""
        # Create attendance records
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)
        LectureAttendance.objects.create(
            lecture=self.lecture, child=self.child)

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'marked_via': 'manual',
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    },
                    {
                        'code': 'C12345',
                        'participant_type': 'child',
                        'rating': 9,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['successful'], 2)

    def test_bulk_mark_success_as_supervisor(self):
        """Test that supervisors can bulk mark attendance for any course"""
        # Create supervisor
        supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201000000098',
            password='supervisorpass123',
            first_name='Super',
            last_name='Visor',
            email='supervisor2@test.com',
            dob='1984-04-14',
            gender='male'
        )
        supervisor = Instructor.objects.create(
            user=supervisor_user,
            monthly_salary=8000.00,
            type='supervisor'
        )

        # Create attendance records
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)
        LectureAttendance.objects.create(
            lecture=self.lecture, child=self.child)

        self.client.force_authenticate(user=supervisor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'marked_via': 'qr_scan',
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    },
                    {
                        'code': 'C12345',
                        'participant_type': 'child',
                        'rating': 9,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['successful'], 2)
        self.assertEqual(
            response.data['summary']['marked_by'], supervisor_user.get_full_name())

    def test_bulk_mark_forbidden_for_other_instructor(self):
        """Test that other instructors cannot bulk mark attendance"""
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)

        self.client.force_authenticate(user=self.other_instructor_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_mark_partial_success(self):
        """Test bulk marking with partial success (some fail)"""
        # Only create attendance for one student
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    },
                    {
                        'code': 'M99999',  # Non-existent student
                        'participant_type': 'student',
                        'rating': 7,
                        'present': True
                    },
                    {
                        'code': 'C88888',  # Non-existent child
                        'participant_type': 'child',
                        'rating': 9,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(response.data['summary']['total_received'], 3)
        self.assertEqual(response.data['summary']['successful'], 1)
        self.assertEqual(response.data['summary']['failed'], 2)
        self.assertEqual(len(response.data['successful_records']), 1)
        self.assertEqual(len(response.data['failed_records']), 2)

    def test_bulk_mark_empty_attendances(self):
        """Test bulk marking with empty attendances array"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': []
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_mark_missing_attendances_field(self):
        """Test bulk marking without attendances field"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'marked_via': 'manual'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_mark_invalid_marked_via(self):
        """Test bulk marking with invalid marked_via"""
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'marked_via': 'invalid_method',
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_mark_lecture_not_found(self):
        """Test bulk marking for non-existent lecture"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            '/api/attendance/lecture/99999/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_bulk_mark_requires_authentication(self):
        """Test that bulk marking requires authentication"""
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bulk_mark_with_notes(self):
        """Test bulk marking with notes for each attendance"""
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student2)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'notes': 'Great participation',
                        'present': True
                    },
                    {
                        'code': 'M54321',
                        'participant_type': 'student',
                        'rating': 7,
                        'notes': 'Could improve focus',
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['successful'], 2)

        # Verify notes were saved
        att1 = LectureAttendance.objects.get(
            lecture=self.lecture, student=self.student)
        att2 = LectureAttendance.objects.get(
            lecture=self.lecture, student=self.student2)
        self.assertEqual(att1.notes, 'Great participation')
        self.assertEqual(att2.notes, 'Could improve focus')

    def test_bulk_mark_absent_attendances(self):
        """Test bulk marking with absent attendances"""
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student2)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 8,
                        'present': True
                    },
                    {
                        'code': 'M54321',
                        'participant_type': 'student',
                        'rating': 1,
                        'notes': 'Absent',
                        'present': False
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['successful'], 2)

        # Verify present/absent status
        att1 = LectureAttendance.objects.get(
            lecture=self.lecture, student=self.student)
        att2 = LectureAttendance.objects.get(
            lecture=self.lecture, student=self.student2)
        self.assertTrue(att1.present)
        self.assertFalse(att2.present)

    def test_bulk_mark_invalid_rating_in_batch(self):
        """Test bulk marking with invalid rating in one item"""
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'attendances': [
                    {
                        'code': 'M64793',
                        'participant_type': 'student',
                        'rating': 15,  # Invalid
                        'present': True
                    }
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_mark_mixed_participants(self):
        """Test bulk marking with mixed students and children"""
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student)
        LectureAttendance.objects.create(
            lecture=self.lecture, student=self.student2)
        LectureAttendance.objects.create(
            lecture=self.lecture, child=self.child)
        LectureAttendance.objects.create(
            lecture=self.lecture, child=self.child2)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/attendance/lecture/{self.lecture.id}/mark-bulk/',
            {
                'marked_via': 'manual',
                'attendances': [
                    {'code': 'M64793', 'participant_type': 'student',
                        'rating': 8, 'present': True},
                    {'code': 'C12345', 'participant_type': 'child',
                        'rating': 9, 'present': True},
                    {'code': 'M54321', 'participant_type': 'student',
                        'rating': 7, 'present': True},
                    {'code': 'C67890', 'participant_type': 'child',
                        'rating': 10, 'present': True}
                ]
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['successful'], 4)
        self.assertEqual(response.data['summary']['failed'], 0)

        # Verify all were marked
        self.assertEqual(LectureAttendance.objects.filter(
            lecture=self.lecture, present=True).count(), 4)


class LectureAttendanceDetailAPITest(LectureAttendanceBaseTestCase):
    """Tests for the lecture attendance detail endpoint"""

    def test_get_details_as_admin_success(self):
        """Test getting lecture attendance details as admin"""
        from django.utils import timezone
        now = timezone.now()

        # Create attendance records
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student,
            present=True,
            rating=8,
            notes='Excellent performance',
            marked_at=now,
            marked_by=self.admin_user
        )
        LectureAttendance.objects.create(
            lecture=self.lecture,
            child=self.child,
            present=True,
            rating=9,
            notes='Very good',
            marked_at=now,
            marked_by=self.admin_user
        )
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student2,
            present=False,
            rating=1,  # Rating is required when present is set
            marked_at=now,
            marked_by=self.admin_user
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['lecture_id'], self.lecture.id)
        self.assertEqual(response.data['lecture_title'], self.lecture.title)
        self.assertEqual(response.data['total_enrolled'], 3)
        self.assertEqual(response.data['present_count'], 2)
        self.assertEqual(response.data['absent_count'], 1)
        self.assertAlmostEqual(
            response.data['attendance_rate'], 66.7, places=1)
        self.assertEqual(len(response.data['attendances']), 3)

    def test_get_details_as_course_instructor_success(self):
        """Test getting lecture attendance details as course instructor"""
        from django.utils import timezone
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student,
            present=True,
            rating=7,
            marked_at=timezone.now(),
            marked_by=self.instructor_user
        )

        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_enrolled'], 1)
        self.assertEqual(len(response.data['attendances']), 1)

    def test_get_details_as_other_instructor_forbidden(self):
        """Test that other instructor cannot view details"""
        from django.utils import timezone
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student,
            present=True,
            rating=5,
            marked_at=timezone.now(),
            marked_by=self.instructor_user
        )

        self.client.force_authenticate(user=self.other_instructor_user)
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_details_unauthenticated(self):
        """Test that unauthenticated users cannot access details"""
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_details_lecture_not_found(self):
        """Test 404 for non-existent lecture"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/attendance/lecture/99999/details/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_details_empty_attendance(self):
        """Test getting details with no attendance records"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_enrolled'], 0)
        self.assertEqual(response.data['present_count'], 0)
        self.assertEqual(response.data['absent_count'], 0)
        self.assertEqual(response.data['attendance_rate'], 0)
        self.assertEqual(len(response.data['attendances']), 0)

    def test_get_details_participant_fields(self):
        """Test that participant fields are correctly returned"""
        from django.utils import timezone
        LectureAttendance.objects.create(
            lecture=self.lecture,
            child=self.child,
            present=True,
            rating=8,
            notes='Test notes',
            marked_via='manual',
            marked_at=timezone.now(),
            marked_by=self.admin_user
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        attendance = response.data['attendances'][0]

        # Check participant fields
        self.assertEqual(attendance['participant_name'], self.child.first_name)
        self.assertEqual(attendance['participant_full_name'],
                         f"{self.child.first_name} {self.child.last_name}")
        self.assertEqual(attendance['participant_type'], 'child')
        self.assertEqual(
            attendance['participant_code'], self.child.unique_code)
        self.assertEqual(attendance['participant_gender'], self.child.gender)
        # Age should be calculated
        self.assertIsNotNone(attendance['participant_age'])
        self.assertTrue(attendance['present'])
        self.assertEqual(attendance['rating'], 8)
        self.assertEqual(attendance['notes'], 'Test notes')
        self.assertEqual(attendance['marked_via'], 'manual')

    def test_get_details_student_participant(self):
        """Test participant fields for a student"""
        from django.utils import timezone
        LectureAttendance.objects.create(
            lecture=self.lecture,
            student=self.student,
            present=True,
            rating=7,
            marked_at=timezone.now(),
            marked_by=self.admin_user
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/attendance/lecture/{self.lecture.id}/details/'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        attendance = response.data['attendances'][0]

        self.assertEqual(attendance['participant_name'],
                         self.student_user.first_name)
        self.assertEqual(attendance['participant_type'], 'student')
        self.assertEqual(
            attendance['participant_code'], self.student.unique_code)
        self.assertEqual(
            attendance['participant_gender'], self.student_user.gender)


class AdminAllAttendanceListAPITest(BaseAPITestCase):
    """Tests for the admin all attendance list endpoint with filters"""

    def setUp(self):
        """Set up test data for all attendance list tests"""
        super().setUp()
        self.url = '/api/attendance/all/'

        # Create a second instructor for filtering tests
        self.instructor2_user = CustomUser.objects.create_user(
            phone_number1='+201000000003',
            password='userpass123',
            first_name='Second',
            last_name='Instructor',
            email='instructor2@test.com',
            dob='1992-01-01',
            gender='female'
        )
        self.instructor2 = Instructor.objects.create(
            user=self.instructor2_user,
            monthly_salary=4500.00,
            type='supervisor',
            fingerprint_id='FP_TEST_002'
        )

        # Create attendance records with different dates and statuses
        today = timezone.localdate()

        # Today - present
        self.attendance_today_present = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today,
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.LECTURE,
            season=self.season,
            check_in_time=timezone.now()
        )

        # Yesterday - late
        self.attendance_yesterday = InstructorAttendance.objects.create(
            instructor=self.instructor,
            date=today - timedelta(days=1),
            status=AttendanceStatus.LATE,
            attendance_type=AttendanceType.SUPERVISION,
            season=self.season,
            check_in_time=timezone.now() - timedelta(days=1)
        )

        # Last week - absent
        self.attendance_last_week = InstructorAttendance.objects.create(
            instructor=self.instructor2,
            date=today - timedelta(days=7),
            status=AttendanceStatus.ABSENT,
            attendance_type=AttendanceType.LECTURE,
            season=self.season
        )

        # With rating
        self.attendance_rated = InstructorAttendance.objects.create(
            instructor=self.instructor2,
            date=today - timedelta(days=2),
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.SUPERVISION,
            season=self.season,
            rating=Decimal('8.50'),
            rated_by=self.admin_user,
            rated_at=timezone.now(),
            check_in_time=timezone.now() - timedelta(days=2)
        )

    def test_list_all_requires_authentication(self):
        """Test that the endpoint requires authentication"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_all_requires_admin(self):
        """Test that only admin users can access the endpoint"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_all_success(self):
        """Test successful listing of all attendance records"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response may be paginated or not depending on settings
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 4)

    def test_filter_by_date_range(self):
        """Test filtering by date range"""
        self.client.force_authenticate(user=self.admin_user)
        today = timezone.localdate()

        # Filter from 3 days ago to today
        response = self.client.get(self.url, {
            'date_from': (today - timedelta(days=3)).isoformat(),
            'date_to': today.isoformat()
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        # Should include today, yesterday, and 2 days ago (rated) but not last week
        self.assertGreaterEqual(len(results), 3)

    def test_filter_by_instructor(self):
        """Test filtering by instructor"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'instructor': str(self.instructor.user.id)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 2)
        for record in results:
            self.assertEqual(record['instructor_name'], 'Regular User')

    def test_filter_by_status(self):
        """Test filtering by status"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'status': 'present'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 2)  # today_present and rated
        for record in results:
            self.assertEqual(record['status'], 'present')

    def test_filter_by_attendance_type(self):
        """Test filtering by attendance type"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'attendance_type': 'supervision'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 2)  # yesterday and rated
        for record in results:
            self.assertEqual(record['attendance_type'], 'supervision')

    def test_filter_by_has_rating_true(self):
        """Test filtering by has_rating=true"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'has_rating': 'true'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        # At least one should have rating 8.50
        rated_records = [r for r in results if r.get('rating') == '8.50']
        self.assertGreaterEqual(len(rated_records), 1)

    def test_filter_by_has_rating_false(self):
        """Test filtering by has_rating=false"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'has_rating': 'false'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        # Not rated: today_present (rating=0), yesterday (rating=0), last_week (rating=null)
        self.assertGreaterEqual(len(results), 3)

    def test_filter_by_checked_in(self):
        """Test filtering by checked_in status"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'checked_in': 'true'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 3)  # today, yesterday, rated
        for record in results:
            self.assertIsNotNone(record['check_in_time'])

    def test_filter_by_rated_by(self):
        """Test filtering by rated_by"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'rated_by': str(self.admin_user.id)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreaterEqual(len(results), 1)
        for record in results:
            self.assertEqual(record['rated_by_name'], 'Admin User')

    def test_combined_filters(self):
        """Test combining multiple filters"""
        self.client.force_authenticate(user=self.admin_user)
        today = timezone.localdate()

        response = self.client.get(self.url, {
            'date_from': (today - timedelta(days=3)).isoformat(),
            'status': 'present',
            'attendance_type': 'supervision'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        # Only rated attendance matches
        self.assertGreaterEqual(len(results), 1)

    def test_response_includes_rated_by_info(self):
        """Test that response includes who rated the attendance"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(self.url, {
            'has_rating': 'true'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(
            response.data, dict) and 'results' in response.data else response.data
        self.assertGreater(len(results), 0)
        # Find the record rated by admin
        admin_rated = [r for r in results if r.get(
            'rated_by_name') == 'Admin User']
        self.assertGreater(len(admin_rated), 0)
        record = admin_rated[0]
        self.assertIn('rated_by', record)
        self.assertIn('rated_by_name', record)
        self.assertIn('rated_at', record)
        self.assertIn('notes', record)
        self.assertEqual(record['rated_by_name'], 'Admin User')
