#!/usr/bin/env python3
"""
Tests for course schedule CRUD endpoints.

GET/POST  /api/courses/<course_id>/schedules/
GET/PATCH/DELETE  /api/courses/<course_id>/schedules/<pk>/
"""
from datetime import date, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, CourseSchedule, Season, Weekday
from users.models import CustomUser, Instructor

TEST_PASSWORD = 'a' * 12


class CourseScheduleBaseTest(TestCase):
    """Shared setup for course schedule API tests."""

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000010',
            password=TEST_PASSWORD,
            first_name='Admin',
            last_name='User',
            email='admin_sched@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True,
        )

        cls.supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201100000011',
            password=TEST_PASSWORD,
            first_name='Supervisor',
            last_name='User',
            email='supervisor_sched@test.com',
            dob='1985-01-01',
            gender='male',
            role='supervisor',
        )

        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201100000012',
            password=TEST_PASSWORD,
            first_name='Instructor',
            last_name='User',
            email='instructor_sched@test.com',
            dob='1985-01-01',
            gender='male',
            role='instructor',
        )
        cls.instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=3000,
            type='normal',
        )

        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201100000013',
            password=TEST_PASSWORD,
            first_name='Regular',
            last_name='User',
            dob='1985-01-01',
            gender='male',
        )

        cls.season = Season.objects.create(
            name='Test Season',
            season_type='school',
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=90),
            is_active=True,
        )

        cls.course = Course.objects.create(
            name='Test Course',
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=90),
            capacity=20,
            price='500.00',
            season=cls.season,
            instructor=cls.instructor,
        )

        cls.schedule1 = CourseSchedule.objects.create(
            course=cls.course,
            weekday=Weekday.MONDAY,
            start_time='09:00:00',
            end_time='11:00:00',
        )
        cls.schedule2 = CourseSchedule.objects.create(
            course=cls.course,
            weekday=Weekday.WEDNESDAY,
            start_time='14:00:00',
            end_time='16:00:00',
        )

    def setUp(self):
        self.client = APIClient()
        self.list_url = f'/api/courses/{self.course.pk}/schedules/'
        self.detail_url = f'/api/courses/{self.course.pk}/schedules/{self.schedule1.pk}/'


class CourseScheduleListViewTest(CourseScheduleBaseTest):
    """Tests for GET/POST /api/courses/<course_id>/schedules/"""

    # ---- access control ---------------------------------------------------

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_list(self):
        """Any authenticated user can list schedules."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_existent_course_returns_404(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/courses/99999/schedules/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---- list ---------------------------------------------------------------

    def test_list_returns_all_schedules_for_course(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        ids = {s['id'] for s in results}
        self.assertIn(self.schedule1.pk, ids)
        self.assertIn(self.schedule2.pk, ids)

    def test_list_ordered_by_weekday_then_start_time(self):
        """Schedules are returned ordered by weekday then start_time."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.list_url)
        results = response.data.get('results', response.data)
        weekdays = [s['weekday'] for s in results]
        self.assertEqual(weekdays, sorted(weekdays))

    def test_schedule_fields_present(self):
        """Response includes id, weekday, weekday_display, start_time, end_time."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)
        results = response.data.get('results', response.data)
        schedule = results[0]
        for field in ['id', 'weekday', 'weekday_display', 'start_time', 'end_time']:
            self.assertIn(field, schedule)

    # ---- create -------------------------------------------------------------

    def test_admin_can_create_schedule(self):
        """Superuser/admin can add a new schedule."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.list_url, {
            'weekday': Weekday.THURSDAY,
            'start_time': '10:00:00',
            'end_time': '12:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['weekday'], Weekday.THURSDAY)
        # Cleanup
        CourseSchedule.objects.filter(pk=response.data['id']).delete()

    def test_supervisor_can_create_schedule(self):
        """User with role='supervisor' can add a schedule."""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.post(self.list_url, {
            'weekday': Weekday.FRIDAY,
            'start_time': '08:00:00',
            'end_time': '10:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        CourseSchedule.objects.filter(pk=response.data['id']).delete()

    def test_regular_instructor_cannot_create_schedule(self):
        """Regular instructor (not admin/supervisor) is denied."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.post(self.list_url, {
            'weekday': Weekday.SATURDAY,
            'start_time': '09:00:00',
            'end_time': '11:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_create_schedule(self):
        """Unauthenticated-role user is denied."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.list_url, {
            'weekday': Weekday.SATURDAY,
            'start_time': '09:00:00',
            'end_time': '11:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_with_invalid_time_returns_400(self):
        """end_time before start_time fails validation."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.list_url, {
            'weekday': Weekday.MONDAY,
            'start_time': '12:00:00',
            'end_time': '10:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_schedule_belongs_to_correct_course(self):
        """Newly created schedule is linked to the course in the URL."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.list_url, {
            'weekday': Weekday.SUNDAY,
            'start_time': '15:00:00',
            'end_time': '17:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        obj = CourseSchedule.objects.get(pk=response.data['id'])
        self.assertEqual(obj.course_id, self.course.pk)
        obj.delete()


class CourseScheduleDetailViewTest(CourseScheduleBaseTest):
    """Tests for GET/PATCH/DELETE /api/courses/<course_id>/schedules/<pk>/"""

    # ---- access control ---------------------------------------------------

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_retrieve(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.schedule1.pk)

    def test_schedule_from_other_course_returns_404(self):
        """A schedule not belonging to the URL's course_id returns 404."""
        other_course = Course.objects.create(
            name='Other Course',
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=30),
            capacity=10,
            price='200.00',
            season=self.season,
        )
        try:
            response = self.client.get(
                f'/api/courses/{other_course.pk}/schedules/{self.schedule1.pk}/'
            )
            # unauthenticated → 401, but the filter would give 404 after auth
            self.client.force_authenticate(user=self.admin_user)
            response = self.client.get(
                f'/api/courses/{other_course.pk}/schedules/{self.schedule1.pk}/'
            )
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        finally:
            other_course.delete()

    # ---- update -------------------------------------------------------------

    def test_admin_can_update_schedule(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(self.detail_url, {
            'start_time': '08:30:00',
            'end_time': '10:30:00',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.schedule1.refresh_from_db()
        self.assertEqual(str(self.schedule1.start_time), '08:30:00')
        # Restore
        self.schedule1.start_time = '09:00:00'
        self.schedule1.end_time = '11:00:00'
        self.schedule1.save()

    def test_supervisor_can_update_schedule(self):
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.patch(self.detail_url, {'end_time': '11:30:00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Restore
        self.schedule1.refresh_from_db()
        self.schedule1.end_time = '11:00:00'
        self.schedule1.save()

    def test_instructor_cannot_update_schedule(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.patch(self.detail_url, {'end_time': '12:00:00'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_update_schedule(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(self.detail_url, {'end_time': '12:00:00'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_with_invalid_time_returns_400(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(self.detail_url, {
            'start_time': '14:00:00',
            'end_time': '10:00:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- delete -------------------------------------------------------------

    def test_admin_can_delete_schedule(self):
        schedule = CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.TUESDAY,
            start_time='07:00:00',
            end_time='09:00:00',
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(
            f'/api/courses/{self.course.pk}/schedules/{schedule.pk}/'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CourseSchedule.objects.filter(pk=schedule.pk).exists())

    def test_supervisor_can_delete_schedule(self):
        schedule = CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.FRIDAY,
            start_time='07:00:00',
            end_time='09:00:00',
        )
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.delete(
            f'/api/courses/{self.course.pk}/schedules/{schedule.pk}/'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_instructor_cannot_delete_schedule(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_delete_schedule(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
