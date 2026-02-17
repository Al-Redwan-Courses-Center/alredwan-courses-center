#!/usr/bin/env python3
"""
Comprehensive tests for Today's Lectures API endpoint

This test suite covers:
- Authentication and authorization (instructor, admin, supervisor)
- Role-based data access (instructors see only their own, admins/supervisors see all)
- Data filtering (only today's lectures)
- Response format validation
- Edge cases and performance
"""
from datetime import time, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus


class TodayLecturesAPIBaseTestCase(TestCase):
    """Base test case for today's lectures API endpoint with common setup"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all today's lectures API tests"""
        # Use current time to ensure we create lectures in the future
        now = timezone.now()
        cls.today = now.date()
        cls.yesterday = cls.today - timedelta(days=1)
        cls.tomorrow = cls.today + timedelta(days=1)
        
        # Calculate a safe future time for today's lectures
        current_hour = now.hour
        cls.safe_start_hour = current_hour + 1 if current_hour < 22 else 23
        
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

        # Create instructor 1 user
        cls.instructor1_user = CustomUser.objects.create_user(
            phone_number1='+201000000010',
            password='instructorpass123',
            first_name='John',
            last_name='Doe',
            email='instructor1@test.com',
            dob='1985-05-15',
            gender='male'
        )
        cls.instructor1 = Instructor.objects.create(
            user=cls.instructor1_user,
            monthly_salary=6000.00,
            type='instructor'
        )

        # Create instructor 2 user
        cls.instructor2_user = CustomUser.objects.create_user(
            phone_number1='+201000000011',
            password='instructorpass456',
            first_name='Jane',
            last_name='Smith',
            email='instructor2@test.com',
            dob='1986-06-16',
            gender='female'
        )
        cls.instructor2 = Instructor.objects.create(
            user=cls.instructor2_user,
            monthly_salary=6000.00,
            type='instructor'
        )

        # Create supervisor user
        cls.supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201000000012',
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

        # Create regular user (no instructor profile)
        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000020',
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

        # Create course 1 (instructor1)
        cls.course1 = Course.objects.create(
            name='Python Programming',
            description='Test course 1',
            start_date=cls.today - timedelta(days=7),
            end_date=cls.today + timedelta(days=30),
            num_lectures=10,
            capacity=20,
            price=500.00,
            is_active=True,
            season=cls.season,
            instructor=cls.instructor1,
            for_adults=False,
            min_age=8,
            max_age=15
        )

        # Create course 2 (instructor2)
        cls.course2 = Course.objects.create(
            name='JavaScript Basics',
            description='Test course 2',
            start_date=cls.today - timedelta(days=7),
            end_date=cls.today + timedelta(days=30),
            num_lectures=10,
            capacity=20,
            price=500.00,
            is_active=True,
            season=cls.season,
            instructor=cls.instructor2,
            for_adults=False,
            min_age=8,
            max_age=15
        )

        # Create course 3 (supervisor)
        cls.course3 = Course.objects.create(
            name='Database Systems',
            description='Test course 3',
            start_date=cls.today - timedelta(days=7),
            end_date=cls.today + timedelta(days=30),
            num_lectures=10,
            capacity=20,
            price=500.00,
            is_active=True,
            season=cls.season,
            instructor=cls.supervisor,
            for_adults=False,
            min_age=8,
            max_age=15
        )

    def setUp(self):
        """Set up for each test"""
        self.client = APIClient()
        self.url = '/api/courses/lectures/today/'
        Lecture.objects.all().delete()
    
    def create_lecture_bypass_validation(self, **kwargs):
        """Helper method to create lectures for testing, bypassing validation"""
        lecture = Lecture(**kwargs)
        # Bypass validation by saving directly
        super(Lecture, lecture).save()
        return lecture


class TodayLecturesAuthenticationTest(TodayLecturesAPIBaseTestCase):
    """Tests for authentication and authorization"""

    def test_unauthenticated_user_cannot_access(self):
        """Test that unauthenticated users cannot access the endpoint"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_without_instructor_profile_forbidden(self):
        """Test that regular users without instructor profile get 403"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.data)


