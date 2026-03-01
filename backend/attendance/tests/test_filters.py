#!/usr/bin/env python3
"""
Tests for attendance filters.

Tests cover:
- InstructorAttendanceFilter: gender, instructor_type filters
- LectureAttendanceFilter: gender, participant_type filters
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, date, time
from decimal import Decimal

from users.models import CustomUser, Instructor, StudentUser
from courses.models import Season, Course, Tag, CourseSchedule, Weekday
from courses.models.lecture import Lecture, LectureStatus
from parents.models import Parent, Child
from attendance.models import (
    InstructorAttendance,
    SupervisorSchedule,
    AttendanceDevice,
    AttendanceStatus,
    AttendanceType,
)
from attendance.models.lecture_attendance import LectureAttendance
from attendance.filters import InstructorAttendanceFilter, LectureAttendanceFilter
from enrollments_payments.models.enrollment import Enrollment


class InstructorAttendanceFilterTest(TestCase):
    """Tests for InstructorAttendanceFilter"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class."""
        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        # Create male instructor
        cls.male_user = CustomUser.objects.create_user(
            phone_number1='+201000000002',
            password='pass123',
            first_name='Ahmed',
            last_name='Mohamed',
            dob='1990-01-01',
            gender='male',
            role='instructor'
        )
        cls.male_instructor = Instructor.objects.create(
            user=cls.male_user,
            monthly_salary=Decimal('5000.00'),
            type='normal',
            fingerprint_id='FP_MALE_001'
        )

        # Create female instructor
        cls.female_user = CustomUser.objects.create_user(
            phone_number1='+201000000003',
            password='pass123',
            first_name='Fatima',
            last_name='Ali',
            dob='1992-01-01',
            gender='female',
            role='instructor'
        )
        cls.female_instructor = Instructor.objects.create(
            user=cls.female_user,
            monthly_salary=Decimal('5000.00'),
            type='supervisor',
            fingerprint_id='FP_FEMALE_001'
        )

        # Create season
        cls.season = Season.objects.create(
            name='Test Season 2026',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )

        # Create attendance records
        today = timezone.localdate()
        
        # Male instructor attendance
        cls.male_attendance = InstructorAttendance.objects.create(
            instructor=cls.male_instructor,
            date=today,
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.LECTURE,
            check_in_time=timezone.now() - timedelta(hours=2),
            season=cls.season
        )

        # Female instructor attendance
        cls.female_attendance = InstructorAttendance.objects.create(
            instructor=cls.female_instructor,
            date=today,
            status=AttendanceStatus.LATE,
            attendance_type=AttendanceType.SUPERVISION,
            check_in_time=timezone.now() - timedelta(hours=1),
            season=cls.season
        )

    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

    def test_filter_by_gender_male(self):
        """Test filtering by male gender."""
        qs = InstructorAttendance.objects.all()
        filter_set = InstructorAttendanceFilter(data={'gender': 'male'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertEqual(filtered_qs.first(), self.male_attendance)

    def test_filter_by_gender_female(self):
        """Test filtering by female gender."""
        qs = InstructorAttendance.objects.all()
        filter_set = InstructorAttendanceFilter(data={'gender': 'female'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertEqual(filtered_qs.first(), self.female_attendance)

    def test_filter_by_instructor_type_normal(self):
        """Test filtering by instructor type normal."""
        qs = InstructorAttendance.objects.all()
        filter_set = InstructorAttendanceFilter(data={'instructor_type': 'normal'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertEqual(filtered_qs.first(), self.male_attendance)

    def test_filter_by_instructor_type_supervisor(self):
        """Test filtering by instructor type supervisor."""
        qs = InstructorAttendance.objects.all()
        filter_set = InstructorAttendanceFilter(data={'instructor_type': 'supervisor'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertEqual(filtered_qs.first(), self.female_attendance)

    def test_combined_filters(self):
        """Test combining gender and status filters."""
        qs = InstructorAttendance.objects.all()
        filter_set = InstructorAttendanceFilter(
            data={'gender': 'female', 'status': 'late'},
            queryset=qs
        )
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertEqual(filtered_qs.first(), self.female_attendance)

    def test_api_gender_filter(self):
        """Test gender filter via API endpoint."""
        response = self.client.get('/api/attendance/all/', {'gender': 'male'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that only male instructor attendance is returned
        results = response.data.get('results', response.data)
        if isinstance(results, list):
            self.assertTrue(len(results) >= 1)
            # Verify only male instructor's attendance is returned by checking instructor IDs
            for record in results:
                instructor_id = record.get('instructor')
                # The instructor associated with this attendance should have male gender
                if instructor_id:
                    instructor = Instructor.objects.get(id=instructor_id)
                    self.assertEqual(instructor.user.gender, 'male')


class LectureAttendanceFilterTest(TestCase):
    """Tests for LectureAttendanceFilter"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class."""
        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000010',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        # Create instructor
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000011',
            password='pass123',
            first_name='Instructor',
            last_name='Test',
            dob='1990-01-01',
            gender='male',
            role='instructor'
        )
        cls.instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=Decimal('5000.00'),
            type='normal'
        )

        # Create male student - signal auto-creates StudentUser profile
        cls.male_student_user = CustomUser.objects.create_user(
            phone_number1='+201000000012',
            password='pass123',
            first_name='Mohamed',
            last_name='Ahmed',
            dob='2000-01-01',
            gender='male',
            role='student'
        )
        # StudentUser is auto-created by signal
        cls.male_student = cls.male_student_user.student_profile

        # Create female student - signal auto-creates StudentUser profile
        cls.female_student_user = CustomUser.objects.create_user(
            phone_number1='+201000000013',
            password='pass123',
            first_name='Fatima',
            last_name='Ali',
            dob='2001-01-01',
            gender='female',
            role='student'
        )
        # StudentUser is auto-created by signal
        cls.female_student = cls.female_student_user.student_profile

        # Create parent and children - signal auto-creates Parent profile
        cls.parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000014',
            password='pass123',
            first_name='Parent',
            last_name='Test',
            dob='1980-01-01',
            gender='male',
            role='parent'
        )
        # Parent is auto-created by signal
        cls.parent = cls.parent_user.parent_profile

        cls.boy_child = Child.objects.create(
            primary_parent=cls.parent,
            first_name='Omar',
            last_name='Test',
            dob=date(2015, 5, 10),
            gender='boy'
        )

        cls.girl_child = Child.objects.create(
            primary_parent=cls.parent,
            first_name='Sara',
            last_name='Test',
            dob=date(2016, 8, 20),
            gender='girl'
        )

        # Create season and course
        cls.season = Season.objects.create(
            name='Test Season',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )

        cls.course = Course.objects.create(
            name='Test Course',
            start_date=timezone.localdate(),
            num_lectures=10,
            capacity=20,
            price=Decimal('100.00'),
            season=cls.season,
            instructor=cls.instructor,
            for_adults=True
        )

        # Create lecture - needs to be today or in the future
        cls.lecture = Lecture.objects.create(
            course=cls.course,
            day=timezone.localdate() + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 0),
            lecture_number=1,
            instructor=cls.instructor
        )

        now = timezone.now()

        # Create attendance records
        cls.male_student_attendance = LectureAttendance.objects.create(
            lecture=cls.lecture,
            student=cls.male_student,
            present=True,
            rating=8,
            marked_at=now
        )

        cls.female_student_attendance = LectureAttendance.objects.create(
            lecture=cls.lecture,
            student=cls.female_student,
            present=True,
            rating=9,
            marked_at=now
        )

        cls.boy_child_attendance = LectureAttendance.objects.create(
            lecture=cls.lecture,
            child=cls.boy_child,
            present=False,
            rating=5,
            marked_at=now
        )

        cls.girl_child_attendance = LectureAttendance.objects.create(
            lecture=cls.lecture,
            child=cls.girl_child,
            present=None  # Not marked
        )

    def test_filter_by_gender_male(self):
        """Test filtering by male/boy gender."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'gender': 'male'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        # Should include male student and boy child
        self.assertEqual(filtered_qs.count(), 2)
        self.assertIn(self.male_student_attendance, filtered_qs)
        self.assertIn(self.boy_child_attendance, filtered_qs)

    def test_filter_by_gender_female(self):
        """Test filtering by female/girl gender."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'gender': 'female'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        # Should include female student and girl child
        self.assertEqual(filtered_qs.count(), 2)
        self.assertIn(self.female_student_attendance, filtered_qs)
        self.assertIn(self.girl_child_attendance, filtered_qs)

    def test_filter_by_gender_boy(self):
        """Test filtering with 'boy' keyword (should work same as male)."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'gender': 'boy'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 2)

    def test_filter_by_gender_girl(self):
        """Test filtering with 'girl' keyword (should work same as female)."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'gender': 'girl'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 2)

    def test_filter_by_participant_type_student(self):
        """Test filtering by participant type student."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'participant_type': 'student'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 2)
        self.assertIn(self.male_student_attendance, filtered_qs)
        self.assertIn(self.female_student_attendance, filtered_qs)

    def test_filter_by_participant_type_child(self):
        """Test filtering by participant type child."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'participant_type': 'child'}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 2)
        self.assertIn(self.boy_child_attendance, filtered_qs)
        self.assertIn(self.girl_child_attendance, filtered_qs)

    def test_filter_by_present_true(self):
        """Test filtering by present=true."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'present': True}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 2)
        self.assertIn(self.male_student_attendance, filtered_qs)
        self.assertIn(self.female_student_attendance, filtered_qs)

    def test_filter_by_present_false(self):
        """Test filtering by present=false (absent)."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'present': False}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertIn(self.boy_child_attendance, filtered_qs)

    def test_filter_not_marked(self):
        """Test filtering not marked records."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(data={'not_marked': True}, queryset=qs)
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertIn(self.girl_child_attendance, filtered_qs)

    def test_combined_gender_and_participant_type(self):
        """Test combining gender and participant_type filters."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(
            data={'gender': 'male', 'participant_type': 'student'},
            queryset=qs
        )
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 1)
        self.assertIn(self.male_student_attendance, filtered_qs)

    def test_filter_by_rating_range(self):
        """Test filtering by rating range."""
        qs = LectureAttendance.objects.all()
        filter_set = LectureAttendanceFilter(
            data={'rating_min': 8, 'rating_max': 10},
            queryset=qs
        )
        
        self.assertTrue(filter_set.is_valid())
        filtered_qs = filter_set.qs
        
        self.assertEqual(filtered_qs.count(), 2)
        self.assertIn(self.male_student_attendance, filtered_qs)
        self.assertIn(self.female_student_attendance, filtered_qs)


class InstructorAttendanceAPIFilterTest(TestCase):
    """Tests for InstructorAttendance API with filters"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201000000020',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True
        )

        cls.male_user = CustomUser.objects.create_user(
            phone_number1='+201000000021',
            password='pass123',
            first_name='Ahmed',
            last_name='Test',
            dob='1990-01-01',
            gender='male',
            role='instructor'
        )
        cls.male_instructor = Instructor.objects.create(
            user=cls.male_user,
            monthly_salary=Decimal('5000.00'),
            type='normal'
        )

        cls.female_user = CustomUser.objects.create_user(
            phone_number1='+201000000022',
            password='pass123',
            first_name='Mona',
            last_name='Test',
            dob='1992-01-01',
            gender='female',
            role='instructor'
        )
        cls.female_instructor = Instructor.objects.create(
            user=cls.female_user,
            monthly_salary=Decimal('5000.00'),
            type='supervisor'
        )

        cls.season = Season.objects.create(
            name='Test Season',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )

    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

        # Create attendance records for today
        today = timezone.localdate()
        
        InstructorAttendance.objects.create(
            instructor=self.male_instructor,
            date=today,
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.LECTURE,
            season=self.season
        )

        InstructorAttendance.objects.create(
            instructor=self.female_instructor,
            date=today,
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.SUPERVISION,
            season=self.season
        )

    def test_api_filter_by_gender(self):
        """Test API endpoint with gender filter."""
        response = self.client.get('/api/attendance/all/', {'gender': 'male'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        
        if isinstance(results, list):
            self.assertEqual(len(results), 1)

    def test_api_filter_by_instructor_type(self):
        """Test API endpoint with instructor_type filter."""
        response = self.client.get('/api/attendance/all/', {'instructor_type': 'supervisor'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        
        if isinstance(results, list):
            self.assertEqual(len(results), 1)

    def test_api_combined_filters(self):
        """Test API endpoint with combined filters."""
        response = self.client.get('/api/attendance/all/', {
            'gender': 'female',
            'instructor_type': 'supervisor',
            'status': 'present'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        
        if isinstance(results, list):
            self.assertEqual(len(results), 1)
