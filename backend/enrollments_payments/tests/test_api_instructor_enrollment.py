#!/usr/bin/env python3
"""
Tests for Instructor Enrollment API endpoints.

Endpoints tested:
- GET /api/instructor/enrollments/ - List all enrollments across instructor's courses
- GET /api/instructor/courses/{course_id}/enrollments/ - List enrollments in a specific course
- GET /api/instructor/courses/{course_id}/enrollment-stats/ - Get enrollment statistics
"""
from datetime import date
from django.urls import reverse
from rest_framework import status

from .test_api_base import EnrollmentAPIBaseTestCase
from ..models import Enrollment
from ..models.enrollment import EnrollmentStatus


def get_results(response_data):
    """Helper to handle both paginated and non-paginated responses."""
    if isinstance(response_data, dict) and 'results' in response_data:
        return response_data['results']
    return response_data


class TestInstructorAllEnrollmentsList(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/instructor/enrollments/ - List all enrollments."""

    def setUp(self):
        super().setUp()
        # Create enrollments in instructor's course
        self.enrollment1 = Enrollment.objects.create(
            course=self.course,  # Taught by instructor
            child=self.child,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        self.enrollment2 = Enrollment.objects.create(
            course=self.course,  # Taught by instructor
            student=self.student,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        
        # Create enrollment in other instructor's course
        self.other_enrollment = Enrollment.objects.create(
            course=self.other_course,  # Taught by other_instructor
            student=self.other_student,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )

    def test_instructor_sees_only_their_course_enrollments(self):
        """Test that instructor only sees enrollments in their own courses."""
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see 2 enrollments (both in their course)
        results = get_results(response.data)
        self.assertEqual(len(results), 2)
        
        # Verify all returned enrollments are for instructor's course
        for enrollment in results:
            # Course ID may be integer or nested object
            if isinstance(enrollment.get('course'), dict):
                self.assertEqual(enrollment['course']['id'], self.course.id)
            else:
                self.assertEqual(enrollment['course'], self.course.id)

    def test_other_instructor_sees_their_own_enrollments(self):
        """Test that other instructor sees their own course enrollments."""
        self.authenticate_as_other_instructor()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        # Should see 1 enrollment (in other_course)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]['id']), str(self.other_enrollment.id))

    def test_filter_by_status(self):
        """Test filtering enrollments by status."""
        # Make one enrollment suspended
        self.enrollment1.status = EnrollmentStatus.SUSPENDED
        self.enrollment1.save(update_fields=['status'])
        
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/instructor/enrollments/', {'status': 'active'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]['id']), str(self.enrollment2.id))

    def test_no_financial_data_exposed(self):
        """Test that no financial data is exposed to instructors."""
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        for enrollment in results:
            # Should not contain payment or financial information
            self.assertNotIn('payments', enrollment)
            self.assertNotIn('payment_status', enrollment)
            self.assertNotIn('total_paid', enrollment)
            self.assertNotIn('balance_due', enrollment)

    def test_parent_cannot_use_instructor_endpoint(self):
        """Test that parents cannot use instructor endpoints."""
        self.authenticate_as_parent()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_use_instructor_endpoint(self):
        """Test that students cannot use instructor endpoints."""
        self.authenticate_as_student()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_use_instructor_endpoint(self):
        """Test that admins should use admin endpoints instead."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_access(self):
        """Test that unauthenticated users cannot access."""
        self.logout()
        
        response = self.client.get('/api/instructor/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestInstructorCourseEnrollmentsList(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/instructor/courses/{course_id}/enrollments/."""

    def setUp(self):
        super().setUp()
        self.enrollment1 = Enrollment.objects.create(
            course=self.course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        self.enrollment2 = Enrollment.objects.create(
            course=self.course,
            student=self.student,
            status=EnrollmentStatus.SUSPENDED,
            created_by=self.admin_user
        )
        self.other_enrollment = Enrollment.objects.create(
            course=self.other_course,
            student=self.other_student,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )

    def test_instructor_can_list_course_enrollments(self):
        """Test that instructor can list enrollments in their course."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        results = get_results(response.data)
        self.assertEqual(len(results), 2)

    def test_instructor_cannot_list_other_course_enrollments(self):
        """Test that instructor cannot list enrollments in other courses."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.other_course.id}/enrollments/')
        
        # Should return empty results or 403 or 404
        if response.status_code == status.HTTP_200_OK:
            results = get_results(response.data)
            self.assertEqual(len(results), 0)
        else:
            self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_other_instructor_can_list_their_course(self):
        """Test that other instructor can list their own course enrollments."""
        self.authenticate_as_other_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.other_course.id}/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)

    def test_nonexistent_course_returns_empty(self):
        """Test that nonexistent course returns empty results or 404."""
        self.authenticate_as_instructor()
        
        # Use a nonexistent integer ID (since Course uses BigAutoField)
        response = self.client.get('/api/instructor/courses/999999/enrollments/')
        
        # Should return empty or 404
        if response.status_code == status.HTTP_200_OK:
            results = get_results(response.data)
            self.assertEqual(len(results), 0)
        else:
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_enrollment_data_structure(self):
        """Test that enrollment data has expected structure."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        results = get_results(response.data)
        enrollment = results[0]
        
        self.assertIn('id', enrollment)
        self.assertIn('course', enrollment)
        self.assertIn('status', enrollment)
        self.assertIn('enrolled_at', enrollment)


class TestInstructorCourseEnrollmentStats(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/instructor/courses/{course_id}/enrollment-stats/."""

    def setUp(self):
        super().setUp()
        # Create various enrollments with different statuses
        self.active_enrollments = []
        for i in range(5):
            enrollment = Enrollment.objects.create(
                course=self.course,
                student=self._create_student(f'+20100000010{i}', f'Student{i}'),
                status=EnrollmentStatus.ACTIVE,
                created_by=self.admin_user
            )
            self.active_enrollments.append(enrollment)
        
        self.suspended_enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child,
            status=EnrollmentStatus.SUSPENDED,
            created_by=self.admin_user
        )
        
        self.completed_enrollment = Enrollment.objects.create(
            course=self.course,
            student=self._create_student('+201000000200', 'Completed'),
            status=EnrollmentStatus.COMPLETED,
            created_by=self.admin_user
        )
        
        self.dropped_enrollment = Enrollment.objects.create(
            course=self.course,
            student=self._create_student('+201000000201', 'Dropped'),
            status=EnrollmentStatus.DROPPED,
            created_by=self.admin_user
        )

    def _create_student(self, phone, name):
        """Helper to create a student user."""
        from users.models import CustomUser, StudentUser
        user = CustomUser.objects.create_user(
            phone_number1=phone,
            password='testpass123',
            first_name=name,
            last_name='Test',
            email=f'{name.lower().replace(" ", "")}@test.com',
            dob=date(2000, 1, 1),
            gender='male',
            role='student'
        )
        # Signal auto-creates StudentUser profile
        return StudentUser.objects.get(user=user)

    def test_instructor_can_get_stats(self):
        """Test that instructor can get enrollment statistics."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('course_id', response.data)
        self.assertIn('course_name', response.data)
        self.assertIn('capacity', response.data)
        self.assertIn('enrolled_count', response.data)
        self.assertIn('available_spots', response.data)
        self.assertIn('active_students', response.data)
        self.assertIn('suspended_students', response.data)
        self.assertIn('completed_students', response.data)
        self.assertIn('dropped_students', response.data)

    def test_stats_accuracy(self):
        """Test that enrollment statistics are accurate."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['active_students'], 5)
        self.assertEqual(response.data['suspended_students'], 1)
        self.assertEqual(response.data['completed_students'], 1)
        self.assertEqual(response.data['dropped_students'], 1)
        # enrolled_count = active + suspended
        self.assertEqual(response.data['enrolled_count'], 6)
        # Course capacity is 30, so available = 30 - 6 = 24
        self.assertEqual(response.data['available_spots'], 24)

    def test_instructor_cannot_get_stats_for_other_course(self):
        """Test that instructor cannot get stats for other instructor's course."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.other_course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_instructor_can_get_their_stats(self):
        """Test that other instructor can get their own course stats."""
        # First create an enrollment in other_course
        Enrollment.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        
        self.authenticate_as_other_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.other_course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['active_students'], 1)

    def test_nonexistent_course_returns_404(self):
        """Test that nonexistent course returns 404."""
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/instructor/courses/00000000-0000-0000-0000-000000000000/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_financial_data_in_stats(self):
        """Test that no financial data is exposed in statistics."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not contain any financial data
        self.assertNotIn('total_revenue', response.data)
        self.assertNotIn('total_paid', response.data)
        self.assertNotIn('outstanding_balance', response.data)
        self.assertNotIn('average_payment', response.data)

    def test_parent_cannot_access_stats(self):
        """Test that parents cannot access instructor stats endpoint."""
        self.authenticate_as_parent()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_stats(self):
        """Test that students cannot access instructor stats endpoint."""
        self.authenticate_as_student()
        
        response = self.client.get(f'/api/instructor/courses/{self.course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_course_stats(self):
        """Test statistics for a course with no enrollments."""
        # Create a new course with no enrollments
        from courses.models import Course
        from django.utils import timezone
        from datetime import timedelta
        from decimal import Decimal
        
        empty_course = Course.objects.create(
            name='Empty Course',
            season=self.season,
            instructor=self.instructor,
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=30),
            price=Decimal('300.00'),
            capacity=20,
            is_active=True
        )
        
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/instructor/courses/{empty_course.id}/enrollment-stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['enrolled_count'], 0)
        self.assertEqual(response.data['active_students'], 0)
        self.assertEqual(response.data['available_spots'], 20)