class TodayLecturesInstructorTest(TodayLecturesAPIBaseTestCase):
    """Tests for regular instructor access - should see only their own lectures"""

    def test_instructor_gets_only_own_lectures(self):
        """Test that regular instructors only see their own lectures"""
        # Create lectures for both instructors today - use COMPLETED to avoid past validation
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Instructor 1 Morning Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='Instructor 1 Afternoon Lecture',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture3 = self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor2,
            lecture_number=1,
            title='Instructor 2 Lecture',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        # Authenticate as instructor1
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(response.data['user_role'], 'instructor')
        self.assertEqual(response.data['date'], self.today.isoformat())
        
        # Check that only instructor1's lectures are returned - IDs are returned as integers
        lecture_ids = [lecture['id'] for lecture in response.data['lectures']]
        self.assertIn(lecture1.id, lecture_ids)
        self.assertIn(lecture2.id, lecture_ids)
        self.assertNotIn(lecture3.id, lecture_ids)

    def test_instructor_lectures_ordered_by_time(self):
        """Test that lectures are ordered by start_time then lecture_number"""
        # Create lectures in random order - use COMPLETED to avoid past validation
        lecture_afternoon = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=3,
            title='Afternoon',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture_morning = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Morning',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture_noon = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='Noon',
            day=self.today,
            start_time=time(12, 0),
            end_time=time(14, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        
        # Check order
        returned_titles = [lecture['title'] for lecture in response.data['lectures']]
        self.assertEqual(returned_titles, ['Morning', 'Noon', 'Afternoon'])

    def test_instructor_sees_both_accepted_and_pending_lectures(self):
        """Test that instructors see both accepted and pending lectures"""
        accepted_lecture = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Accepted Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        pending_lecture = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='Pending Lecture',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.ADDITIONAL,
            is_accepted=False
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # IDs are returned as integers
        lecture_ids = [lecture['id'] for lecture in response.data['lectures']]
        self.assertIn(accepted_lecture.id, lecture_ids)
        self.assertIn(pending_lecture.id, lecture_ids)

    def test_instructor_only_sees_today_lectures(self):
        """Test that only today's lectures are returned, not past or future"""
        today_lecture = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Today',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        yesterday_lecture = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='Yesterday',
            day=self.yesterday,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        tomorrow_lecture = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=3,
            title='Tomorrow',
            day=self.tomorrow,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.SCHEDULED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['lectures'][0]['title'], 'Today')

    def test_instructor_with_no_lectures_today(self):
        """Test response when instructor has no lectures today"""
        # Create lectures for other days
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Yesterday',
            day=self.yesterday,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='Tomorrow',
            day=self.tomorrow,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.SCHEDULED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['lectures'], [])
        self.assertEqual(response.data['user_role'], 'instructor')
        self.assertEqual(response.data['date'], self.today.isoformat())

    def test_instructor_with_multiple_courses(self):
        """Test instructor with multiple courses on the same day"""
        # Assign instructor1 to course2 as well
        self.course2.instructor = self.instructor1
        self.course2.save()
        
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Course 1 Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor1,
            lecture_number=1,
            title='Course 2 Lecture',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Verify both courses' lectures are returned
        course_names = [lecture['course']['name'] for lecture in response.data['lectures']]
        self.assertIn('Python Programming', course_names)
        self.assertIn('JavaScript Basics', course_names)


