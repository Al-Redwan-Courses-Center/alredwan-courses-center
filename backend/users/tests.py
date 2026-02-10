#!/usr/bin/env python3
"""Tests for users API endpoints."""
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor, LandingPageInstructor
from courses.models import Tag


class BaseAPITestCase(TestCase):
    """Base test case with common setup for all user API tests."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class."""
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

        # Create regular user
        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='userpass123',
            first_name='Regular',
            last_name='User',
            email='user@test.com',
            dob='1990-01-01',
            gender='male'
        )

        # Create instructor users
        cls.instructor_user1 = CustomUser.objects.create_user(
            phone_number1='+201000000003',
            password='instructor123',
            first_name='أحمد',
            last_name='محمد',
            email='ahmed@test.com',
            dob='1980-01-01',
            gender='male'
        )

        cls.instructor_user2 = CustomUser.objects.create_user(
            phone_number1='+201000000004',
            password='instructor123',
            first_name='فاطمة',
            last_name='علي',
            email='fatima@test.com',
            dob='1985-05-15',
            gender='female'
        )

        cls.instructor_user3 = CustomUser.objects.create_user(
            phone_number1='+201000000005',
            password='instructor123',
            first_name='Ibrahim',
            last_name='Hassan',
            email='ibrahim@test.com',
            dob='1975-03-20',
            gender='male'
        )

        # Create instructors
        cls.instructor1 = Instructor.objects.create(
            user=cls.instructor_user1,
            monthly_salary=5000.00,
            type='normal',
            bio='معلم قرآن كريم ذو خبرة طويلة',
            joined_date=timezone.localdate() - timedelta(days=365)
        )

        cls.instructor2 = Instructor.objects.create(
            user=cls.instructor_user2,
            monthly_salary=6000.00,
            type='supervisor',
            bio='مشرفة تربوية متميزة',
            joined_date=timezone.localdate() - timedelta(days=180)
        )

        cls.instructor3 = Instructor.objects.create(
            user=cls.instructor_user3,
            monthly_salary=5500.00,
            type='normal',
            bio='Experienced Tajweed teacher',
            joined_date=timezone.localdate() - timedelta(days=730)
        )

        # Create tags
        cls.tag_quran = Tag.objects.create(name='قرآن')
        cls.tag_tajweed = Tag.objects.create(name='تجويد')

        # Assign tags to instructors
        cls.instructor1.tags.add(cls.tag_quran)
        cls.instructor3.tags.add(cls.tag_quran, cls.tag_tajweed)

        # Create landing page instructors
        cls.landing_instructor1 = LandingPageInstructor.objects.create(
            instructor=cls.instructor1,
            order=100
        )

        cls.landing_instructor2 = LandingPageInstructor.objects.create(
            instructor=cls.instructor2,
            order=90
        )

    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()


class InstructorListAPITest(BaseAPITestCase):
    """Tests for instructor list endpoint."""

    def test_list_instructors_requires_auth(self):
        """Test that instructor list requires authentication."""
        response = self.client.get('/api/users/instructors/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_instructors_success(self):
        """Test successful listing of instructors."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/users/instructors/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 3)

    def test_filter_by_type(self):
        """Test filtering instructors by type."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/users/instructors/?type=supervisor')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['type'], 'supervisor')

    def test_filter_by_tag(self):
        """Test filtering instructors by tag."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f'/api/users/instructors/?tags={self.tag_quran.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

    def test_search_by_name(self):
        """Test searching instructors by name."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/users/instructors/?search=أحمد')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_search_by_bio(self):
        """Test searching instructors by bio."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/users/instructors/?search=Tajweed')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_ordering_by_joined_date(self):
        """Test ordering instructors by joined date."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/users/instructors/?ordering=joined_date')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # Should be ordered from oldest to newest
        self.assertEqual(len(results), 3)


class InstructorDetailAPITest(BaseAPITestCase):
    """Tests for instructor detail endpoint."""

    def test_get_instructor_detail_public(self):
        """Test that instructor detail is publicly accessible."""
        response = self.client.get(f'/api/users/instructors/{self.instructor1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.instructor1.id)

    def test_get_instructor_detail_includes_tags(self):
        """Test that instructor detail includes tags."""
        response = self.client.get(f'/api/users/instructors/{self.instructor3.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tags', response.data)
        self.assertEqual(len(response.data['tags']), 2)

    def test_get_nonexistent_instructor(self):
        """Test getting a non-existent instructor returns 404."""
        response = self.client.get('/api/users/instructors/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class LandingPageInstructorAPITest(BaseAPITestCase):
    """Tests for landing page instructor endpoint."""

    def test_landing_page_instructors_public(self):
        """Test that landing page instructors is publicly accessible."""
        response = self.client.get('/api/users/landingpageinstructors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_landing_page_instructors_ordered_by_order(self):
        """Test that landing page instructors are ordered by order field."""
        response = self.client.get('/api/users/landingpageinstructors/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        # Default ordering is -order (highest first)
        self.assertGreaterEqual(results[0]['order'], results[1]['order'])

    def test_landing_page_instructors_count(self):
        """Test that only featured instructors are returned."""
        response = self.client.get('/api/users/landingpageinstructors/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # Only 2 instructors are featured
        self.assertEqual(len(results), 2)


class InstructorRatingsAPITest(BaseAPITestCase):
    """Tests for instructor ratings endpoint."""

    def test_ratings_requires_auth(self):
        """Test that ratings endpoint requires authentication."""
        response = self.client.get(f'/api/users/instructors/{self.instructor1.id}/ratings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_ratings_success(self):
        """Test successful retrieval of instructor ratings."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f'/api/users/instructors/{self.instructor1.id}/ratings/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CustomUserModelTest(TestCase):
    """Tests for CustomUser model."""

    def test_create_user_with_phone(self):
        """Test creating a user with phone number."""
        user = CustomUser.objects.create_user(
            phone_number1='+201111111111',
            password='testpass123',
            first_name='Test',
            last_name='User',
            dob='1990-01-01',
            gender='male'
        )
        self.assertEqual(user.phone_number1, '+201111111111')
        self.assertTrue(user.check_password('testpass123'))

    def test_user_get_full_name(self):
        """Test user's get_full_name method."""
        user = CustomUser.objects.create_user(
            phone_number1='+201111111112',
            password='testpass123',
            first_name='محمد',
            last_name='أحمد',
            dob='1990-01-01',
            gender='male'
        )
        self.assertEqual(user.get_full_name(), 'محمد أحمد')


class InstructorModelTest(TestCase):
    """Tests for Instructor model."""

    def test_create_instructor(self):
        """Test creating an instructor."""
        user = CustomUser.objects.create_user(
            phone_number1='+201222222222',
            password='testpass123',
            first_name='Test',
            last_name='Instructor',
            dob='1985-01-01',
            gender='male'
        )
        instructor = Instructor.objects.create(
            user=user,
            monthly_salary=5000.00,
            type='normal'
        )
        self.assertEqual(instructor.user, user)
        self.assertEqual(instructor.type, 'normal')

    def test_instructor_str(self):
        """Test instructor string representation."""
        user = CustomUser.objects.create_user(
            phone_number1='+201222222223',
            password='testpass123',
            first_name='أحمد',
            last_name='محمود',
            dob='1985-01-01',
            gender='male'
        )
        instructor = Instructor.objects.create(
            user=user,
            monthly_salary=5000.00,
            type='supervisor'
        )
        self.assertIn('أحمد', str(instructor))
