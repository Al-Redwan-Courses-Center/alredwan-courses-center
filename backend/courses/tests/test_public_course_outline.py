from datetime import time, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, Lecture, LectureStatus, Season
from courses_online.models import OnlineCourse
from users.models import CustomUser, Instructor


class PublicCourseOutlineTests(TestCase):
    """Visitors can see a course plan, an instructor's ratings, and filter online courses by instructor."""

    @classmethod
    def setUpTestData(cls):
        today = timezone.localdate()
        cls.instructor = Instructor.objects.create(
            user=CustomUser.objects.create_user(
                phone_number1='+201100000050', password='Password123!',
                first_name='Outline', last_name='Teacher', role='instructor',
                dob='1985-01-01', gender='male',
            ),
            monthly_salary=5000, type='normal',
        )
        cls.other_instructor = Instructor.objects.create(
            user=CustomUser.objects.create_user(
                phone_number1='+201100000051', password='Password123!',
                first_name='Other', last_name='Teacher', role='instructor',
                dob='1985-01-01', gender='female',
            ),
            monthly_salary=5000, type='normal',
        )
        season = Season.objects.create(
            name='Outline Season', season_type='school',
            start_date=today - timedelta(days=30), end_date=today + timedelta(days=60),
            is_active=True,
        )
        cls.course = Course.objects.create(
            name='Outline Course', description='Plan visible to visitors',
            start_date=today, end_date=today + timedelta(days=30),
            num_lectures=2, capacity=20, price=500, is_active=True,
            season=season, instructor=cls.instructor,
            for_adults=False, min_age=8, max_age=15,
        )
        Lecture.objects.create(
            course=cls.course, lecture_number=2, title='Second topic',
            day=today + timedelta(days=8), start_time=time(10, 0), end_time=time(12, 0),
            instructor=cls.instructor, status=LectureStatus.SCHEDULED,
        )
        Lecture.objects.create(
            course=cls.course, lecture_number=1, title='First topic',
            day=today + timedelta(days=1), start_time=time(10, 0), end_time=time(12, 0),
            instructor=cls.instructor, status=LectureStatus.SCHEDULED,
        )
        cls.online_course = OnlineCourse.objects.create(
            name='Online by teacher', description='', instructor=cls.instructor, price=100,
        )
        OnlineCourse.objects.create(
            name='Online by other', description='', instructor=cls.other_instructor, price=100,
        )

    def setUp(self):
        self.client = APIClient()

    def test_course_detail_exposes_lecture_outline_in_order(self):
        response = self.client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        outline = response.json()['lectures']
        self.assertEqual([row['lecture_number'] for row in outline], [1, 2])
        self.assertEqual(outline[0]['title'], 'First topic')
        self.assertEqual(
            set(outline[0].keys()),
            {'id', 'lecture_number', 'title', 'day', 'start_time', 'end_time', 'status', 'status_display'},
        )

    def test_instructor_ratings_are_public(self):
        response = self.client.get(f'/api/users/instructors/{self.instructor.id}/ratings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('statistics', response.json())

    def test_online_courses_can_be_filtered_by_instructor(self):
        response = self.client.get(f'/api/online-courses/courses/?instructor={self.instructor.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        rows = payload['results'] if isinstance(payload, dict) else payload
        self.assertEqual([row['name'] for row in rows], ['Online by teacher'])

        response = self.client.get('/api/online-courses/courses/?instructor=not-a-number')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        rows = payload['results'] if isinstance(payload, dict) else payload
        self.assertEqual(rows, [])
