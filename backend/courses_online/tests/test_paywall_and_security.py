from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
import uuid

from users.models import CustomUser, Instructor
from parents.models import Parent, Child
from courses_online.models import OnlineCourse, VideoLecture, OnlineLectureMaterial
from enrollments_payments.models import Enrollment, EnrollmentStatus


class OnlineCoursePaywallAndSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Instructor user & profile
        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000001',
            password='Password123!',
            first_name='Online',
            last_name='Teacher',
            role='instructor',
            dob='1985-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=1000
        )

        # Other instructor
        self.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000002',
            password='Password123!',
            first_name='Other',
            last_name='Teacher',
            role='instructor',
            dob='1986-01-01',
            gender='male'
        )
        self.other_instructor = Instructor.objects.create(
            user=self.other_instructor_user,
            monthly_salary=1000
        )

        # Admin user
        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000003',
            password='Password123!',
            first_name='Super',
            last_name='Admin',
            role='admin',
            is_staff=True,
            dob='1980-01-01',
            gender='male'
        )

        # Enrolled student
        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201100000004',
            password='Password123!',
            first_name='Ali',
            last_name='Student',
            role='student',
            dob='2005-01-01',
            gender='male'
        )
        self.student = self.student_user.student_profile

        # Non-enrolled student
        self.other_student_user = CustomUser.objects.create_user(
            phone_number1='+201100000005',
            password='Password123!',
            first_name='Sara',
            last_name='Student',
            role='student',
            dob='2006-01-01',
            gender='female'
        )

        # Online course
        self.course = OnlineCourse.objects.create(
            name='Python Masterclass',
            description='Learn Python from scratch',
            instructor=self.instructor,
            price=250.00,
            is_active=True,
            is_published=True
        )

        # Video lecture
        self.lecture = VideoLecture.objects.create(
            course=self.course,
            title='Intro to Python',
            order=1,
            video_url='https://stream.example.com/python-intro.mp4',
            duration_seconds=1200
        )

        # Material
        self.material = OnlineLectureMaterial.objects.create(
            lecture=self.lecture,
            title='Cheatsheet PDF',
            external_url='https://files.example.com/python-cheatsheet.pdf',
            order=1
        )

    def test_anonymous_user_cannot_access_video_or_materials(self):
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        lectures = data.get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

    def test_non_enrolled_student_cannot_access_video_or_materials(self):
        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        lectures = data.get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertIsNone(lectures[0]['video_url'])
        self.assertEqual(lectures[0]['materials'], [])

    def test_enrolled_student_can_access_video_and_materials(self):
        Enrollment.objects.create(
            online_course=self.course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        lectures = data.get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertEqual(lectures[0]['video_url'], 'https://stream.example.com/python-intro.mp4')
        self.assertEqual(len(lectures[0]['materials']), 1)
        self.assertEqual(lectures[0]['materials'][0]['title'], 'Cheatsheet PDF')

    def test_course_instructor_can_access_video_and_materials(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        lectures = data.get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertEqual(lectures[0]['video_url'], 'https://stream.example.com/python-intro.mp4')
        self.assertEqual(len(lectures[0]['materials']), 1)

    def test_admin_can_access_video_and_materials(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        lectures = data.get('video_lectures', [])
        self.assertEqual(len(lectures), 1)
        self.assertEqual(lectures[0]['video_url'], 'https://stream.example.com/python-intro.mp4')

    def test_batch_uuid_resilience(self):
        # Malformed UUID strings in batch query
        response = self.client.get('/api/online-courses/courses/batch/?ids=invalid-uuid,123,%20,not-a-uuid')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

        # Valid UUID along with malformed strings
        response = self.client.get(f'/api/online-courses/courses/batch/?ids=invalid-uuid,{self.course.id},999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], str(self.course.id))
