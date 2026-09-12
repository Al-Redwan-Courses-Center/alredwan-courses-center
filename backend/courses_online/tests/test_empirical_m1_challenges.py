#!/usr/bin/env python3
"""
Empirical Challenge & Stress-Testing Suite for Milestone 1 Backend.
Covers Paywall Security, Polymorphic Enrollment Requests, UUID Batch Resilience,
Watch Progress High-Water Mark & Replays, Secondary Parent Access, and Age Eligibility.
"""
from datetime import time, timedelta
import uuid

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser, StudentUser, Instructor
from parents.models import Parent, Child, ChildParents
from courses.models import Course, Season, Lecture
from courses.models.lecture import LectureStatus
from courses_online.models import OnlineCourse, VideoLecture, OnlineLectureMaterial, VideoWatchProgress
from enrollments_payments.models import (
    Enrollment, EnrollmentStatus,
    EnrollmentRequest, EnrollmentRequestStatus, PaymentMethod, Payment
)
from attendance.models import LectureAttendance


class EmpiricalPaywallAndAccessChallengeTests(TestCase):
    """Adversarial stress-testing of paywall security and lecture access gating."""

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

        # Users
        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201011110001', password='Password123!',
            first_name='Super', last_name='Admin', role='admin',
            is_staff=True, is_superuser=True, dob='1980-01-01', gender='male'
        )

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201011110002', password='Password123!',
            first_name='Prof', last_name='Alpha', role='instructor',
            dob='1985-01-01', gender='male'
        )
        self.instructor = Instructor.objects.create(user=self.instructor_user, monthly_salary=1000)

        self.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201011110003', password='Password123!',
            first_name='Prof', last_name='Beta', role='instructor',
            dob='1985-01-01', gender='male'
        )
        self.other_instructor = Instructor.objects.create(user=self.other_instructor_user, monthly_salary=1000)

        # Students
        self.student_a_user = CustomUser.objects.create_user(
            phone_number1='+201011110004', password='Password123!',
            first_name='Student', last_name='A', role='student',
            dob='2006-01-01', gender='male'
        )
        self.student_a = self.student_a_user.student_profile

        self.student_b_user = CustomUser.objects.create_user(
            phone_number1='+201011110005', password='Password123!',
            first_name='Student', last_name='B', role='student',
            dob='2007-01-01', gender='female'
        )
        self.student_b = self.student_b_user.student_profile

        # Parents and Children
        self.parent_p1_user = CustomUser.objects.create_user(
            phone_number1='+201011110006', password='Password123!',
            first_name='Parent', last_name='P1', role='parent',
            dob='1980-01-01', gender='female'
        )
        self.parent_p1 = self.parent_p1_user.parent_profile

        self.child_c1 = Child.objects.create(
            first_name='Child', last_name='C1', primary_parent=self.parent_p1,
            dob='2015-01-01', gender='boy'
        )

        self.parent_p2_user = CustomUser.objects.create_user(
            phone_number1='+201011110007', password='Password123!',
            first_name='Parent', last_name='P2', role='parent',
            dob='1982-01-01', gender='male'
        )
        self.parent_p2 = self.parent_p2_user.parent_profile
        # P2 is secondary parent of C1
        ChildParents.objects.create(child=self.child_c1, parent=self.parent_p2)

        self.parent_p3_user = CustomUser.objects.create_user(
            phone_number1='+201011110008', password='Password123!',
            first_name='Parent', last_name='P3', role='parent',
            dob='1983-01-01', gender='male'
        )
        self.parent_p3 = self.parent_p3_user.parent_profile

        self.child_c3 = Child.objects.create(
            first_name='Child', last_name='C3', primary_parent=self.parent_p3,
            dob='2016-01-01', gender='girl'
        )

        # Courses
        self.online_course_1 = OnlineCourse.objects.create(
            name='Advanced Robotics', description='Robotics course',
            instructor=self.instructor, price=300.00, is_active=True, is_published=True
        )
        self.lecture_1 = VideoLecture.objects.create(
            course=self.online_course_1, title='Robot Kinematics',
            order=1, video_url='https://cdn.example.com/robotics/kinematics.mp4',
            duration_seconds=1800
        )
        self.material_1 = OnlineLectureMaterial.objects.create(
            lecture=self.lecture_1, title='Kinematics Handout',
            external_url='https://cdn.example.com/robotics/kinematics.pdf', order=1
        )

        self.online_course_2 = OnlineCourse.objects.create(
            name='Quantum Computing', description='Quantum course',
            instructor=self.other_instructor, price=400.00, is_active=True, is_published=True
        )

    def test_unauthenticated_user_paywall_redaction(self):
        """Unauthenticated GET must redact video_url and materials completely."""
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        lectures = data.get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

    def test_student_enrolled_in_other_course_paywall_redaction(self):
        """Student enrolled in Course 2 cannot see Course 1 video/materials."""
        Enrollment.objects.create(
            online_course=self.online_course_2, student=self.student_a,
            status=EnrollmentStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.student_a_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

    def test_inactive_enrollment_status_paywall_redaction(self):
        """Student with 'suspended' or 'dropped' status must be blocked by paywall."""
        enrollment = Enrollment.objects.create(
            online_course=self.online_course_1, student=self.student_a,
            status=EnrollmentStatus.SUSPENDED
        )
        self.client.force_authenticate(user=self.student_a_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

        # Change to dropped
        enrollment.status = EnrollmentStatus.DROPPED
        enrollment.save()
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/')
        lectures = response.json().get('video_lectures', [])
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

    def test_active_enrolled_student_access(self):
        """Active student has full access to video_url and materials."""
        Enrollment.objects.create(
            online_course=self.online_course_1, student=self.student_a,
            status=EnrollmentStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.student_a_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertEqual(lectures[0]['video_url'], 'https://cdn.example.com/robotics/kinematics.mp4')
        self.assertEqual(len(lectures[0]['materials']), 1)
        self.assertEqual(lectures[0]['materials'][0]['title'], 'Kinematics Handout')

    def test_primary_and_secondary_parent_online_course_access(self):
        """Both primary (P1) and secondary (P2) parents can view child's online course assets."""
        Enrollment.objects.create(
            online_course=self.online_course_1, child=self.child_c1,
            status=EnrollmentStatus.ACTIVE
        )

        # Primary parent P1 with child param
        self.client.force_authenticate(user=self.parent_p1_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/?child={self.child_c1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertEqual(lectures[0]['video_url'], 'https://cdn.example.com/robotics/kinematics.mp4')
        self.assertEqual(len(lectures[0]['materials']), 1)

        # Secondary parent P2 with child param
        self.client.force_authenticate(user=self.parent_p2_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/?child={self.child_c1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertEqual(lectures[0]['video_url'], 'https://cdn.example.com/robotics/kinematics.mp4')
        self.assertEqual(len(lectures[0]['materials']), 1)

    def test_unrelated_parent_cannot_access_child_online_course(self):
        """Parent P3 attempting to supply Child C1's id must be denied."""
        Enrollment.objects.create(
            online_course=self.online_course_1, child=self.child_c1,
            status=EnrollmentStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.parent_p3_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/?child={self.child_c1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

    def test_non_assigned_instructor_access_denied(self):
        """Instructor teaching Course 2 cannot access Course 1 video/materials."""
        self.client.force_authenticate(user=self.other_instructor_user)
        response = self.client.get(f'/api/online-courses/courses/{self.online_course_1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lectures = response.json().get('video_lectures', [])
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])


class EmpiricalPolymorphicEnrollmentChallengeTests(TestCase):
    """Stress-testing polymorphic enrollment requests and payments for online courses."""

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201022220001', password='Password123!',
            first_name='Admin', role='admin', is_staff=True, is_superuser=True,
            dob='1980-01-01', gender='male'
        )

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201022220002', password='Password123!',
            first_name='Instructor', role='instructor', dob='1985-01-01', gender='male'
        )
        self.instructor = Instructor.objects.create(user=self.instructor_user, monthly_salary=1500)

        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201022220003', password='Password123!',
            first_name='Parent', role='parent', dob='1980-01-01', gender='male'
        )
        self.parent = self.parent_user.parent_profile
        self.child = Child.objects.create(
            first_name='Kid', last_name='One', primary_parent=self.parent,
            dob='2014-01-01', gender='boy'
        )

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201022220004', password='Password123!',
            first_name='Adult', last_name='Student', role='student',
            dob='2000-01-01', gender='female'
        )
        self.student = self.student_user.student_profile

        self.online_course = OnlineCourse.objects.create(
            name='Deep Learning 101', description='Comprehensive Deep Learning',
            instructor=self.instructor, price=500.00, is_active=True, is_published=True
        )

    def test_polymorphic_request_creation_and_rejection_of_dual_targets(self):
        """Cross-validation: submitting both course and online_course or neither must fail."""
        season = Season.objects.create(name='S1', start_date=self.today, end_date=self.today + timedelta(days=60))
        phys_course = Course.objects.create(
            name='Physical ML', season=season, start_date=self.today, end_date=self.today + timedelta(days=60),
            price=600.00, capacity=20
        )

        self.client.force_authenticate(user=self.student_user)

        # Both course and online_course
        res = self.client.post('/api/enrollment-requests/', {
            'course': phys_course.id,
            'online_course': self.online_course.id
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Neither course nor online_course
        res = self.client.post('/api/enrollment-requests/', {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_online_course_request_lifecycle_and_approval(self):
        """Create online course request -> serialize -> approve -> verify enrollment and payment."""
        self.client.force_authenticate(user=self.student_user)

        # 1. Create request
        res = self.client.post('/api/enrollment-requests/', {
            'online_course': self.online_course.id,
            'price': '500.00',
            'payment_method': 'vodafone_cash',
            'notes': 'Online registration'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        req_id = res.data['id']

        # 2. View user list & detail
        res_list = self.client.get('/api/enrollment-requests/my-requests/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.json()['results'] if 'results' in res_list.json() else res_list.json()), 1)

        res_detail = self.client.get(f'/api/enrollment-requests/{req_id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        detail_data = res_detail.json()
        self.assertEqual(detail_data['course_name'], 'Deep Learning 101')
        self.assertEqual(float(detail_data['course_price']), 500.00)
        self.assertEqual(detail_data['course_instructor'], self.instructor_user.get_full_name())

        # 3. Admin list & detail
        self.client.force_authenticate(user=self.admin_user)
        admin_list = self.client.get('/api/admin/enrollment-requests/')
        self.assertEqual(admin_list.status_code, status.HTTP_200_OK)

        admin_detail = self.client.get(f'/api/admin/enrollment-requests/{req_id}/')
        self.assertEqual(admin_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_detail.json()['course_name'], 'Deep Learning 101')

        # 4. Admin approve request
        approve_res = self.client.post(f'/api/admin/enrollment-requests/{req_id}/approve/', {
            'paid_amount': '500.00',
            'payment_method': 'vodafone_cash',
            'payment_notes': 'Confirmed payment'
        })
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK, approve_res.data)

        # 5. Verify created enrollment and payment
        req = EnrollmentRequest.objects.get(id=req_id)
        self.assertEqual(req.status, EnrollmentRequestStatus.ACCEPTED)

        enrollment = Enrollment.objects.get(online_course=self.online_course, student=self.student)
        self.assertEqual(enrollment.status, EnrollmentStatus.ACTIVE)
        self.assertIsNone(enrollment.course)

        payment = Payment.objects.get(enrollment=enrollment)
        self.assertEqual(payment.amount, 500.00)
        self.assertEqual(payment.method, 'vodafone_cash')
        self.assertEqual(payment.status, 'paid')
        self.assertEqual(payment.payer_student, self.student)


class EmpiricalUUIDBatchResilienceTests(TestCase):
    """Stress-testing UUID batch endpoint against adversarial and malformed inputs."""

    def setUp(self):
        self.client = APIClient()
        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201033330001', password='Password123!',
            first_name='Ins', role='instructor', dob='1980-01-01', gender='male'
        )
        self.instructor = Instructor.objects.create(user=self.instructor_user, monthly_salary=1000)

        self.course_1 = OnlineCourse.objects.create(
            name='Course 1', instructor=self.instructor, price=100, is_active=True, is_published=True
        )
        self.course_2 = OnlineCourse.objects.create(
            name='Course 2', instructor=self.instructor, price=200, is_active=True, is_published=True
        )

    def test_batch_adversarial_queries(self):
        test_queries = [
            '',                                      # empty
            '   ',                                   # whitespace
            ',,,',                                   # only commas
            'invalid-uuid-string',                   # random string
            '12345',                                 # numbers
            '\' OR 1=1 --',                          # SQL injection attempt
            '<script>alert(1)</script>',             # XSS payload
            f'{self.course_1.id},,,,',               # trailing commas
            f'  {self.course_1.id}  ,  {self.course_2.id}  ', # surrounding spaces
            f'not-uuid,{self.course_1.id},fake-uuid', # mixed valid and invalid
            str(uuid.uuid4()),                       # non-existent valid UUID
        ]

        for q in test_queries:
            response = self.client.get(f'/api/online-courses/courses/batch/?ids={q}')
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed on query: {q}")
            data = response.json()
            self.assertIsInstance(data, list)


class EmpiricalWatchProgressAndReplayTests(TestCase):
    """Stress-testing video progress tracking, high-water mark, and multi-session replays."""

    def setUp(self):
        self.client = APIClient()
        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201044440001', password='Password123!',
            first_name='Video', last_name='Watcher', role='student',
            dob='2005-01-01', gender='male'
        )
        self.student = self.student_user.student_profile

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201044440002', password='Password123!',
            first_name='Teacher', role='instructor', dob='1980-01-01', gender='male'
        )
        self.instructor = Instructor.objects.create(user=self.instructor_user, monthly_salary=1000)

        self.course = OnlineCourse.objects.create(
            name='Video Stream Course', instructor=self.instructor, price=100, is_active=True, is_published=True
        )
        self.lecture = VideoLecture.objects.create(
            course=self.course, title='Lecture 1', duration_seconds=500,
            video_url='https://stream.example.com/lec1.mp4', order=1
        )
        self.enrollment = Enrollment.objects.create(
            online_course=self.course, student=self.student, status=EnrollmentStatus.ACTIVE
        )

    def test_progress_full_lifecycle_and_multi_replay(self):
        self.client.force_authenticate(user=self.student_user)
        url = f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture.id}/progress/'

        # Step 1: Initial progress at 250s (50%)
        res = self.client.post(url, {'watched_seconds': 250, 'total_seconds': 500, 'last_position_seconds': 250})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['watched_seconds'], 250)
        self.assertFalse(res.json()['is_completed'])

        # Step 2: Rewind to 50s
        res = self.client.post(url, {'watched_seconds': 50, 'total_seconds': 500, 'last_position_seconds': 50})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['watched_seconds'], 250) # High-water mark retained
        self.assertEqual(res.json()['last_position_seconds'], 50)

        # Step 3: Complete video (475s / 500s = 95% >= 90%)
        res = self.client.post(url, {'watched_seconds': 475, 'total_seconds': 500, 'last_position_seconds': 475})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()['is_completed'])
        self.assertEqual(res.json()['watch_count'], 1)

        # Step 4: Restart video from 0s (< 15s) -> Resets completion for replay
        res = self.client.post(url, {'watched_seconds': 2, 'total_seconds': 500, 'last_position_seconds': 2})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.json()['is_completed'])
        self.assertEqual(res.json()['watched_seconds'], 2)
        self.assertEqual(res.json()['watch_count'], 1)

        # Step 5: Advance replay to completion (480s / 500s) -> watch_count becomes 2
        res = self.client.post(url, {'watched_seconds': 480, 'total_seconds': 500, 'last_position_seconds': 480})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()['is_completed'])
        self.assertEqual(res.json()['watch_count'], 2)


class EmpiricalSecondaryParentAccessTests(TestCase):
    """Stress-testing secondary parent lecture view and attendance prefetching."""

    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

        self.admin = CustomUser.objects.create_user(
            phone_number1='+201055550001', password='Password123!',
            first_name='Admin', role='admin', is_staff=True, is_superuser=True,
            dob='1980-01-01', gender='male'
        )

        self.p1_user = CustomUser.objects.create_user(
            phone_number1='+201055550002', password='Password123!',
            first_name='Primary', role='parent', dob='1980-01-01', gender='female'
        )
        self.p1 = self.p1_user.parent_profile

        self.p2_user = CustomUser.objects.create_user(
            phone_number1='+201055550003', password='Password123!',
            first_name='Secondary', role='parent', dob='1982-01-01', gender='male'
        )
        self.p2 = self.p2_user.parent_profile

        self.unrelated_p_user = CustomUser.objects.create_user(
            phone_number1='+201055550004', password='Password123!',
            first_name='Stranger', role='parent', dob='1985-01-01', gender='male'
        )

        self.child = Child.objects.create(
            first_name='Daughter', last_name='Test', primary_parent=self.p1,
            dob='2015-01-01', gender='girl'
        )
        ChildParents.objects.create(child=self.child, parent=self.p2)

        season = Season.objects.create(name='Season A', start_date=self.today, end_date=self.today + timedelta(days=30))
        self.course = Course.objects.create(
            name='Math Camp', season=season, start_date=self.today, end_date=self.today + timedelta(days=30),
            price=150.00, capacity=10
        )
        self.lecture = Lecture.objects.create(
            course=self.course, lecture_number=1, title='Algebra Basics',
            day=self.today, start_time=time(10, 0), end_time=time(12, 0),
            status=LectureStatus.COMPLETED, is_accepted=True
        )

        Enrollment.objects.create(course=self.course, child=self.child, status=EnrollmentStatus.ACTIVE)
        self.att, _ = LectureAttendance.objects.get_or_create(
            lecture=self.lecture, child=self.child,
            defaults={'marked_by': self.admin}
        )
        self.att.present = True
        self.att.rating = 10
        self.att.notes = 'Brilliant'
        self.att.marked_by = self.admin
        self.att.marked_at = timezone.now()
        self.att.save()

    def test_secondary_parent_receives_child_attendance(self):
        """Secondary parent P2 must be able to view child's physical lecture attendance."""
        self.client.force_authenticate(user=self.p2_user)
        response = self.client.get(f'/api/courses/{self.course.id}/parent/{self.child.id}/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.lecture.id)
        self.assertIsNotNone(data[0]['attendance_info'])
        self.assertTrue(data[0]['attendance_info']['present'])
        self.assertEqual(data[0]['attendance_info']['rating'], 10)

    def test_unrelated_parent_gets_empty_list(self):
        """Unrelated parent attempting to view child's lectures gets empty list."""
        self.client.force_authenticate(user=self.unrelated_p_user)
        response = self.client.get(f'/api/courses/{self.course.id}/parent/{self.child.id}/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 0)


class EmpiricalAgeEligibilityChallengeTests(TestCase):
    """Stress-testing age eligibility logic for 16-17 year old students."""

    def setUp(self):
        self.today = timezone.localdate()
        self.season = Season.objects.create(
            name='Spring Season', start_date=self.today, end_date=self.today + timedelta(days=60)
        )

    def _create_student_of_age(self, age_years):
        phone_suffix = f"{age_years:02d}"[-2:]
        user = CustomUser.objects.create_user(
            phone_number1=f'+2010666600{phone_suffix}', password='Password123!',
            first_name=f'Age{age_years}', role='student',
            dob=self.today - timedelta(days=int(365.25 * age_years) + 5),
            gender='male'
        )
        user.refresh_from_db()
        return user.student_profile

    def test_age_eligibility_boundaries(self):
        student_13 = self._create_student_of_age(13)
        student_14 = self._create_student_of_age(14)
        student_16 = self._create_student_of_age(16)
        student_17 = self._create_student_of_age(17)
        student_18 = self._create_student_of_age(18)
        student_19 = self._create_student_of_age(19)

        # Course with range 14 - 18, for_adults=False
        course_teen = Course.objects.create(
            name='Youth Coding', season=self.season, start_date=self.today,
            end_date=self.today + timedelta(days=60), price=200, capacity=20,
            for_adults=False, min_age=14, max_age=18
        )

        self.assertFalse(course_teen.is_participant_eligible(student_13))
        self.assertTrue(course_teen.is_participant_eligible(student_14))
        self.assertTrue(course_teen.is_participant_eligible(student_16))
        self.assertTrue(course_teen.is_participant_eligible(student_17))
        self.assertTrue(course_teen.is_participant_eligible(student_18))
        self.assertFalse(course_teen.is_participant_eligible(student_19))

        # Course with for_adults=False and no min/max age
        course_open = Course.objects.create(
            name='Open Workshop', season=self.season, start_date=self.today,
            end_date=self.today + timedelta(days=60), price=200, capacity=20,
            for_adults=False, min_age=None, max_age=None
        )
        self.assertTrue(course_open.is_participant_eligible(student_16))
        self.assertTrue(course_open.is_participant_eligible(student_17))
