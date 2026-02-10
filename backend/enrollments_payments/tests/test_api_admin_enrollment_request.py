#!/usr/bin/env python3
"""
Tests for Admin Enrollment Request API endpoints.

Endpoints tested:
- GET /api/admin/enrollment-requests/ - List all requests (with filters)
- GET /api/admin/enrollment-requests/{id}/ - View request details
- PATCH /api/admin/enrollment-requests/{id}/update/ - Update request
- POST /api/admin/enrollment-requests/{id}/approve/ - Approve request
- POST /api/admin/enrollment-requests/{id}/reject/ - Reject request
- POST /api/admin/enrollment-requests/bulk-approve/ - Bulk approve
- POST /api/admin/enrollment-requests/bulk-reject/ - Bulk reject
"""
from datetime import date
from django.urls import reverse
from rest_framework import status

from .test_api_base import EnrollmentAPIBaseTestCase
from ..models import EnrollmentRequest, EnrollmentRequestStatus, Enrollment


def get_results(response_data):
    """Helper to handle both paginated and non-paginated responses."""
    if isinstance(response_data, dict) and 'results' in response_data:
        return response_data['results']
    return response_data


class TestAdminEnrollmentRequestList(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/admin/enrollment-requests/ - List all requests."""

    def setUp(self):
        super().setUp()
        # Create multiple enrollment requests for testing
        self.request1 = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )
        self.request2 = EnrollmentRequest.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentRequestStatus.PROCESSING
        )

    def test_admin_can_list_all_requests(self):
        """Test that admin can list all enrollment requests."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/admin/enrollment-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 2)

    def test_supervisor_can_list_all_requests(self):
        """Test that supervisor can list all enrollment requests."""
        self.authenticate_as_supervisor()
        
        response = self.client.get('/api/admin/enrollment-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 2)

    def test_filter_by_status(self):
        """Test filtering requests by status."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/admin/enrollment-requests/', {'status': 'pending'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'pending')

    def test_filter_by_course_id(self):
        """Test filtering requests by course ID."""
        self.authenticate_as_admin()
        
        response = self.client.get('/api/admin/enrollment-requests/', {'course_id': str(self.course.id)})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response.data)
        self.assertEqual(len(results), 1)
        # UUID comparison - response may return string or UUID
        self.assertEqual(str(results[0]['id']), str(self.request1.id))

    def test_filter_by_date_range(self):
        """Test filtering requests by date range."""
        self.authenticate_as_admin()
        from django.utils import timezone
        today = timezone.localdate().isoformat()
        
        response = self.client.get('/api/admin/enrollment-requests/', {
            'date_from': today,
            'date_to': today
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_parent_cannot_access_admin_list(self):
        """Test that parent cannot access admin endpoint."""
        self.authenticate_as_parent()
        
        response = self.client.get('/api/admin/enrollment-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_admin_list(self):
        """Test that student cannot access admin endpoint."""
        self.authenticate_as_student()
        
        response = self.client.get('/api/admin/enrollment-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_cannot_access_admin_list(self):
        """Test that instructor cannot access admin endpoint."""
        self.authenticate_as_instructor()
        
        response = self.client.get('/api/admin/enrollment-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestAdminEnrollmentRequestDetail(EnrollmentAPIBaseTestCase):
    """Tests for GET /api/admin/enrollment-requests/{id}/ - View request details."""

    def setUp(self):
        super().setUp()
        self.request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_admin_can_view_request_detail(self):
        """Test that admin can view any request detail."""
        self.authenticate_as_admin()
        
        response = self.client.get(f'/api/admin/enrollment-requests/{self.request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # UUID comparison - response may return string or UUID
        self.assertEqual(str(response.data['id']), str(self.request.id))
        self.assertIn('course', response.data)
        # Detail view uses participant_name/participant_type, not child directly
        self.assertIn('participant_name', response.data)

    def test_supervisor_can_view_request_detail(self):
        """Test that supervisor can view any request detail."""
        self.authenticate_as_supervisor()
        
        response = self.client.get(f'/api/admin/enrollment-requests/{self.request.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestAdminEnrollmentRequestUpdate(EnrollmentAPIBaseTestCase):
    """Tests for PATCH /api/admin/enrollment-requests/{id}/update/ - Update request."""

    def setUp(self):
        super().setUp()
        self.request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_admin_can_update_request_status_to_processing(self):
        """Test that admin can change status to processing."""
        self.authenticate_as_admin()
        
        response = self.client.patch(f'/api/admin/enrollment-requests/{self.request.id}/update/', {
            'status': 'processing'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, EnrollmentRequestStatus.PROCESSING)

    def test_admin_can_update_price(self):
        """Test that admin can update the price."""
        self.authenticate_as_admin()
        
        response = self.client.patch(f'/api/admin/enrollment-requests/{self.request.id}/update/', {
            'price': '350.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.request.refresh_from_db()
        self.assertEqual(float(self.request.price), 350.00)

    def test_admin_can_update_payment_method(self):
        """Test that admin can update the payment method."""
        self.authenticate_as_admin()
        
        response = self.client.patch(f'/api/admin/enrollment-requests/{self.request.id}/update/', {
            'payment_method': 'bank_transfer'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.request.refresh_from_db()
        self.assertEqual(self.request.payment_method, 'bank_transfer')

    def test_admin_can_add_notes(self):
        """Test that admin can add notes."""
        self.authenticate_as_admin()
        
        response = self.client.patch(f'/api/admin/enrollment-requests/{self.request.id}/update/', {
            'notes': 'Student needs special accommodation.'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.request.refresh_from_db()
        self.assertIn('special accommodation', self.request.notes)

    def test_cannot_update_accepted_request(self):
        """Test that accepted requests cannot be updated."""
        self.request.status = EnrollmentRequestStatus.ACCEPTED
        self.request.save(update_fields=['status'])
        
        self.authenticate_as_admin()
        
        response = self.client.patch(f'/api/admin/enrollment-requests/{self.request.id}/update/', {
            'price': '350.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_parent_cannot_update_request(self):
        """Test that parent cannot use admin update endpoint."""
        self.authenticate_as_parent()
        
        response = self.client.patch(f'/api/admin/enrollment-requests/{self.request.id}/update/', {
            'price': '350.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestAdminEnrollmentRequestApprove(EnrollmentAPIBaseTestCase):
    """Tests for POST /api/admin/enrollment-requests/{id}/approve/ - Approve request."""

    def setUp(self):
        super().setUp()
        self.request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_admin_can_approve_request(self):
        """Test that admin can approve an enrollment request."""
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/approve/', {
            'paid_amount': '500.00',
            'payment_method': 'cash'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('enrollment_id', response.data)
        
        # Verify request status changed
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, EnrollmentRequestStatus.ACCEPTED)
        
        # Verify enrollment was created
        enrollment_id = response.data['enrollment_id']
        self.assertTrue(Enrollment.objects.filter(id=enrollment_id).exists())

    def test_supervisor_can_approve_request(self):
        """Test that supervisor can approve an enrollment request."""
        self.authenticate_as_supervisor()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/approve/', {
            'paid_amount': '500.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_approve_with_partial_payment(self):
        """Test approving with partial payment amount."""
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/approve/', {
            'paid_amount': '250.00',  # Partial payment
            'payment_method': 'instapay',
            'payment_notes': 'Will pay remaining 250 next week'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_approve_rejected_request(self):
        """Test that rejected requests cannot be approved."""
        self.request.status = EnrollmentRequestStatus.REJECTED
        self.request.save(update_fields=['status'])
        
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/approve/', {
            'paid_amount': '500.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_approve_already_accepted_request(self):
        """Test that already accepted requests cannot be approved again."""
        self.request.status = EnrollmentRequestStatus.ACCEPTED
        self.request.save(update_fields=['status'])
        
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/approve/', {
            'paid_amount': '500.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_request_returns_404(self):
        """Test that nonexistent request returns 404."""
        self.authenticate_as_admin()
        
        response = self.client.post('/api/admin/enrollment-requests/00000000-0000-0000-0000-000000000000/approve/', {
            'paid_amount': '500.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_parent_cannot_approve(self):
        """Test that parent cannot approve requests."""
        self.authenticate_as_parent()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/approve/', {
            'paid_amount': '500.00'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestAdminEnrollmentRequestReject(EnrollmentAPIBaseTestCase):
    """Tests for POST /api/admin/enrollment-requests/{id}/reject/ - Reject request."""

    def setUp(self):
        super().setUp()
        self.request = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_admin_can_reject_request(self):
        """Test that admin can reject an enrollment request."""
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/reject/', {
            'reason': 'Course is full'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify request status changed
        self.request.refresh_from_db()
        self.assertEqual(self.request.status, EnrollmentRequestStatus.REJECTED)

    def test_supervisor_can_reject_request(self):
        """Test that supervisor can reject an enrollment request."""
        self.authenticate_as_supervisor()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/reject/', {
            'reason': 'Age requirement not met'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reject_without_reason(self):
        """Test rejecting without providing a reason is not allowed."""
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/reject/', {})
        
        # Reason is required, so this should return 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_adds_reason_to_notes(self):
        """Test that rejection reason is added to notes."""
        self.authenticate_as_admin()
        
        reason = 'Student does not meet prerequisites'
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/reject/', {
            'reason': reason
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.request.refresh_from_db()
        self.assertIn(reason, self.request.notes)

    def test_cannot_reject_already_accepted_request(self):
        """Test that accepted requests cannot be rejected."""
        self.request.status = EnrollmentRequestStatus.ACCEPTED
        self.request.save(update_fields=['status'])
        
        self.authenticate_as_admin()
        
        response = self.client.post(f'/api/admin/enrollment-requests/{self.request.id}/reject/', {
            'reason': 'Changed mind'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestAdminBulkApprove(EnrollmentAPIBaseTestCase):
    """Tests for POST /api/admin/enrollment-requests/bulk-approve/ - Bulk approve."""

    def setUp(self):
        super().setUp()
        # Create multiple pending requests
        self.request1 = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )
        
        # Create another student for second request
        from users.models import CustomUser, StudentUser
        self.student2_user = CustomUser.objects.create_user(
            phone_number1='+201000000006',
            password='student2pass123',
            first_name='Student2',
            last_name='User',
            email='student2@test.com',
            dob=date(2001, 1, 1),
            gender='female',
            role='student'
        )
        # Signal auto-creates StudentUser profile
        self.student2 = StudentUser.objects.get(user=self.student2_user)
        
        # Use other_course for adult student (for_adults=True)
        self.request2 = EnrollmentRequest.objects.create(
            course=self.other_course,
            student=self.student2,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_admin_can_bulk_approve(self):
        """Test that admin can bulk approve requests."""
        self.authenticate_as_admin()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-approve/', {
            'request_ids': [str(self.request1.id), str(self.request2.id)],
            'payment_method': 'cash'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['approved_count'], 2)
        self.assertEqual(response.data['failed_count'], 0)

    def test_supervisor_cannot_bulk_approve(self):
        """Test that supervisor cannot bulk approve (admin only)."""
        self.authenticate_as_supervisor()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-approve/', {
            'request_ids': [str(self.request1.id)]
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_approve_skips_invalid_status(self):
        """Test that bulk approve skips requests with invalid status."""
        self.request1.status = EnrollmentRequestStatus.REJECTED
        self.request1.save(update_fields=['status'])
        
        self.authenticate_as_admin()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-approve/', {
            'request_ids': [str(self.request1.id), str(self.request2.id)]
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['approved_count'], 1)
        self.assertEqual(response.data['skipped_count'], 1)

    def test_bulk_approve_empty_list(self):
        """Test bulk approve with empty list."""
        self.authenticate_as_admin()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-approve/', {
            'request_ids': []
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestAdminBulkReject(EnrollmentAPIBaseTestCase):
    """Tests for POST /api/admin/enrollment-requests/bulk-reject/ - Bulk reject."""

    def setUp(self):
        super().setUp()
        self.request1 = EnrollmentRequest.objects.create(
            course=self.course,
            parent=self.parent,
            child=self.child,
            status=EnrollmentRequestStatus.PENDING
        )
        self.request2 = EnrollmentRequest.objects.create(
            course=self.other_course,
            student=self.student,
            status=EnrollmentRequestStatus.PENDING
        )

    def test_admin_can_bulk_reject(self):
        """Test that admin can bulk reject requests."""
        self.authenticate_as_admin()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-reject/', {
            'request_ids': [str(self.request1.id), str(self.request2.id)],
            'reason': 'Course cancelled'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rejected_count'], 2)

    def test_supervisor_cannot_bulk_reject(self):
        """Test that supervisor cannot bulk reject (admin only)."""
        self.authenticate_as_supervisor()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-reject/', {
            'request_ids': [str(self.request1.id)]
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_reject_skips_already_accepted(self):
        """Test that bulk reject skips already accepted requests."""
        self.request1.status = EnrollmentRequestStatus.ACCEPTED
        self.request1.save(update_fields=['status'])
        
        self.authenticate_as_admin()
        
        response = self.client.post('/api/admin/enrollment-requests/bulk-reject/', {
            'request_ids': [str(self.request1.id), str(self.request2.id)],
            'reason': 'Course cancelled'  # Reason is required
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rejected_count'], 1)
        self.assertEqual(response.data['skipped_count'], 1)
