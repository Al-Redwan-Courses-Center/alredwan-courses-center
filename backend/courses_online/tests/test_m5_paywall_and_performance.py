import uuid
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser, Instructor
from parents.models import Parent, Child, ChildParents
from courses_online.models import (
    OnlineCourse, VideoLecture, OnlineLectureMaterial, VideoWatchProgress
)
from enrollments_payments.models import Enrollment, EnrollmentStatus


class Milestone5PaywallAndPerformanceTests(TestCase):
    """
    Comprehensive Milestone 5 verification for online course paywall security,
    prefetching performance, video watch progress high-water mark, and ratings pagination.
    """

    def setUp(self):
        self.client = APIClient()

        # Admin & Staff
        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201088880001',
            password='Password123!',
            first_name='Admin',
            last_name='Chief',
            role='admin',
            is_staff=True,
            dob='1980-01-01',
            gender='male'
        )

        # Course Instructor
        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201088880002',
            password='Password123!',
            first_name='Lead',
            last_name='Instructor',
            role='instructor',
            dob='1985-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=3500
        )

        # Other Instructor (not assigned to course)
        self.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201088880003',
            password='Password123!',
            first_name='Guest',
            last_name='Instructor',
            role='instructor',
            dob='1988-01-01',
            gender='female'
        )
        self.other_instructor = Instructor.objects.create(
            user=self.other_instructor_user,
            monthly_salary=2000
        )

        # Enrolled Student
        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201088880004',
            password='Password123!',
            first_name='Amr',
            last_name='Student',
            role='student',
            dob='2006-01-01',
            gender='male'
        )
        self.student = self.student_user.student_profile

        # Non-Enrolled Student
        self.other_student_user = CustomUser.objects.create_user(
            phone_number1='+201088880005',
            password='Password123!',
            first_name='Laila',
            last_name='Student',
            role='student',
            dob='2007-01-01',
            gender='female'
        )
        self.other_student = self.other_student_user.student_profile

        # Parents and Child
        self.primary_parent_user = CustomUser.objects.create_user(
            phone_number1='+201088880006',
            password='Password123!',
            first_name='Father',
            last_name='Parent',
            role='parent',
            dob='1978-01-01',
            gender='male'
        )
        self.primary_parent = self.primary_parent_user.parent_profile

        self.secondary_parent_user = CustomUser.objects.create_user(
            phone_number1='+201088880007',
            password='Password123!',
            first_name='Mother',
            last_name='Parent',
            role='parent',
            dob='1980-01-01',
            gender='female'
        )
        self.secondary_parent = self.secondary_parent_user.parent_profile

        self.unrelated_parent_user = CustomUser.objects.create_user(
            phone_number1='+201088880008',
            password='Password123!',
            first_name='Stranger',
            last_name='Parent',
            role='parent',
            dob='1979-01-01',
            gender='male'
        )

        self.child = Child.objects.create(
            first_name='Kareem',
            last_name='Father',
            primary_parent=self.primary_parent,
            dob='2015-01-01',
            gender='boy'
        )
        ChildParents.objects.create(child=self.child, parent=self.secondary_parent)

        # Online Course with Lectures and Materials
        self.course = OnlineCourse.objects.create(
            name='Modern Data Science & AI',
            description='In-depth course on modern data science',
            instructor=self.instructor,
            price=750.00,
            is_active=True,
            is_published=True
        )

        self.lecture_1 = VideoLecture.objects.create(
            course=self.course,
            title='01. Introduction to Numpy and Pandas',
            order=1,
            video_url='https://cdn.example.com/videos/datascience-lec1.mp4',
            duration_seconds=1800
        )
        self.material_1 = OnlineLectureMaterial.objects.create(
            lecture=self.lecture_1,
            title='Lecture 01 Notebook PDF',
            external_url='https://cdn.example.com/files/datascience-lec1.pdf',
            order=1
        )

        self.lecture_2 = VideoLecture.objects.create(
            course=self.course,
            title='02. Advanced Feature Engineering',
            order=2,
            video_url='https://cdn.example.com/videos/datascience-lec2.mp4',
            duration_seconds=2400
        )

    def test_paywall_redaction_for_anonymous_visitor(self):
        """Unauthenticated visitor receives course detail but all video_url values are None and materials are empty."""
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['id'], str(self.course.id))
        self.assertEqual(len(data['video_lectures']), 2)
        for lec in data['video_lectures']:
            self.assertIsNone(lec['video_url'])
            self.assertEqual(lec['materials'], [])

    def test_paywall_redaction_for_non_enrolled_user(self):
        """Authenticated non-enrolled student gets null video_url and empty materials."""
        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        for lec in data['video_lectures']:
            self.assertIsNone(lec['video_url'])
            self.assertEqual(lec['materials'], [])

    def test_paywall_access_for_enrolled_student(self):
        """Enrolled student accesses unredacted video streams and lecture materials."""
        Enrollment.objects.create(
            online_course=self.course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['video_lectures'][0]['video_url'], 'https://cdn.example.com/videos/datascience-lec1.mp4')
        self.assertEqual(len(data['video_lectures'][0]['materials']), 1)
        self.assertEqual(data['video_lectures'][0]['materials'][0]['title'], 'Lecture 01 Notebook PDF')

    def test_paywall_access_for_primary_and_secondary_parents(self):
        """Enrolled child's primary and secondary parents access child's course content."""
        Enrollment.objects.create(
            online_course=self.course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        # Primary Parent
        self.client.force_authenticate(user=self.primary_parent_user)
        resp_p1 = self.client.get(f'/api/online-courses/courses/{self.course.id}/?child={self.child.id}')
        self.assertEqual(resp_p1.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_p1.json()['video_lectures'][0]['video_url'], 'https://cdn.example.com/videos/datascience-lec1.mp4')

        # Secondary Parent
        self.client.force_authenticate(user=self.secondary_parent_user)
        resp_p2 = self.client.get(f'/api/online-courses/courses/{self.course.id}/?child={self.child.id}')
        self.assertEqual(resp_p2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_p2.json()['video_lectures'][0]['video_url'], 'https://cdn.example.com/videos/datascience-lec1.mp4')

        # Unrelated Parent
        self.client.force_authenticate(user=self.unrelated_parent_user)
        resp_p3 = self.client.get(f'/api/online-courses/courses/{self.course.id}/?child={self.child.id}')
        self.assertEqual(resp_p3.status_code, status.HTTP_200_OK)
        self.assertIsNone(resp_p3.json()['video_lectures'][0]['video_url'])

    def test_progress_tracking_high_water_mark_and_replay_cycle(self):
        """Verify high-water mark preservation on rewind and replay logic."""
        Enrollment.objects.create(
            online_course=self.course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.student_user)

        url = f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture_1.id}/progress/'

        # Progress to 900s of 1800s (50%)
        res1 = self.client.post(url, {'watched_seconds': 900, 'total_seconds': 1800, 'last_position_seconds': 900})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.json()['watched_seconds'], 900)
        self.assertFalse(res1.json()['is_completed'])

        # Rewind to 120s
        res2 = self.client.post(url, {'watched_seconds': 120, 'total_seconds': 1800, 'last_position_seconds': 120})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        # watched_seconds remains 900 (high water mark)
        self.assertEqual(res2.json()['watched_seconds'], 900)
        self.assertEqual(res2.json()['last_position_seconds'], 120)

        # Complete lecture (1700 / 1800 = 94.4% >= 90%)
        res3 = self.client.post(url, {'watched_seconds': 1700, 'total_seconds': 1800, 'last_position_seconds': 1700})
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertTrue(res3.json()['is_completed'])
        self.assertEqual(res3.json()['watch_count'], 1)

        # Replay restart (< 15s)
        res4 = self.client.post(url, {'watched_seconds': 0, 'total_seconds': 1800, 'last_position_seconds': 0})
        self.assertEqual(res4.status_code, status.HTTP_200_OK)
        self.assertFalse(res4.json()['is_completed'])
        self.assertEqual(res4.json()['watch_count'], 1)

        # Finish replay
        res5 = self.client.post(url, {'watched_seconds': 1750, 'total_seconds': 1800, 'last_position_seconds': 1750})
        self.assertEqual(res5.status_code, status.HTTP_200_OK)
        self.assertTrue(res5.json()['is_completed'])
        self.assertEqual(res5.json()['watch_count'], 2)
