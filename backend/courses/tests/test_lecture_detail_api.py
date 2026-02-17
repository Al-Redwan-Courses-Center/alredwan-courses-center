#!/usr/bin/env python3
"""
Tests for lecture detail API endpoint: GET /api/courses/lectures/{id}/

This test suite covers:
- Authentication and permission checks
- Successful retrieval of lecture details
- Response structure validation
- Duration calculation
"""
from datetime import time, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus


class LectureDetailAPITestCase(TestCase):
    """Tests for the lecture detail endpoint: GET /api/courses/lectures/{id}/"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all lecture detail API tests"""
        cls.today = timezone.localdate()

        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        # Create instructor user
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000010',
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

        # Create supervisor user
        cls.supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201100000012',
            password='supervisorpass123',
            first_name='Super',
            last_name='Visor',
            email='supervisor@test.com',
            dob='1984-04-14',
            gender='male'
        )
        cls.supervisor = Instructor.objects.create(
            user=cls.supervisor_user,
            monthly_salary=8000.00,
            type='supervisor'
        )

        # Create regular user (not instructor)
        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201100000020',
            password='regularpass123',
            first_name='Regular',
            last_name='User',
            email='regular@test.com',
            dob='1990-01-01',
            gender='male'
        )

        # Create season
        cls.season = Season.objects.create(
            name='Test Season 2026',
            season_type='school',
            start_date=cls.today - timedelta(days=30),
            end_date=cls.today + timedelta(days=60),
            is_active=True
        )

        # Create course
        cls.course = Course.objects.create(
            name='Test Quran Course',
            description='Test course for lecture detail API',
            start_date=cls.today - timedelta(days=7),
            end_date=cls.today + timedelta(days=30),
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

        # Create lecture
        cls.lecture = Lecture.objects.create(
            course=cls.course,
            lecture_number=1,
            title='Introduction to Tajweed',
            day=cls.today + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 0),
            instructor=cls.course_instructor,
            status=LectureStatus.SCHEDULED,
            is_accepted=True
        )

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()

    def test_get_lecture_detail_requires_authentication(self):
        """Test that getting lecture detail requires authentication"""
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_lecture_detail_as_admin(self):
        """Test getting lecture detail as admin"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.lecture.id)
        self.assertEqual(response.data['title'], 'Introduction to Tajweed')
        self.assertEqual(response.data['lecture_number'], 1)

    def test_get_lecture_detail_as_supervisor(self):
        """Test getting lecture detail as supervisor"""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.lecture.id)

    def test_get_lecture_detail_as_instructor(self):
        """Test getting lecture detail as instructor"""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.lecture.id)

    def test_get_lecture_detail_as_regular_user_forbidden(self):
        """Test that regular users cannot access lecture detail"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_lecture_detail_nonexistent_returns_404(self):
        """Test getting nonexistent lecture returns 404"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/courses/lectures/999999/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lecture_detail_contains_required_fields(self):
        """Test that response contains all required fields"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check required fields
        required_fields = [
            'id', 'lecture_number', 'title', 'day', 'scheduled_at',
            'start_time', 'end_time', 'duration_minutes', 'instructor',
            'course', 'status', 'status_display', 'is_accepted',
            'attendance_taken', 'created_at', 'updated_at'
        ]

        for field in required_fields:
            self.assertIn(field, response.data, f"Missing field: {field}")

    def test_lecture_detail_includes_full_course_info(self):
        """Test that lecture detail includes full course information"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        course_data = response.data['course']
        self.assertIn('id', course_data)
        self.assertIn('name', course_data)
        self.assertIn('description', course_data)
        self.assertIn('capacity', course_data)
        self.assertIn('price', course_data)
        self.assertEqual(course_data['name'], 'Test Quran Course')

    def test_lecture_detail_includes_instructor_info(self):
        """Test that lecture detail includes instructor information"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        instructor_data = response.data['instructor']
        self.assertIn('id', instructor_data)
        self.assertIn('full_name', instructor_data)
        self.assertEqual(instructor_data['id'], self.course_instructor.id)

    def test_lecture_detail_duration_calculation(self):
        """Test that duration_minutes is calculated correctly"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 10:00 to 12:00 = 120 minutes
        self.assertEqual(response.data['duration_minutes'], 120)

    def test_lecture_detail_duration_null_when_no_times(self):
        """Test that duration_minutes is null when start/end times are missing"""
        # Create lecture without times
        lecture_no_times = Lecture.objects.create(
            course=self.course,
            lecture_number=2,
            title='No Time Lecture',
            day=self.today + timedelta(days=2),
            start_time=None,
            end_time=None,
            instructor=self.course_instructor,
            status=LectureStatus.SCHEDULED,
            is_accepted=True
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f'/api/courses/lectures/{lecture_no_times.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['duration_minutes'])

    def test_lecture_detail_scheduled_at_format(self):
        """Test that scheduled_at is in ISO 8601 format"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        scheduled_at = response.data['scheduled_at']
        self.assertIsNotNone(scheduled_at)
        # Should contain date and time with timezone
        self.assertIn('T', scheduled_at)
        self.assertIn('+', scheduled_at)  # Timezone offset

    def test_lecture_detail_status_display_localized(self):
        """Test that status_display returns localized value"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/courses/lectures/{self.lecture.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status_display', response.data)
        self.assertIsNotNone(response.data['status_display'])
