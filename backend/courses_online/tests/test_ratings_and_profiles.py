from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from parents.models import Parent
from courses_online.models import OnlineCourse
from users.models.student_instructor_rating import StudentOnlineCourseRating, ParentOnlineCourseRating


class OnlineCourseRatingsAndProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000020',
            password='Password123!',
            first_name='Dr',
            last_name='Ahmed',
            role='instructor',
            dob='1975-01-01',
            gender='male'
        )
        self.instructor = Instructor.objects.create(
            user=self.instructor_user,
            monthly_salary=1000
        )

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201100000021',
            password='Password123!',
            first_name='Mona',
            last_name='Student',
            role='student',
            dob='2007-01-01',
            gender='female'
        )

        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201100000022',
            password='Password123!',
            first_name='Hassan',
            last_name='Parent',
            role='parent',
            dob='1978-01-01',
            gender='male'
        )

        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000023',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role='admin',
            is_staff=True,
            dob='1980-01-01',
            gender='male'
        )

        self.parent = self.parent_user.parent_profile
        from parents.models import Child
        from enrollments_payments.models import Enrollment, EnrollmentStatus
        self.child = Child.objects.create(
            first_name='Kareem',
            primary_parent=self.parent,
            dob='2014-01-01',
            gender='male'
        )

        self.course = OnlineCourse.objects.create(
            name='Organic Chemistry',
            description='Organic Chemistry course',
            instructor=self.instructor,
            price=200.00,
            is_active=True,
            is_published=True
        )

        Enrollment.objects.create(
            online_course=self.course,
            student=self.student_user.student_profile,
            status=EnrollmentStatus.ACTIVE
        )
        Enrollment.objects.create(
            online_course=self.course,
            child=self.child,
            status=EnrollmentStatus.ACTIVE
        )

    def test_student_can_rate_online_course(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/rate/',
            {'rating': 9, 'feedback': 'Great course!'}
        )
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(
            StudentOnlineCourseRating.objects.filter(student=self.student_user.student_profile, course=self.course).exists()
        )

    def test_parent_can_rate_online_course(self):
        self.client.force_authenticate(user=self.parent_user)
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/rate/',
            {'rating': 10, 'feedback': 'My child loved it!'}
        )
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(
            ParentOnlineCourseRating.objects.filter(parent=self.parent_user.parent_profile, course=self.course).exists()
        )

    def test_admin_rating_submission_returns_400_not_500(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/online-courses/courses/{self.course.id}/rate/',
            {'rating': 8, 'feedback': 'Testing'}
        )
        # Should gracefully return 400, not crash with 500
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_online_course_ratings_statistics(self):
        StudentOnlineCourseRating.objects.create(
            student=self.student_user.student_profile,
            course=self.course,
            rating=8,
            feedback='Good'
        )
        ParentOnlineCourseRating.objects.create(
            parent=self.parent_user.parent_profile,
            course=self.course,
            rating=10,
            feedback='Excellent'
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/ratings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        stats = data['statistics']
        self.assertEqual(stats['total_ratings'], 2)
        self.assertEqual(stats['average_rating'], 9.0)
