from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from parents.models import Parent, Child
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus
from courses_online.models import OnlineCourse
from enrollments_payments.models import Enrollment, EnrollmentStatus, Payment
from enrollments_payments.admin.enrollment import PaymentStatusFilter


class Milestone2EnrollmentQueryOptimizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.season = Season.objects.create(
            name='Fall 2026',
            season_type='winter',
            start_date=date(2026, 9, 1),
            end_date=date(2026, 12, 31),
            is_active=True
        )

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201200000001',
            password='Password123!',
            first_name='Dr',
            last_name='Nader',
            role='instructor',
            dob='1978-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=5000
        )

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201200000002',
            password='Password123!',
            first_name='Tamer',
            last_name='Student',
            role='student',
            dob='2005-01-01',
            gender='male'
        )
        self.student = self.student_user.student_profile

        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201200000003',
            password='Password123!',
            first_name='Adel',
            last_name='Parent',
            role='parent',
            dob='1974-01-01',
            gender='male'
        )
        self.parent = self.parent_user.parent_profile

        self.child = Child.objects.create(
            first_name='Hany',
            last_name='Adel',
            primary_parent=self.parent,
            dob='2012-01-01',
            gender='male'
        )

        self.physical_course = Course.objects.create(
            name='Math Advanced',
            description='Advanced Math Course',
            instructor=self.instructor,
            season=self.season,
            price=1000.00,
            capacity=20,
            num_lectures=4,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 12, 31),
            is_active=True
        )

        self.online_course = OnlineCourse.objects.create(
            name='Python Bootcamp',
            description='Online Python Course',
            instructor=self.instructor,
            price=600.00,
            is_active=True,
            is_published=True
        )

        # Enrollments
        self.phys_enrollment = Enrollment.objects.create(
            course=self.physical_course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE
        )

        self.online_enrollment = Enrollment.objects.create(
            online_course=self.online_course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        # Payments
        self.payment1 = Payment.objects.create(
            enrollment=self.phys_enrollment,
            payer_student=self.student,
            amount=Decimal('400.00'),
            status='paid',
            processed_at=timezone.now()
        )
        self.payment2 = Payment.objects.create(
            enrollment=self.phys_enrollment,
            payer_student=self.student,
            amount=Decimal('600.00'),
            status='paid',
            processed_at=timezone.now()
        )
        self.payment3 = Payment.objects.create(
            enrollment=self.online_enrollment,
            payer_parent=self.parent,
            amount=Decimal('300.00'),
            status='paid',
            processed_at=timezone.now()
        )

    def test_amount_paid_uses_prefetched_payments_without_extra_queries(self):
        # Fetch enrollment with prefetched payments
        enrollment = Enrollment.objects.prefetch_related('payments').get(id=self.phys_enrollment.id)
        
        # When payments are prefetched, amount_paid() must not execute any database queries
        with self.assertNumQueries(0):
            paid = enrollment.amount_paid()
            self.assertEqual(paid, Decimal('1000.00'))

    def test_amount_paid_fallback_without_prefetch(self):
        # Fetch enrollment without prefetch
        enrollment = Enrollment.objects.get(id=self.phys_enrollment.id)
        # Fallback uses aggregate query
        paid = enrollment.amount_paid()
        self.assertEqual(paid, Decimal('1000.00'))

    def test_should_be_completed_uses_prefetched_lectures(self):
        # Create lectures on physical course
        Lecture.objects.filter(course=self.physical_course).delete()
        for i in range(1, 5):
            Lecture.objects.create(
                course=self.physical_course,
                lecture_number=i,
                title=f'Lecture {i}',
                day=date(2026, 9, i),
                start_time='10:00:00',
                end_time='12:00:00',
                status=LectureStatus.COMPLETED,
                is_accepted=True
            )

        enrollment = Enrollment.objects.select_related('course').prefetch_related('course__lectures').get(id=self.phys_enrollment.id)
        # Calling should_be_completed() on prefetched course should execute 0 SQL queries
        with self.assertNumQueries(0):
            result = enrollment.should_be_completed()
            self.assertTrue(result)

    def test_payment_status_filter_sql_annotations(self):
        # phys_enrollment is fully paid (1000/1000)
        # online_enrollment is partial paid (300/600)
        from django.test import RequestFactory
        factory = RequestFactory()
        
        request = factory.get('/admin/enrollment/?payment_status=fully_paid')
        filter_instance = PaymentStatusFilter(request, request.GET.copy(), Enrollment, None)
        qs = filter_instance.queryset(request, Enrollment.objects.all())
        fully_paid_ids = list(qs.values_list('id', flat=True))
        self.assertIn(self.phys_enrollment.id, fully_paid_ids)
        self.assertNotIn(self.online_enrollment.id, fully_paid_ids)

        request_partial = factory.get('/admin/enrollment/?payment_status=partial')
        filter_partial = PaymentStatusFilter(request_partial, request_partial.GET.copy(), Enrollment, None)
        qs_partial = filter_partial.queryset(request_partial, Enrollment.objects.all())
        partial_ids = list(qs_partial.values_list('id', flat=True))
        self.assertIn(self.online_enrollment.id, partial_ids)
        self.assertNotIn(self.phys_enrollment.id, partial_ids)

    def test_instructor_endpoints_polymorphic_integer_and_uuid_lookups(self):
        self.client.force_authenticate(user=self.instructor_user)

        # 1. Physical course enrollment list by integer ID
        resp_phys = self.client.get(f'/api/instructor/courses/{self.physical_course.id}/enrollments/')
        self.assertEqual(resp_phys.status_code, status.HTTP_200_OK)
        phys_data = resp_phys.json()
        self.assertEqual(len(phys_data['results']), 1)
        self.assertEqual(phys_data['results'][0]['course_name'], self.physical_course.name)

        # 2. Online course enrollment list by UUID
        resp_online = self.client.get(f'/api/instructor/courses/{self.online_course.id}/enrollments/')
        self.assertEqual(resp_online.status_code, status.HTTP_200_OK)
        online_data = resp_online.json()
        self.assertEqual(len(online_data['results']), 1)
        self.assertEqual(online_data['results'][0]['course_name'], self.online_course.name)

        # 3. Physical course stats
        resp_phys_stats = self.client.get(f'/api/instructor/courses/{self.physical_course.id}/enrollment-stats/')
        self.assertEqual(resp_phys_stats.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_phys_stats.json()['course_id'], str(self.physical_course.id))

        # 4. Online course stats
        resp_online_stats = self.client.get(f'/api/instructor/courses/{self.online_course.id}/enrollment-stats/')
        self.assertEqual(resp_online_stats.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_online_stats.json()['course_id'], str(self.online_course.id))

        # 5. All instructor enrollments across physical and online
        resp_all = self.client.get('/api/instructor/enrollments/')
        self.assertEqual(resp_all.status_code, status.HTTP_200_OK)
        all_data = resp_all.json()
        self.assertEqual(all_data['count'], 2)
