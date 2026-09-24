from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from courses_online.locking import get_locked_lecture_ids
from courses_online.models import OnlineCourse, VideoLecture, VideoWatchProgress
from enrollments_payments.models import Enrollment, EnrollmentStatus
from parents.models import Child, Parent
from users.models import CustomUser, Instructor


class SequentialLockingTests(TestCase):
    """Lectures open one after another as the learner completes them."""

    def setUp(self):
        self.client = APIClient()

        instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000030', password='Password123!',
            first_name='Prof', last_name='Lock', role='instructor',
            dob='1980-01-01', gender='male',
        )
        self.instructor = Instructor.objects.create(user=instructor_user, monthly_salary=1000)

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201100000031', password='Password123!',
            first_name='Sara', last_name='Student', role='student',
            dob='2005-01-01', gender='female',
        )
        self.student = self.student_user.student_profile

        self.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000032', password='Password123!',
            first_name='Admin', last_name='User', role='admin',
            dob='1985-01-01', gender='male', is_staff=True,
        )

        self.course = OnlineCourse.objects.create(
            name='Sequential Course', description='Step by step',
            instructor=self.instructor, price=200.00,
            is_active=True, is_published=True,
        )
        self.lectures = [
            VideoLecture.objects.create(
                course=self.course, order=index, title=f'Lecture {index}',
                description=f'Notes {index}',
                video_url=f'https://www.youtube.com/watch?v=abcdefghij{index}',
                duration_seconds=600,
            )
            for index in (1, 2, 3)
        ]
        Enrollment.objects.create(
            online_course=self.course, student=self.student,
            status=EnrollmentStatus.ACTIVE,
        )

    # ---- helpers -----------------------------------------------------------

    def _detail(self, user, **params):
        self.client.force_authenticate(user=user)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/', params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return {row['order']: row for row in response.json()['video_lectures']}

    def _progress_url(self, lecture):
        return f'/api/online-courses/courses/{self.course.id}/lectures/{lecture.id}/progress/'

    def _complete(self, lecture, user=None, **extra):
        self.client.force_authenticate(user=user or self.student_user)
        return self.client.post(self._progress_url(lecture), {
            'watched_seconds': 600, 'total_seconds': 600,
            'last_position_seconds': 600, **extra,
        })

    # ---- pure helper -------------------------------------------------------

    def test_locked_ids_follow_first_incomplete_lecture(self):
        l1, l2, l3 = self.lectures
        self.assertEqual(get_locked_lecture_ids(self.lectures, set()), {l2.id, l3.id})
        self.assertEqual(get_locked_lecture_ids(self.lectures, {l1.id}), {l3.id})
        self.assertEqual(get_locked_lecture_ids(self.lectures, {l1.id, l2.id}), set())
        # Completing a later lecture out of band does not unlock the ones before it.
        self.assertEqual(get_locked_lecture_ids(self.lectures, {l2.id}), {l2.id, l3.id})

    # ---- API ----------------------------------------------------------------

    def test_only_first_lecture_is_open_for_a_new_learner(self):
        rows = self._detail(self.student_user)

        self.assertFalse(rows[1]['is_locked'])
        self.assertIsNotNone(rows[1]['video_url'])
        self.assertEqual(rows[1]['description'], 'Notes 1')

        for order in (2, 3):
            self.assertTrue(rows[order]['is_locked'], order)
            self.assertIsNone(rows[order]['video_url'], order)
            self.assertEqual(rows[order]['materials'], [], order)
            self.assertEqual(rows[order]['description'], '', order)
            # Titles stay visible so the learner can see what comes next.
            self.assertEqual(rows[order]['title'], f'Lecture {order}')

    def test_completing_a_lecture_unlocks_the_next_one_only(self):
        response = self._complete(self.lectures[0])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()['is_completed'])

        rows = self._detail(self.student_user)
        self.assertFalse(rows[1]['is_locked'])
        self.assertFalse(rows[2]['is_locked'])
        self.assertIsNotNone(rows[2]['video_url'])
        self.assertTrue(rows[3]['is_locked'])
        self.assertIsNone(rows[3]['video_url'])

    def test_progress_on_a_locked_lecture_is_rejected(self):
        response = self._complete(self.lectures[2])
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            VideoWatchProgress.objects.filter(lecture=self.lectures[2], student=self.student).exists()
        )

    def test_privileged_viewers_are_never_locked(self):
        for user in (self.admin_user, self.instructor.user):
            rows = self._detail(user)
            self.assertFalse(any(row['is_locked'] for row in rows.values()), user.role)
            self.assertTrue(all(row['video_url'] for row in rows.values()), user.role)

    def test_anonymous_visitor_sees_paywall_not_locks(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/online-courses/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for row in response.json()['video_lectures']:
            self.assertFalse(row['is_locked'])
            self.assertIsNone(row['video_url'])

    def test_child_progress_is_tracked_per_child(self):
        parent_user = CustomUser.objects.create_user(
            phone_number1='+201100000033', password='Password123!',
            first_name='Mona', last_name='Parent', role='parent',
            dob='1980-01-01', gender='female',
        )
        parent = Parent.objects.get(user=parent_user)
        child = Child.objects.create(
            primary_parent=parent, first_name='Adam', last_name='Kid',
            dob='2015-01-01', gender='male',
        )
        Enrollment.objects.create(
            online_course=self.course, child=child, status=EnrollmentStatus.ACTIVE,
        )

        rows = self._detail(parent_user, child=str(child.id))
        self.assertFalse(rows[1]['is_locked'])
        self.assertTrue(rows[2]['is_locked'])

        response = self._complete(self.lectures[0], user=parent_user, child=str(child.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        rows = self._detail(parent_user, child=str(child.id))
        self.assertFalse(rows[2]['is_locked'])
        self.assertTrue(rows[3]['is_locked'])