class TodayLecturesAdminTest(TodayLecturesAPIBaseTestCase):
    """Tests for admin access - should see all lectures from all instructors"""

    def test_admin_gets_all_lectures(self):
        """Test that admins see all lectures from all instructors"""
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Instructor 1 Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor2,
            lecture_number=1,
            title='Instructor 2 Lecture',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(response.data['user_role'], 'admin/supervisor')
        
        lecture_ids = [str(lecture['id']) for lecture in response.data['lectures']]
        self.assertIn(str(lecture1.id), lecture_ids)
        self.assertIn(str(lecture2.id), lecture_ids)

    def test_admin_sees_lectures_ordered_by_time(self):
        """Test that admin sees all lectures ordered by time"""
        # Create lectures for different instructors at different times
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor2,
            lecture_number=1,
            title='10 AM - Instructor 2',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='9 AM - Instructor 1',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture3 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='2 PM - Instructor 1',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        
        # Check order
        returned_titles = [lecture['title'] for lecture in response.data['lectures']]
        self.assertEqual(returned_titles, [
            '9 AM - Instructor 1',
            '10 AM - Instructor 2',
            '2 PM - Instructor 1'
        ])

    def test_admin_with_no_lectures_today(self):
        """Test admin response when no lectures exist for today"""
        # Create lectures for other days
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Yesterday',
            day=self.yesterday,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['lectures'], [])
        self.assertEqual(response.data['user_role'], 'admin/supervisor')

    def test_admin_with_staff_flag_only(self):
        """Test that user with only is_staff flag gets admin view"""
        staff_user = CustomUser.objects.create_user(
            phone_number1='+201000000030',
            password='staffpass123',
            first_name='Staff',
            last_name='User',
            email='staff@test.com',
            dob='1990-01-01',
            gender='male',
            is_staff=True,
            is_superuser=False
        )
        
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Lecture 1',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor2,
            lecture_number=1,
            title='Lecture 2',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=staff_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_role'], 'admin/supervisor')
        self.assertEqual(response.data['count'], 2)

    def test_admin_with_superuser_flag_only(self):
        """Test that user with only is_superuser flag gets admin view"""
        super_user = CustomUser.objects.create_user(
            phone_number1='+201000000031',
            password='superpass123',
            first_name='Super',
            last_name='User',
            email='super@test.com',
            dob='1990-01-01',
            gender='male',
            is_staff=False,
            is_superuser=True
        )
        
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Lecture 1',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor2,
            lecture_number=1,
            title='Lecture 2',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=super_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_role'], 'admin/supervisor')
        self.assertEqual(response.data['count'], 2)


