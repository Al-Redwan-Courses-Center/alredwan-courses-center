#!/usr/bin/env python3
"""
Tests for User Enrollment Request API endpoints.

Endpoints tested:
- POST /api/enrollment-requests/ - Create enrollment request
- GET /api/enrollment-requests/my-requests/ - List user's requests
- GET /api/enrollment-requests/{id}/ - View request details
- DELETE /api/enrollment-requests/{id}/cancel/ - Cancel request
"""
from django.urls import reverse
from rest_framework import status

from .test_api_base import EnrollmentAPIBaseTestCase
from ..models import EnrollmentRequest, EnrollmentRequestStatus


class TestEnrollmentRequestCreate(EnrollmentAPIBaseTestCase):
    """Tests for POST /api/enrollment-requests/ - Create enrollment request."""

    def test_parent_can_create_enrollment_request_for_child(self):
        """Test that a parent can create an enrollment request for their child."""
        self.authenticate_as_parent()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.course.id,
            'child': self.child.id,
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        # The serializer returns course, child, price, payment_method, notes
        self.assertIn('course', response.data)
        
        # Verify enrollment request was created in DB
        er = EnrollmentRequest.objects.filter(
            parent=self.parent,
            child=self.child,
            course=self.course
        ).first()
        self.assertIsNotNone(er)
        self.assertEqual(er.status, EnrollmentRequestStatus.PENDING)

    def test_student_can_create_enrollment_request(self):
        """Test that a student can create an enrollment request for themselves."""
        self.authenticate_as_student()
        
        # Use other_course since it's for_adults=True and student is adult
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.other_course.id,
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        
        # Verify enrollment request was created in DB
        er = EnrollmentRequest.objects.filter(
            student=self.student,
            course=self.other_course
        ).first()
        self.assertIsNotNone(er)
        self.assertIsNone(er.parent)
        self.assertIsNone(er.child)

    def test_parent_with_partial_payment(self):
        """Test parent can request partial payment enrollment."""
        self.authenticate_as_parent()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.course.id,
            'child': self.child.id,
            'price': '250.00',  # Partial payment (course is 500)
            'payment_method': 'vodafone_cash',
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        
        er = EnrollmentRequest.objects.filter(
            parent=self.parent,
            child=self.child,
            course=self.course
        ).first()
        self.assertIsNotNone(er)
        self.assertEqual(float(er.price), 250.00)
        self.assertEqual(er.payment_method, 'vodafone_cash')

    def test_unauthenticated_cannot_create_request(self):
        """Test that unauthenticated users cannot create enrollment requests."""
        self.logout()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.course.id,
        })
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_instructor_cannot_create_request(self):
        """Test that instructors cannot create enrollment requests."""
        self.authenticate_as_instructor()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.course.id,
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_create_request(self):
        """Test that admins cannot create enrollment requests via this endpoint."""
        self.authenticate_as_admin()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.course.id,
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_create_duplicate_request(self):
        """Test that duplicate enrollment requests are rejected."""
        self.authenticate_as_student()
        
        # Create first request (use other_course which is for_adults=True)
        response1 = self.client.post('/api/enrollment-requests/', {
            'course': self.other_course.id,
        })
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED, response1.data)
        
        # Try to create duplicate
        response2 = self.client.post('/api/enrollment-requests/', {
            'course': self.other_course.id,
        })
        self.assertIn(response2.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_invalid_course_id(self):
        """Test request with invalid course ID."""
        self.authenticate_as_student()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': '00000000-0000-0000-0000-000000000000',
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_parent_cannot_enroll_unlinked_child(self):
        """Test that parent cannot enroll a child they don't own."""
        # Create another parent with their own child
        from users.models import CustomUser
        from parents.models import Parent, Child
        from django.utils import timezone
        from datetime import timedelta
        
        other_parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000099',
            password='otherparent123',
            first_name='Other',
            last_name='Parent',
            email='otherparent@test.com',
            dob='1975-01-01',
            gender='female',
            role='parent'
        )
        # Signal auto-creates Parent, so get it instead
        other_parent = Parent.objects.get(user=other_parent_user)
        other_child = Child.objects.create(
            primary_parent=other_parent,
            first_name='Other',
            last_name='Child',
            dob=timezone.localdate() - timedelta(days=365 * 8),
            gender='girl'
        )
        
        self.authenticate_as_parent()
        
        response = self.client.post('/api/enrollment-requests/', {
            'course': self.course.id,
            'child': other_child.id,  # Not their child
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestEnrollmentRequestList(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/enrollment-requests/my-requests/ - List user's requests."""

    def setUp(self):
        super().setUp()
        # Create some enrollment requests for testing
        self.parent_request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )
        self.student_request = EnrollmentRequest.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentRequestStatus.PENDING
        )

    def _get_results(self, response_data):
        """Helper to get results from paginated or non-paginated response."""
        if isinstance(response_data, dict) and 'results' in response_data:
            return response_data['results']
        return response_data

    def test_parent_sees_own_requests(self):
        """Test that parent sees only their own requests."""
        self.authenticate_as_parent()
        
        response = self.client.get('/api/enrollment-requests/my-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], str(self.parent_request.id))

    def test_student_sees_own_requests(self):
        """Test that student sees only their own requests."""
        self.authenticate_as_student()
        
        response = self.client.get('/api/enrollment-requests/my-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], str(self.student_request.id))

    def test_filter_by_status(self):
        """Test filtering requests by status."""
        # Create another request with different status
        EnrollmentRequest.objects.create(
            course=self.other_course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.REJECTED
        )
        
        self.authenticate_as_parent()
        
        # Filter by pending
        response = self.client.get('/api/enrollment-requests/my-requests/', {'status': 'pending'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'pending')

    def test_unauthenticated_cannot_list(self):
        """Test that unauthenticated users cannot list requests."""
        self.logout()
        
        response = self.client.get('/api/enrollment-requests/my-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_instructor_cannot_list_requests(self):
        """Test that instructors cannot use this endpoint."""
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/enrollment-requests/my-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestEnrollmentRequestDetail(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/enrollment-requests/{id}/ - View request details."""

    def setUp(self):
        super().setUp()
        self.parent_request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )
        self.student_request = EnrollmentRequest.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_parent_can_view_own_request(self):
        """Test that parent can view their own request details."""
        self.authenticate_as_parent()
        
        response = self.client.get(f'/api/enrollment-requests/{self.parent_request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.parent_request.id))
        # The serializer provides course_name, participant_name, participant_type, etc.
        self.assertIn('course_name', response.data)
        self.assertIn('participant_name', response.data)
        self.assertEqual(response.data['participant_type'], 'child')

    def test_student_can_view_own_request(self):
        """Test that student can view their own request details."""
        self.authenticate_as_student()
        
        response = self.client.get(f'/api/enrollment-requests/{self.student_request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.student_request.id))

    def test_admin_can_view_any_request(self):
        """Test that admin can view any request."""
        self.authenticate_as_admin()
        
        response = self.client.get(f'/api/enrollment-requests/{self.parent_request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_can_view_any_request(self):
        """Test that supervisor can view any request."""
        self.authenticate_as_supervisor()
        
        response = self.client.get(f'/api/enrollment-requests/{self.student_request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_parent_cannot_view_others_request(self):
        """Test that parent cannot view other's request."""
        self.authenticate_as_parent()
        
        response = self.client.get(f'/api/enrollment-requests/{self.student_request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_view_others_request(self):
        """Test that student cannot view other's request."""
        self.authenticate_as_student()
        
        response = self.client.get(f'/api/enrollment-requests/{self.parent_request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_request_returns_404(self):
        """Test that nonexistent request returns 404."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/enrollment-requests/00000000-0000-0000-0000-000000000000/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestEnrollmentRequestCancel(EnrollmentAPIBaseTestCase):
    """Tests for DELETE /api/enrollment-requests/{id}/cancel/ - Cancel request."""

    def setUp(self):
        super().setUp()
        self.parent_request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )
        self.student_request = EnrollmentRequest.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_parent_can_cancel_own_pending_request(self):
        """Test that parent can cancel their own pending request."""
        self.authenticate_as_parent()
        
        response = self.client.delete(f'/api/enrollment-requests/{self.parent_request.id}/cancel/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        
        # Verify request was deleted
        self.assertFalse(EnrollmentRequest.objects.filter(id=self.parent_request.id).exists())

    def test_student_can_cancel_own_pending_request(self):
        """Test that student can cancel their own pending request."""
        self.authenticate_as_student()
        
        response = self.client.delete(f'/api/enrollment-requests/{self.student_request.id}/cancel/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(EnrollmentRequest.objects.filter(id=self.student_request.id).exists())

    def test_cannot_cancel_non_pending_request(self):
        """Test that non-pending requests cannot be cancelled."""
        self.parent_request.status = EnrollmentRequestStatus.PROCESSING
        self.parent_request.save(update_fields=['status'])
        
        self.authenticate_as_parent()
        
        response = self.client.delete(f'/api/enrollment-requests/{self.parent_request.id}/cancel/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verify request still exists
        self.assertTrue(EnrollmentRequest.objects.filter(id=self.parent_request.id).exists())

    def test_parent_cannot_cancel_others_request(self):
        """Test that parent cannot cancel other's request."""
        self.authenticate_as_parent()
        
        response = self.client.delete(f'/api/enrollment-requests/{self.student_request.id}/cancel/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_use_cancel_endpoint(self):
        """Test that admin must use reject endpoint, not cancel."""
        self.authenticate_as_admin()
        
        response = self.client.delete(f'/api/enrollment-requests/{self.parent_request.id}/cancel/')
        
        # Admin should be told to use reject endpoint
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_cancel(self):
        """Test that unauthenticated users cannot cancel requests."""
        self.logout()
        
        response = self.client.delete(f'/api/enrollment-requests/{self.parent_request.id}/cancel/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
