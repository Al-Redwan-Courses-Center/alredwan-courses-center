#!/usr/bin/env python3
"""
Tests for User Enrollment API endpoints.

Endpoints tested:
- GET /api/enrollments/my-enrollments/ - List user's enrollments
- GET /api/enrollments/{id}/ - View enrollment details
- GET /api/enrollments/{id}/progress/ - View enrollment progress
"""
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


class TestEnrollmentList(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/enrollments/my-enrollments/ - List user's enrollments."""

    def setUp(self):
        super().setUp()
        # Create enrollments for testing
        self.child_enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        self.student_enrollment = Enrollment.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )

    def test_parent_sees_child_enrollments(self):
        """Test that parent sees enrollments for their children."""
        self.authenticate_as_parent()
        
        response = self.client.get('/api/enrollments/my-enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]['id']), str(self.child_enrollment.id))

    def test_student_sees_own_enrollments(self):
        """Test that student sees their own enrollments."""
        self.authenticate_as_student()
        
        response = self.client.get('/api/enrollments/my-enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(str(results[0]['id']), str(self.student_enrollment.id))

    def test_filter_by_status(self):
        """Test filtering enrollments by status."""
        # Create a suspended enrollment
        suspended_enrollment = Enrollment.objects.create(
            course=self.other_course,
            child=self.child,
            status=EnrollmentStatus.SUSPENDED,
            created_by=self.admin_user
        )
        
        self.authenticate_as_parent()
        
        # Filter by active
        response = self.client.get('/api/enrollments/my-enrollments/', {'status': 'active'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'active')

    def test_parent_sees_multiple_children_enrollments(self):
        """Test that parent sees enrollments for all their children."""
        # Create another child for the same parent
        from parents.models import Child
        from django.utils import timezone
        from datetime import timedelta
        
        child2 = Child.objects.create(
            primary_parent=self.parent,
            first_name='Second',
            last_name='Child',
            dob=timezone.localdate() - timedelta(days=365 * 8),
            gender='girl'
        )
        
        # Create enrollment for second child
        child2_enrollment = Enrollment.objects.create(
            course=self.other_course,
            child=child2,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        
        self.authenticate_as_parent()
        
        response = self.client.get('/api/enrollments/my-enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 2)

    def test_unauthenticated_cannot_list_enrollments(self):
        """Test that unauthenticated users cannot list enrollments."""
        self.logout()
        
        response = self.client.get('/api/enrollments/my-enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_instructor_cannot_use_this_endpoint(self):
        """Test that instructors cannot use this endpoint."""
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/enrollments/my-enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_use_this_endpoint(self):
        """Test that admins should use admin endpoints instead."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/enrollments/my-enrollments/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestEnrollmentDetail(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/enrollments/{id}/ - View enrollment details."""

    def setUp(self):
        super().setUp()
        self.child_enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        self.student_enrollment = Enrollment.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )

    def test_parent_can_view_child_enrollment(self):
        """Test that parent can view their child's enrollment details."""
        self.authenticate_as_parent()
        
        response = self.client.get(f'/api/enrollments/{self.child_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.child_enrollment.id))
        self.assertIn('course', response.data)
        self.assertIn('child', response.data)

    def test_student_can_view_own_enrollment(self):
        """Test that student can view their own enrollment details."""
        self.authenticate_as_student()
        
        response = self.client.get(f'/api/enrollments/{self.student_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.student_enrollment.id))

    def test_admin_can_view_any_enrollment(self):
        """Test that admin can view any enrollment."""
        self.authenticate_as_admin()
        
        response = self.client.get(f'/api/enrollments/{self.child_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_can_view_any_enrollment(self):
        """Test that supervisor can view any enrollment."""
        self.authenticate_as_supervisor()
        
        response = self.client.get(f'/api/enrollments/{self.student_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_instructor_can_view_enrollment_in_their_course(self):
        """Test that instructor can view enrollments in their courses."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/enrollments/{self.child_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_instructor_cannot_view_enrollment_in_other_course(self):
        """Test that instructor cannot view enrollments in other courses."""
        # other_course is taught by other_instructor, not instructor
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/enrollments/{self.student_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_parent_cannot_view_other_child_enrollment(self):
        """Test that parent cannot view other child's enrollment."""
        self.authenticate_as_parent()
        
        # Student enrollment belongs to student, not parent's child
        response = self.client.get(f'/api/enrollments/{self.student_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_view_other_enrollment(self):
        """Test that student cannot view other's enrollment."""
        self.authenticate_as_student()
        
        response = self.client.get(f'/api/enrollments/{self.child_enrollment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_enrollment_returns_404(self):
        """Test that nonexistent enrollment returns 404."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/enrollments/00000000-0000-0000-0000-000000000000/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestEnrollmentProgress(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/enrollments/{id}/progress/ - View enrollment progress."""

    def setUp(self):
        super().setUp()
        # Create enrollment
        self.enrollment = Enrollment.objects.create(
            course=self.course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE,
            created_by=self.admin_user
        )
        
        # Create some lectures for the course
        from courses.models import Lecture, LectureStatus
        from django.utils import timezone
        from datetime import timedelta
        
        # Past lectures (completed)
        for i in range(3):
            Lecture.objects.create(
                course=self.course,
                day=timezone.localdate() - timedelta(days=i + 1),
                lecture_number=i + 1,
                status=LectureStatus.COMPLETED
            )
        
        # Future lectures (scheduled)
        for i in range(5):
            Lecture.objects.create(
                course=self.course,
                day=timezone.localdate() + timedelta(days=i + 1),
                lecture_number=i + 4,
                status=LectureStatus.SCHEDULED
            )

    def test_parent_can_view_child_progress(self):
        """Test that parent can view their child's enrollment progress."""
        self.authenticate_as_parent()
        
        response = self.client.get(f'/api/enrollments/{self.enrollment.id}/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_lectures', response.data)
        self.assertIn('completed_lectures', response.data)
        self.assertIn('percentage', response.data)

    def test_admin_can_view_any_progress(self):
        """Test that admin can view any enrollment progress."""
        self.authenticate_as_admin()
        
        response = self.client.get(f'/api/enrollments/{self.enrollment.id}/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_instructor_can_view_progress_in_their_course(self):
        """Test that instructor can view progress in their courses."""
        self.authenticate_as_instructor()
        
        response = self.client.get(f'/api/enrollments/{self.enrollment.id}/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_instructor_cannot_view_progress(self):
        """Test that other instructor cannot view progress."""
        self.authenticate_as_other_instructor()
        
        response = self.client.get(f'/api/enrollments/{self.enrollment.id}/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_progress_data_accuracy(self):
        """Test that progress data is accurate."""
        self.authenticate_as_parent()
        
        response = self.client.get(f'/api/enrollments/{self.enrollment.id}/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # We created 3 completed + 5 scheduled = 8 total
        self.assertEqual(response.data['total_lectures'], 8)
        self.assertEqual(response.data['completed_lectures'], 3)
        # 3/8 = 37.5%
        self.assertAlmostEqual(response.data['percentage'], 37.5, places=1)

    def test_nonexistent_enrollment_returns_404(self):
        """Test that nonexistent enrollment returns 404."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/enrollments/00000000-0000-0000-0000-000000000000/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_view_progress(self):
        """Test that unauthenticated users cannot view progress."""
        self.logout()
        
        response = self.client.get(f'/api/enrollments/{self.enrollment.id}/progress/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
