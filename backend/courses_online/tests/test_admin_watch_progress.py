from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from courses_online.models import OnlineCourse, VideoLecture, VideoWatchProgress
from enrollments_payments.models import Enrollment, EnrollmentStatus
from users.models import CustomUser, Instructor


class WatchProgressParticipantValidationTests(TestCase):
    """A watch-progress row cannot be assigned to someone not enrolled in that course."""

    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            phone_number1='+201100000060', password='Password123!',
            first_name='Super', last_name='Admin', dob='1985-01-01', gender='male',
        )
        self.client.force_login(self.admin)

        instructor = Instructor.objects.create(
            user=CustomUser.objects.create_user(
                phone_number1='+201100000061', password='Password123!',
                first_name='Prof', last_name='Progress', role='instructor',
                dob='1980-01-01', gender='male',
            ),
            monthly_salary=1000,
        )
        self.course = OnlineCourse.objects.create(
            name='Progress Course', description='', instructor=instructor, price=100,
        )
        self.lecture = VideoLecture.objects.create(
            course=self.course, order=1, title='L1',
            video_url='https://www.youtube.com/watch?v=abcdefghijk', duration_seconds=60,
        )

        self.enrolled = CustomUser.objects.create_user(
            phone_number1='+201100000062', password='Password123!',
            first_name='Enrolled', last_name='Student', role='student',
            dob='2005-01-01', gender='male',
        ).student_profile
        self.outsider = CustomUser.objects.create_user(
            phone_number1='+201100000063', password='Password123!',
            first_name='Outsider', last_name='Student', role='student',
            dob='2005-01-01', gender='female',
        ).student_profile
        Enrollment.objects.create(
            online_course=self.course, student=self.enrolled, status=EnrollmentStatus.ACTIVE,
        )
        self.progress = VideoWatchProgress.objects.create(
            lecture=self.lecture, student=self.enrolled, watched_seconds=60, total_seconds=60,
        )

    def test_model_clean_rejects_non_enrolled_student(self):
        row = VideoWatchProgress(lecture=self.lecture, student=self.outsider)
        with self.assertRaises(ValidationError) as ctx:
            row.full_clean()
        self.assertIn('student', ctx.exception.message_dict)

    def test_model_clean_accepts_enrolled_student(self):
        # The existing row belongs to an enrolled student, so it validates cleanly.
        self.progress.full_clean()

    def test_admin_cannot_reassign_progress_to_non_enrolled_student(self):
        url = reverse('admin:courses_online_videowatchprogress_change', args=(self.progress.pk,))
        data = {
            'lecture': str(self.lecture.pk), 'student': str(self.outsider.pk), 'child': '',
            'watched_seconds': '60', 'total_seconds': '60', 'completion_percentage': '100.0',
            'is_completed': 'on', 'last_position_seconds': '60', 'watch_count': '1',
            '_save': 'Save',
        }
        response = self.client.post(url, data)
        # Validation error re-renders the form (200) instead of redirecting (302).
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'غير مشترك')
        self.progress.refresh_from_db()
        self.assertEqual(self.progress.student, self.enrolled)

    def test_admin_can_save_progress_for_enrolled_student(self):
        url = reverse('admin:courses_online_videowatchprogress_change', args=(self.progress.pk,))
        data = {
            'lecture': str(self.lecture.pk), 'student': str(self.enrolled.pk), 'child': '',
            'watched_seconds': '30', 'total_seconds': '60', 'completion_percentage': '50.0',
            'last_position_seconds': '30', 'watch_count': '0',
            '_save': 'Save',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)
        self.progress.refresh_from_db()
        self.assertEqual(self.progress.watched_seconds, 30)
