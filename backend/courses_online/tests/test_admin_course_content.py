from django.test import TestCase
from django.urls import reverse

from courses_online.models import OnlineCourse, OnlineLectureMaterial, VideoLecture
from users.models import CustomUser, Instructor


class CourseContentAdminTests(TestCase):
    """The course admin page carries the whole course: lectures and their materials."""

    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            phone_number1='+201100000040', password='Password123!',
            first_name='Super', last_name='Admin', dob='1985-01-01', gender='male',
        )
        self.client.force_login(self.admin)

        instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000041', password='Password123!',
            first_name='Prof', last_name='Admin', role='instructor',
            dob='1980-01-01', gender='male',
        )
        self.instructor = Instructor.objects.create(user=instructor_user, monthly_salary=1000)

        self.course = OnlineCourse.objects.create(
            name='Admin Course', description='Managed from one page',
            instructor=self.instructor, price=150.00,
        )
        self.lecture = VideoLecture.objects.create(
            course=self.course, order=1, title='Lecture 1',
            video_url='https://www.youtube.com/watch?v=abcdefghijk', duration_seconds=300,
        )
        self.material = OnlineLectureMaterial.objects.create(
            lecture=self.lecture, title='Slides', file_type='pdf',
            external_url='https://drive.google.com/file/d/xyz/view', order=1,
        )

    def test_course_pages_render(self):
        for name, args in (
            ('admin:courses_online_onlinecourse_changelist', ()),
            ('admin:courses_online_onlinecourse_add', ()),
            ('admin:courses_online_onlinecourse_change', (self.course.pk,)),
        ):
            response = self.client.get(reverse(name, args=args))
            self.assertEqual(response.status_code, 200, name)

    def test_change_page_embeds_lectures_and_materials(self):
        response = self.client.get(
            reverse('admin:courses_online_onlinecourse_change', args=(self.course.pk,)))
        body = response.content.decode()
        self.assertIn('Lecture 1', body)
        self.assertIn('Slides', body)
        # Nested formset prefixes: lectures under the course, materials under each lecture.
        self.assertIn('name="video_lectures-TOTAL_FORMS"', body)
        self.assertIn('name="video_lectures-0-materials-TOTAL_FORMS"', body)

    def test_lectures_are_not_listed_on_the_admin_index(self):
        response = self.client.get(reverse('admin:index'))
        body = response.content.decode()
        self.assertIn(reverse('admin:courses_online_onlinecourse_changelist'), body)
        self.assertNotIn(reverse('admin:courses_online_videolecture_changelist'), body)

    def test_saving_the_course_page_updates_nested_content(self):
        url = reverse('admin:courses_online_onlinecourse_change', args=(self.course.pk,))
        data = {
            'name': 'Admin Course', 'description': 'Managed from one page',
            'instructor': self.instructor.pk, 'price': '150.00',
            'access_validity_days': '365', 'allow_replay': 'on',
            'is_published': 'on', 'is_active': 'on', 'slug': '',
            # Lectures formset
            'video_lectures-TOTAL_FORMS': '2', 'video_lectures-INITIAL_FORMS': '1',
            'video_lectures-MIN_NUM_FORMS': '0', 'video_lectures-MAX_NUM_FORMS': '1000',
            'video_lectures-0-id': str(self.lecture.pk), 'video_lectures-0-course': str(self.course.pk),
            'video_lectures-0-order': '1', 'video_lectures-0-title': 'Lecture 1 (renamed)',
            'video_lectures-0-description': '', 'video_lectures-0-video_platform': 'youtube',
            'video_lectures-0-duration_seconds': '300',
            'video_lectures-0-video_url': 'https://www.youtube.com/watch?v=abcdefghijk',
            'video_lectures-0-live_stream_time': '',
            'video_lectures-1-id': '', 'video_lectures-1-course': str(self.course.pk),
            'video_lectures-1-order': '2', 'video_lectures-1-title': 'Lecture 2 (new)',
            'video_lectures-1-description': 'Notes', 'video_lectures-1-video_platform': 'youtube',
            'video_lectures-1-duration_seconds': '120',
            'video_lectures-1-video_url': 'https://www.youtube.com/watch?v=lmnopqrstuv',
            'video_lectures-1-live_stream_time': '',
            # Materials of lecture 0 (existing one kept, one added)
            'video_lectures-0-materials-TOTAL_FORMS': '2', 'video_lectures-0-materials-INITIAL_FORMS': '1',
            'video_lectures-0-materials-MIN_NUM_FORMS': '0', 'video_lectures-0-materials-MAX_NUM_FORMS': '1000',
            'video_lectures-0-materials-0-id': str(self.material.pk),
            'video_lectures-0-materials-0-lecture': str(self.lecture.pk),
            'video_lectures-0-materials-0-order': '1', 'video_lectures-0-materials-0-title': 'Slides',
            'video_lectures-0-materials-0-file_type': 'pdf',
            'video_lectures-0-materials-0-external_url': 'https://drive.google.com/file/d/xyz/view',
            'video_lectures-0-materials-1-id': '', 'video_lectures-0-materials-1-lecture': str(self.lecture.pk),
            'video_lectures-0-materials-1-order': '2', 'video_lectures-0-materials-1-title': 'Worksheet',
            'video_lectures-0-materials-1-file_type': 'doc',
            'video_lectures-0-materials-1-external_url': 'https://drive.google.com/file/d/abc/view',
            # Materials of the new lecture (none)
            'video_lectures-1-materials-TOTAL_FORMS': '0', 'video_lectures-1-materials-INITIAL_FORMS': '0',
            'video_lectures-1-materials-MIN_NUM_FORMS': '0', 'video_lectures-1-materials-MAX_NUM_FORMS': '1000',
            '_save': 'Save',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302, response.content.decode()[:2000])

        self.course.refresh_from_db()
        titles = list(self.course.video_lectures.order_by('order').values_list('title', flat=True))
        self.assertEqual(titles, ['Lecture 1 (renamed)', 'Lecture 2 (new)'])
        self.assertEqual(
            list(self.lecture.materials.order_by('order').values_list('title', flat=True)),
            ['Slides', 'Worksheet'],
        )
