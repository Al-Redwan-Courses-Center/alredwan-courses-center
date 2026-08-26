from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from courses_online.models import OnlineCourse, VideoLecture, VideoWatchProgress
from enrollments_payments.models import Enrollment, EnrollmentStatus


class VideoProgressTrackingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000010',
            password='Password123!',
            first_name='Prof',
            last_name='X',
            role='instructor',
            dob='1980-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=1000
        )

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201100000011',
            password='Password123!',
            first_name='Youssef',
            last_name='Student',
            role='student',
            dob='2005-01-01',
            gender='male'
        )
        self.student = self.student_user.student_profile

        self.course = OnlineCourse.objects.create(
            name='Calculus I',
            description='Calculus Course',
            instructor=self.instructor,
            price=300.00,
            is_active=True,
            is_published=True
        )

        self.lecture = VideoLecture.objects.create(
            course=self.course,
            title='Limits and Continuity',
            order=1,
            video_url='https://stream.example.com/limits.mp4',
            duration_seconds=1000
        )

        # Active enrollment
        self.enrollment = Enrollment.objects.create(
            online_course=self.course,
            student=self.student,
            status=EnrollmentStatus.ACTIVE
        )

    def test_progress_high_water_mark_on_rewind(self):
        self.client.force_authenticate(user=self.student_user)

        # 1. First watch update: 400 seconds watched
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture.id}/progress/',
            {'watched_seconds': 400, 'total_seconds': 1000, 'last_position_seconds': 400}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['watched_seconds'], 400)

        # 2. Rewind: last position 100s, watched_seconds sent as 100s
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture.id}/progress/',
            {'watched_seconds': 100, 'total_seconds': 1000, 'last_position_seconds': 100}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # High-water mark must keep 400
        self.assertEqual(response.json()['watched_seconds'], 400)
        self.assertEqual(response.json()['last_position_seconds'], 100)

    def test_video_completion_and_replay_watch_count(self):
        self.client.force_authenticate(user=self.student_user)

        # 1. Complete the video (>= 90%)
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture.id}/progress/',
            {'watched_seconds': 950, 'total_seconds': 1000, 'last_position_seconds': 950}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['is_completed'])
        self.assertEqual(data['watch_count'], 1)

        # 2. User restarts video from beginning (< 15 seconds)
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture.id}/progress/',
            {'watched_seconds': 5, 'total_seconds': 1000, 'last_position_seconds': 5}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertFalse(data['is_completed'])
        self.assertEqual(data['watch_count'], 1)

        # 3. Watch through to completion second time
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/lectures/{self.lecture.id}/progress/',
            {'watched_seconds': 920, 'total_seconds': 1000, 'last_position_seconds': 920}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['is_completed'])
        self.assertEqual(data['watch_count'], 2)
