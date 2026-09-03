from datetime import date, time, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from parents.models import Parent, Child
from courses.models import Course, Season, CourseSchedule, Lecture
from users.models.student_instructor_rating import StudentCourseRating, ParentCourseRating
from enrollments_payments.models import Enrollment, EnrollmentStatus
from attendance.models import LectureAttendance


class BatchSchedulesAndRatingsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.season = Season.objects.create(
            name='Summer 2026',
            season_type='summer',
            start_date=date(2026, 6, 1),
            end_date=date(2026, 8, 31),
            is_active=True
        )

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201000000031',
            password='Password123!',
            first_name='Dr',
            last_name='Mahmoud',
            role='instructor',
            dob='1980-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=3000
        )

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201000000032',
            password='Password123!',
            first_name='Sami',
            last_name='Student',
            role='student',
            dob='2006-01-01',
            gender='male'
        )

        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201000000033',
            password='Password123!',
            first_name='Tarek',
            last_name='Parent',
            role='parent',
            dob='1976-01-01',
            gender='male'
        )
        self.parent = self.parent_user.parent_profile

        self.child = Child.objects.create(
            first_name='Ramy',
            last_name='Tarek',
            primary_parent=self.parent,
            dob='2013-01-01',
            gender='male'
        )

        self.course1 = Course.objects.create(
            name='Physics 101',
            description='Intro to Physics',
            instructor=self.instructor,
            season=self.season,
            price=500.00,
            capacity=30,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 8, 31),
            is_active=True
        )

        self.course2 = Course.objects.create(
            name='Math 101',
            description='Intro to Math',
            instructor=self.instructor,
            season=self.season,
            price=450.00,
            capacity=25,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 8, 31),
            is_active=True
        )

        self.schedule1 = CourseSchedule.objects.create(
            course=self.course1,
            weekday=0,
            start_time=time(10, 0),
            end_time=time(12, 0)
        )
        self.schedule2 = CourseSchedule.objects.create(
            course=self.course1,
            weekday=2,
            start_time=time(10, 0),
            end_time=time(12, 0)
        )
        self.schedule3 = CourseSchedule.objects.create(
            course=self.course2,
            weekday=1,
            start_time=time(14, 0),
            end_time=time(16, 0)
        )

    def test_batch_schedules_all(self):
        response = self.client.get('/api/courses/schedules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 3)

    def test_batch_schedules_filter_course_ids(self):
        response = self.client.get(f'/api/courses/schedules/?course_ids={self.course1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 2)
        course_ids = {item['course'] for item in data}
        self.assertEqual(course_ids, {self.course1.id})

    def test_batch_schedules_filter_multiple_course_ids(self):
        response = self.client.get(f'/api/courses/schedules/?course_ids={self.course1.id},{self.course2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 3)

    def test_course_ratings_public_access_and_pagination_envelope(self):
        StudentCourseRating.objects.create(
            student=self.student_user.student_profile,
            course=self.course1,
            rating=9,
            feedback='Great physics course!'
        )
        ParentCourseRating.objects.create(
            parent=self.parent_user.parent_profile,
            course=self.course1,
            rating=10,
            feedback='My son learned a lot!'
        )

        # Unauthenticated request should succeed (public rating access)
        response = self.client.get(f'/api/courses/{self.course1.id}/ratings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data['statistics']['total_ratings'], 2)
        self.assertEqual(data['statistics']['average_rating'], 9.5)

        # Check paginated envelopes
        self.assertIn('student_ratings', data['ratings'])
        self.assertIn('parent_ratings', data['ratings'])
        
        student_ratings = data['ratings']['student_ratings']
        self.assertIn('results', student_ratings)
        self.assertEqual(student_ratings['count'], 1)
        self.assertEqual(len(student_ratings['results']), 1)
        self.assertEqual(student_ratings['results'][0]['rating'], 9)

        parent_ratings = data['ratings']['parent_ratings']
        self.assertIn('results', parent_ratings)
        self.assertEqual(parent_ratings['count'], 1)
        self.assertEqual(len(parent_ratings['results']), 1)
        self.assertEqual(parent_ratings['results'][0]['rating'], 10)

    def test_student_and_parent_lecture_views_eager_evaluation(self):
        lecture = Lecture.objects.filter(course=self.course1).first()
        if not lecture:
            lecture = Lecture.objects.create(
                course=self.course1,
                lecture_number=1,
                title='Intro Mechanics',
                day=date.today(),
                start_time=time(10, 0),
                end_time=time(12, 0),
                instructor=self.instructor,
                is_accepted=True
            )

        Enrollment.objects.create(
            course=self.course1,
            student=self.student_user.student_profile,
            status=EnrollmentStatus.ACTIVE
        )
        Enrollment.objects.create(
            course=self.course1,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

        from django.utils import timezone
        now = timezone.now()
        LectureAttendance.objects.update_or_create(
            lecture=lecture,
            student=self.student_user.student_profile,
            defaults={'present': True, 'rating': 9, 'marked_at': now}
        )
        LectureAttendance.objects.update_or_create(
            lecture=lecture,
            child=self.child,
            defaults={'present': True, 'rating': 10, 'marked_at': now}
        )

        # Student lectures endpoint
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/courses/{self.course1.id}/student/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student_lectures = response.json()
        self.assertGreaterEqual(len(student_lectures), 1)
        matched_student = [l for l in student_lectures if l['id'] == lecture.id][0]
        self.assertIsNotNone(matched_student['attendance_info'])
        self.assertTrue(matched_student['attendance_info']['present'])
        self.assertEqual(matched_student['attendance_info']['rating'], 9)

        # Parent lectures endpoint
        self.client.force_authenticate(user=self.parent_user)
        response = self.client.get(f'/api/courses/{self.course1.id}/parent/{self.child.id}/lectures/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        parent_lectures = response.json()
        self.assertGreaterEqual(len(parent_lectures), 1)
        matched_parent = [l for l in parent_lectures if l['id'] == lecture.id][0]
        self.assertIsNotNone(matched_parent['attendance_info'])
        self.assertTrue(matched_parent['attendance_info']['present'])
        self.assertEqual(matched_parent['attendance_info']['rating'], 10)
