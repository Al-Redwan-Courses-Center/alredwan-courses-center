#!/usr/bin/env python3
"""
Base test case class for enrollment API tests.

Provides common setup, fixtures, and helper methods used across
all enrollment endpoint tests.
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from datetime import timedelta, date
from decimal import Decimal

from users.models import CustomUser, Instructor, StudentUser
from parents.models import Parent, Child
from courses.models import Season, Course


class EnrollmentAPIBaseTestCase(TestCase):
    """
    Base test case with common setup for all enrollment API tests.
    
    Sets up:
    - Admin user (role=admin)
    - Supervisor user (role=supervisor)
    - Instructor user + profile (role=instructor)
    - Parent user + profile + child (role=parent)
    - Student user + profile (role=student)
    - Season and Course
    
    Note: The users app has a signal that auto-creates Parent/StudentUser
    profiles when CustomUser is created with role='parent' or 'student'.
    """

    @classmethod
    def setUpTestData(cls):
        """Set up test data shared across all tests in the class."""
        today = timezone.localdate()
        
        # Define date of births
        admin_dob = date(1985, 1, 1)
        supervisor_dob = date(1986, 1, 1)
        instructor_dob = date(1987, 1, 1)
        other_instructor_dob = date(1988, 1, 1)
        parent_dob = date(1980, 1, 1)
        student_dob = date(2000, 1, 1)  # 24+ years old - for adult courses
        other_student_dob = date(2001, 1, 1)
        
        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            dob=admin_dob,
            gender='male',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Create supervisor user
        cls.supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='supervisorpass123',
            first_name='Supervisor',
            last_name='User',
            email='supervisor@test.com',
            dob=supervisor_dob,
            gender='male',
            role='supervisor'
        )
        
        # Create instructor user (role=instructor does NOT auto-create profile)
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000003',
            password='instructorpass123',
            first_name='Instructor',
            last_name='User',
            email='instructor@test.com',
            dob=instructor_dob,
            gender='male',
            role='instructor'
        )
        cls.instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=Decimal('5000.00'),
            type='normal'
        )
        
        # Create another instructor for negative tests
        cls.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000013',
            password='instructorpass123',
            first_name='Other',
            last_name='Instructor',
            email='other_instructor@test.com',
            dob=other_instructor_dob,
            gender='male',
            role='instructor'
        )
        cls.other_instructor = Instructor.objects.create(
            user=cls.other_instructor_user,
            monthly_salary=Decimal('4500.00'),
            type='normal'
        )
        
        # Create parent user - signal auto-creates Parent profile
        cls.parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000004',
            password='parentpass123',
            first_name='Parent',
            last_name='User',
            email='parent@test.com',
            dob=parent_dob,
            gender='male',
            role='parent'
        )
        # Get the auto-created parent profile
        cls.parent = Parent.objects.get(user=cls.parent_user)
        
        # Create child for parent
        cls.child = Child.objects.create(
            primary_parent=cls.parent,
            first_name='Test',
            last_name='Child',
            dob=today - timedelta(days=365 * 10),  # 10 years old
            gender='boy'
        )
        
        # Create student user - signal auto-creates StudentUser profile
        cls.student_user = CustomUser.objects.create_user(
            phone_number1='+201000000005',
            password='studentpass123',
            first_name='Student',
            last_name='User',
            email='student@test.com',
            dob=student_dob,
            gender='male',
            role='student'
        )
        # Get the auto-created student profile
        cls.student = StudentUser.objects.get(user=cls.student_user)
        
        # Create another student for negative tests
        cls.other_student_user = CustomUser.objects.create_user(
            phone_number1='+201000000015',
            password='studentpass123',
            first_name='Other',
            last_name='Student',
            email='other_student@test.com',
            dob=other_student_dob,
            gender='female',
            role='student'
        )
        # Get the auto-created student profile
        cls.other_student = StudentUser.objects.get(user=cls.other_student_user)
        
        # Create season
        cls.season = Season.objects.create(
            name='Test Season 2026',
            season_type='school',
            start_date=today - timedelta(days=30),
            end_date=today + timedelta(days=90),
            is_active=True
        )
        
        # Create course taught by instructor
        cls.course = Course.objects.create(
            name='Test Course',
            description='A test course for API testing',
            season=cls.season,
            instructor=cls.instructor,
            start_date=today,
            end_date=today + timedelta(days=60),
            price=Decimal('500.00'),
            capacity=30,
            is_active=True,
            for_adults=False
        )
        
        # Create another course (for testing cross-course access)
        cls.other_course = Course.objects.create(
            name='Other Test Course',
            description='Another test course',
            season=cls.season,
            instructor=cls.other_instructor,
            start_date=today,
            end_date=today + timedelta(days=60),
            price=Decimal('600.00'),
            capacity=25,
            is_active=True,
            for_adults=True
        )

    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()

    def authenticate_as(self, user):
        """Helper method to authenticate as a specific user."""
        self.client.force_authenticate(user=user)

    def authenticate_as_admin(self):
        """Authenticate as admin user."""
        self.authenticate_as(self.admin_user)

    def authenticate_as_supervisor(self):
        """Authenticate as supervisor user."""
        self.authenticate_as(self.supervisor_user)

    def authenticate_as_instructor(self):
        """Authenticate as instructor user."""
        self.authenticate_as(self.instructor_user)
    
    def authenticate_as_other_instructor(self):
        """Authenticate as the other instructor user."""
        self.authenticate_as(self.other_instructor_user)

    def authenticate_as_parent(self):
        """Authenticate as parent user."""
        self.authenticate_as(self.parent_user)

    def authenticate_as_student(self):
        """Authenticate as student user."""
        self.authenticate_as(self.student_user)
    
    def authenticate_as_other_student(self):
        """Authenticate as other student user."""
        self.authenticate_as(self.other_student_user)

    def logout(self):
        """Clear authentication."""
        self.client.force_authenticate(user=None)