class TodayLecturesSupervisorTest(TodayLecturesAPIBaseTestCase):
    """Tests for supervisor access - should see all lectures like admins"""

    def test_supervisor_gets_all_lectures(self):
        """Test that supervisors see all lectures like admins"""
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Instructor 1 Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor2,
            lecture_number=1,
            title='Instructor 2 Lecture',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        lecture3 = self.create_lecture_bypass_validation(
            course=self.course3,
            instructor=self.supervisor,
            lecture_number=1,
            title='Supervisor Lecture',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(response.data['user_role'], 'admin/supervisor')
        
        lecture_ids = [str(lecture['id']) for lecture in response.data['lectures']]
        self.assertIn(str(lecture1.id), lecture_ids)
        self.assertIn(str(lecture2.id), lecture_ids)
        self.assertIn(str(lecture3.id), lecture_ids)


class TodayLecturesResponseFormatTest(TodayLecturesAPIBaseTestCase):
    """Tests for response format and data structure"""

    def test_response_contains_required_top_level_fields(self):
        """Test that response contains all required top-level fields"""
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Test Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check top-level fields
        self.assertIn('date', response.data)
        self.assertIn('count', response.data)
        self.assertIn('user_role', response.data)
        self.assertIn('lectures', response.data)
        
        # Verify data types
        self.assertIsInstance(response.data['date'], str)
        self.assertIsInstance(response.data['count'], int)
        self.assertIsInstance(response.data['user_role'], str)
        self.assertIsInstance(response.data['lectures'], list)

    def test_lecture_object_contains_required_fields(self):
        """Test that lecture objects contain all required fields"""
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Test Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check lecture object fields
        lecture_data = response.data['lectures'][0]
        required_fields = [
            'id', 'lecture_number', 'title', 'day', 'scheduled_at',
            'start_time', 'end_time', 'instructor', 'course',
            'status', 'status_display', 'is_accepted', 'attendance_taken',
            'created_at', 'updated_at'
        ]
        for field in required_fields:
            self.assertIn(field, lecture_data, f"Missing field: {field}")

    def test_lecture_with_null_times(self):
        """Test that lectures with null start/end times are handled correctly"""
        lecture = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='No Time Lecture',
            day=self.today,
            start_time=None,
            end_time=None,
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        
        lecture_data = response.data['lectures'][0]
        self.assertIsNone(lecture_data['start_time'])
        self.assertIsNone(lecture_data['end_time'])
        self.assertEqual(lecture_data['title'], 'No Time Lecture')

    def test_instructor_related_data_present(self):
        """Test that instructor information is properly included"""
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Test Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lecture_data = response.data['lectures'][0]
        
        self.assertIn('instructor', lecture_data)
        self.assertIn('id', lecture_data['instructor'])
        self.assertIn('full_name', lecture_data['instructor'])
        # IDs are returned as integers, not strings
        self.assertEqual(self.instructor1.id, lecture_data['instructor']['id'])

    def test_course_related_data_present(self):
        """Test that course information is properly included"""
        self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Test Lecture',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lecture_data = response.data['lectures'][0]
        
        self.assertIn('course', lecture_data)
        self.assertIn('id', lecture_data['course'])
        self.assertIn('name', lecture_data['course'])
        # IDs are returned as integers, not strings
        self.assertEqual(self.course1.id, lecture_data['course']['id'])
        self.assertEqual(self.course1.name, lecture_data['course']['name'])


class TodayLecturesEdgeCasesTest(TodayLecturesAPIBaseTestCase):
    """Tests for edge cases and special scenarios"""

    def test_multiple_lectures_same_time_different_courses(self):
        """Test handling of multiple lectures at the same time for different courses"""
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Course 1',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        # Assign instructor1 to course2 temporarily
        self.course2.instructor = self.instructor1
        self.course2.save()
        
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course2,
            instructor=self.instructor1,
            lecture_number=1,
            title='Course 2 - Same Time',
            day=self.today,
            start_time=time(10, 0),
            end_time=time(12, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_performance_with_many_lectures(self):
        """Test that the endpoint performs well with many lectures"""
        # Create 20 lectures for today
        for i in range(20):
            self.create_lecture_bypass_validation(
                course=self.course1,
                instructor=self.instructor1,
                lecture_number=i + 1,
                title=f'Lecture {i}',
                day=self.today,
                start_time=time(9 + (i % 8), 0),
                end_time=time(10 + (i % 8), 0),
                status=LectureStatus.COMPLETED,
                is_accepted=True
            )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 20)
        self.assertEqual(len(response.data['lectures']), 20)

    def test_mixed_lecture_statuses(self):
        """Test that all lecture statuses are properly returned"""
        statuses = [
            LectureStatus.SCHEDULED,
            LectureStatus.COMPLETED,
            LectureStatus.CANCELLED,
            LectureStatus.ADDITIONAL
        ]
        
        for idx, status_val in enumerate(statuses):
            self.create_lecture_bypass_validation(
                course=self.course1,
                instructor=self.instructor1,
                lecture_number=idx + 1,
                title=f'{status_val} Lecture',
                day=self.today,
                start_time=time(9 + idx, 0),
                end_time=time(10 + idx, 0),
                status=status_val,
                is_accepted=True
            )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 4)
        
        # Verify all statuses are present
        returned_statuses = [lecture['status'] for lecture in response.data['lectures']]
        for status_val in statuses:
            self.assertIn(status_val, returned_statuses)

    def test_lectures_with_attendance_taken(self):
        """Test that lectures with attendance taken are properly indicated"""
        lecture1 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=1,
            title='Attendance Taken',
            day=self.today,
            start_time=time(9, 0),
            end_time=time(11, 0),
            status=LectureStatus.COMPLETED,
            is_accepted=True,
            attendance_taken=True
        )
        lecture2 = self.create_lecture_bypass_validation(
            course=self.course1,
            instructor=self.instructor1,
            lecture_number=2,
            title='Attendance Not Taken',
            day=self.today,
            start_time=time(14, 0),
            end_time=time(16, 0),
            status=LectureStatus.SCHEDULED,
            is_accepted=True,
            attendance_taken=False
        )
        
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        
        # Check attendance_taken flags
        lectures = {lec['title']: lec for lec in response.data['lectures']}
        self.assertTrue(lectures['Attendance Taken']['attendance_taken'])
        self.assertFalse(lectures['Attendance Not Taken']['attendance_taken'])

    def test_empty_response_format(self):
        """Test that empty response has correct format"""
        self.client.force_authenticate(user=self.instructor1_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['lectures'], [])
        self.assertEqual(response.data['user_role'], 'instructor')
        self.assertEqual(response.data['date'], self.today.isoformat())
