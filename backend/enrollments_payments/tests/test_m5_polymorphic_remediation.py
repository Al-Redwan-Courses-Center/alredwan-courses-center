import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser, Instructor
from parents.models import Parent, Child
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus
from enrollments_payments.models import (
    Enrollment, EnrollmentStatus,
    EnrollmentRequest, EnrollmentRequestStatus,
    PaymentMethod, Payment
)
from enrollments_payments.admin.enrollment import PaymentStatusFilter


class Milestone5PolymorphicRemediationTests(TestCase):
    """
    Comprehensive Milestone 5 verification for polymorphic enrollment requests,
    approvals, payment methods, and query optimization.
    """

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

        self.season = Season.objects.create(
            name='Academic Season 2026',
            season_type='winter',
            start_date=self.today,
            end_date=self.today + timedelta(days=120),
            is_active=True
        )

        # Admin user
        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201099990001',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role='admin',
            is_staff=True,
            is_superuser=True,
            dob='1980-01-01',
            gender='male'
        )

        # Instructor user
        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201099990002',
            password='Password123!',
            first_name='Prof',
            last_name='Tariq',
            role='instructor',
            dob='1982-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=4000
        )

        # Student user
        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201099990003',
            password='Password123!',
            first_name='Hassan',
            last_name='Student',
            role='student',
            dob='2006-01-01',
            gender='male'
        )
        self.student = self.student_user.student_profile

        # Parent user & Child
        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201099990004',
            password='Password123!',
            first_name='Maged',
            last_name='Parent',
            role='parent',
            dob='1975-01-01',
            gender='male'
        )
        self.parent = self.parent_user.parent_profile

        self.child = Child.objects.create(
            first_name='Nour',
            last_name='Maged',
            primary_parent=self.parent,
            dob='2014-01-01',
            gender='boy'
        )

        # Physical Course
        self.physical_course = Course.objects.create(
            name='Chemistry 101',
            description='Physical Chemistry course',
            instructor=self.instructor,
            season=self.season,
            price=800.00,
            capacity=25,
            num_lectures=4,
            start_date=self.today,
            end_date=self.today + timedelta(days=120),
            is_active=True,
            for_adults=False,
        )

        # Online Course (now physical_course2)
        self.physical_course2 = Course.objects.create(
            name='Fullstack Web Development',
            description='Complete web development curriculum',
            instructor=self.instructor,
            season=self.season,
            price=950.00,
            capacity=25,
            num_lectures=4,
            start_date=self.today,
            end_date=self.today + timedelta(days=120),
            is_active=True,
            for_adults=False,
        )

    def test_polymorphic_request_creation_for_online_course(self):
        """Student submits an enrollment request for course 2 with auto price."""
        self.client.force_authenticate(user=self.student_user)

        response = self.client.post('/api/enrollment-requests/', {
            'course': self.physical_course2.id,
            'payment_method': PaymentMethod.VODAFONE_CASH,
            'notes': 'Online registration with vodafone cash'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['course'], self.physical_course2.id)
        self.assertEqual(float(data['price']), 950.00)

        # Retrieve request detail
        req_id = data['id']
        detail_resp = self.client.get(f'/api/enrollment-requests/{req_id}/')
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        detail_data = detail_resp.json()
        self.assertEqual(detail_data['course_name'], self.physical_course2.name)
        self.assertEqual(float(detail_data['course_price']), 950.00)

    def test_polymorphic_request_creation_for_child_online_course(self):
        """Parent submits an enrollment request for their child in a course."""
        self.client.force_authenticate(user=self.parent_user)

        response = self.client.post('/api/enrollment-requests/', {
            'course': self.physical_course2.id,
            'child': str(self.child.id),
            'payment_method': PaymentMethod.INSTAPAY,
            'notes': 'Child online registration'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['child'], str(self.child.id))
        self.assertEqual(data['payment_method'], PaymentMethod.INSTAPAY)

        # Retrieve request detail
        req_id = data['id']
        detail_resp = self.client.get(f'/api/enrollment-requests/{req_id}/')
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        detail_data = detail_resp.json()
        self.assertEqual(detail_data['participant_name'], f"{self.child.first_name} {self.child.last_name}")

    def test_polymorphic_request_rejection_on_invalid_combinations(self):
        """Reject requests with neither course provided."""
        self.client.force_authenticate(user=self.student_user)

        # Neither course provided
        res_neither = self.client.post('/api/enrollment-requests/', {
            'payment_method': PaymentMethod.CASH
        })
        self.assertEqual(res_neither.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_method_choices_complete_coverage(self):
        """Test that all valid payment methods are accepted in requests and approvals."""
        valid_methods = [
            PaymentMethod.CASH,
            PaymentMethod.VODAFONE_CASH,
            PaymentMethod.INSTAPAY,
        ]

        self.client.force_authenticate(user=self.student_user)

        for i, method in enumerate(valid_methods):
            course = Course.objects.create(
                name=f'Course Method {i}',
                instructor=self.instructor,
                season=self.season,
                price=100.00 + (i * 10),
                capacity=25,
                num_lectures=4,
                start_date=self.today,
                end_date=self.today + timedelta(days=120),
                is_active=True
            )
            response = self.client.post('/api/enrollment-requests/', {
                'course': course.id,
                'payment_method': method,
                'price': str(course.price)
            })
            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
                f"Failed on payment method: {method} with error: {response.data}"
            )

    def test_admin_single_approval_for_online_course_request(self):
        """Admin approves a course 2 request, creating an active enrollment and payment."""
        req = EnrollmentRequest.objects.create(
            student=self.student,
            course=self.physical_course2,
            price=Decimal('950.00'),
            payment_method=PaymentMethod.INSTAPAY,
            status=EnrollmentRequestStatus.PENDING
        )

        self.client.force_authenticate(user=self.admin_user)
        approve_resp = self.client.post(f'/api/admin/enrollment-requests/{req.id}/approve/', {
            'paid_amount': '950.00',
            'payment_method': PaymentMethod.INSTAPAY,
            'payment_notes': 'Verified InstaPay transaction'
        })
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)

        req.refresh_from_db()
        self.assertEqual(req.status, EnrollmentRequestStatus.ACCEPTED)

        # Active enrollment created
        enrollment = Enrollment.objects.get(student=self.student, course=self.physical_course2)
        self.assertEqual(enrollment.status, EnrollmentStatus.ACTIVE)

        # Payment record created
        payment = Payment.objects.get(enrollment=enrollment)
        self.assertEqual(payment.amount, Decimal('950.00'))
        self.assertEqual(payment.method, PaymentMethod.INSTAPAY)
        self.assertEqual(payment.status, 'paid')
        self.assertEqual(payment.payer_student, self.student)

    def test_admin_bulk_approval_for_mixed_requests(self):
        """Admin bulk-approves physical course requests simultaneously."""
        req_phys = EnrollmentRequest.objects.create(
            student=self.student,
            course=self.physical_course,
            price=Decimal('800.00'),
            payment_method=PaymentMethod.CASH,
            status=EnrollmentRequestStatus.PENDING
        )
        req_online = EnrollmentRequest.objects.create(
            child=self.child,
            course=self.physical_course2,
            price=Decimal('950.00'),
            payment_method=PaymentMethod.VODAFONE_CASH,
            status=EnrollmentRequestStatus.PENDING
        )

        self.client.force_authenticate(user=self.admin_user)
        bulk_resp = self.client.post('/api/admin/enrollment-requests/bulk-approve/', {
            'request_ids': [req_phys.id, req_online.id],
            'payment_method': PaymentMethod.CASH,
            'payment_notes': 'Bulk approval batch'
        })
        self.assertEqual(bulk_resp.status_code, status.HTTP_200_OK)

        req_phys.refresh_from_db()
        req_online.refresh_from_db()
        self.assertEqual(req_phys.status, EnrollmentRequestStatus.ACCEPTED)
        self.assertEqual(req_online.status, EnrollmentRequestStatus.ACCEPTED)

        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.physical_course, status=EnrollmentStatus.ACTIVE).exists())
        self.assertTrue(Enrollment.objects.filter(child=self.child, course=self.physical_course2, status=EnrollmentStatus.ACTIVE).exists())

    def test_amount_paid_optimization_with_prefetched_payments(self):
        """Enrollment.amount_paid() uses prefetched payments relation without extra queries."""
        enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.physical_course,
            status=EnrollmentStatus.ACTIVE
        )
        Payment.objects.create(
            enrollment=enrollment,
            payer_student=self.student,
            amount=Decimal('300.00'),
            status='paid',
            processed_at=timezone.now()
        )
        Payment.objects.create(
            enrollment=enrollment,
            payer_student=self.student,
            amount=Decimal('500.00'),
            status='paid',
            processed_at=timezone.now()
        )

        # Prefetched query
        fetched_enrollment = Enrollment.objects.prefetch_related('payments').get(id=enrollment.id)
        with self.assertNumQueries(0):
            paid = fetched_enrollment.amount_paid()
            self.assertEqual(paid, Decimal('800.00'))

    def test_should_be_completed_optimization(self):
        """Enrollment.should_be_completed() utilizes prefetched lectures."""
        enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.physical_course,
            status=EnrollmentStatus.ACTIVE
        )
        Lecture.objects.filter(course=self.physical_course).delete()
        for i in range(1, 5):
            Lecture.objects.create(
                course=self.physical_course,
                lecture_number=i,
                title=f'Lecture {i}',
                day=self.today + timedelta(days=i),
                start_time='10:00:00',
                end_time='12:00:00',
                status=LectureStatus.COMPLETED,
                is_accepted=True
            )

        fetched = Enrollment.objects.select_related('course').prefetch_related('course__lectures').get(id=enrollment.id)
        with self.assertNumQueries(0):
            self.assertTrue(fetched.should_be_completed())
