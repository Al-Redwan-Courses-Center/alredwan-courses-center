#!/usr/bin/env python3
"""
Tests for instructor schedule API endpoints.

These tests cover:
- SupervisorScheduleListView with role-based access
- SupervisorScheduleDetailView with permissions
- MyScheduleView for instructors
- Filtering by instructor, day_of_week, and time
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta, time

from users.models import CustomUser, Instructor
from courses.models import Season
from attendance.models import SupervisorSchedule


class ScheduleAPIBaseTestCase(TestCase):
    """Base test case with common setup for schedule API tests."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class."""
        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000001',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            email='admin_sched@test.com',
            dob='1985-01-01',
            gender='male',
            is_staff=True,
            is_superuser=True,
            role='admin'
        )

        # Create supervisor user (has role='supervisor')
        cls.supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201100000002',
            password='supervisorpass123',
            first_name='Supervisor',
            last_name='User',
            email='supervisor_sched@test.com',
            dob='1987-01-01',
            gender='male',
            role='supervisor'
        )
        cls.supervisor_instructor = Instructor.objects.create(
            user=cls.supervisor_user,
            monthly_salary=6000.00,
            type='supervisor',
            fingerprint_id='FP_SUPER_SCHED_001'
        )

        # Create regular instructor user 1
        cls.instructor_user1 = CustomUser.objects.create_user(
            phone_number1='+201100000003',
            password='instrpass123',
            first_name='Instructor',
            last_name='One',
            email='instructor1_sched@test.com',
            dob='1990-01-01',
            gender='male',
            role='instructor'
        )
        cls.instructor1 = Instructor.objects.create(
            user=cls.instructor_user1,
            monthly_salary=4000.00,
            type='normal',
            fingerprint_id='FP_INSTR_SCHED_001'
        )

        # Create regular instructor user 2
        cls.instructor_user2 = CustomUser.objects.create_user(
            phone_number1='+201100000004',
            password='instrpass123',
            first_name='Instructor',
            last_name='Two',
            email='instructor2_sched@test.com',
            dob='1991-01-01',
            gender='female',
            role='instructor'
        )
        cls.instructor2 = Instructor.objects.create(
            user=cls.instructor_user2,
            monthly_salary=4500.00,
            type='normal',
            fingerprint_id='FP_INSTR_SCHED_002'
        )

        # Create regular user without instructor profile
        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201100000005',
            password='userpass123',
            first_name='Regular',
            last_name='User',
            email='regular_sched@test.com',
            dob='1992-01-01',
            gender='male'
        )

        # Create season
        cls.season = Season.objects.create(
            name='Test Season Schedule 2026',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True
        )

        # Create schedules for instructor 1 (Saturday, Sunday, Monday)
        cls.schedule1_sat = SupervisorSchedule.objects.create(
            instructor=cls.instructor1,
            day_of_week=0,  # Saturday
            start_time=time(8, 0),
            end_time=time(12, 0),
            grace_period_minutes=15,
            auto_absent_after_minutes=30
        )
        cls.schedule1_sun = SupervisorSchedule.objects.create(
            instructor=cls.instructor1,
            day_of_week=1,  # Sunday
            start_time=time(14, 0),
            end_time=time(18, 0),
            grace_period_minutes=10,
            auto_absent_after_minutes=25
        )
        cls.schedule1_mon = SupervisorSchedule.objects.create(
            instructor=cls.instructor1,
            day_of_week=2,  # Monday
            start_time=time(9, 0),
            end_time=time(13, 0),
            grace_period_minutes=15,
            auto_absent_after_minutes=30
        )

        # Create schedules for instructor 2 (Saturday, Tuesday)
        cls.schedule2_sat = SupervisorSchedule.objects.create(
            instructor=cls.instructor2,
            day_of_week=0,  # Saturday
            start_time=time(14, 0),
            end_time=time(18, 0),
            grace_period_minutes=10,
            auto_absent_after_minutes=20
        )
        cls.schedule2_tue = SupervisorSchedule.objects.create(
            instructor=cls.instructor2,
            day_of_week=3,  # Tuesday
            start_time=time(10, 0),
            end_time=time(14, 0),
            grace_period_minutes=15,
            auto_absent_after_minutes=30
        )

        # Create schedule for supervisor
        cls.schedule_supervisor = SupervisorSchedule.objects.create(
            instructor=cls.supervisor_instructor,
            day_of_week=0,  # Saturday
            start_time=time(7, 0),
            end_time=time(19, 0),
            grace_period_minutes=20,
            auto_absent_after_minutes=45
        )

    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()


class SupervisorScheduleListViewTest(ScheduleAPIBaseTestCase):
    """Tests for the schedule list endpoint."""

    def setUp(self):
        super().setUp()
        self.url = '/api/attendance/schedules/'

    # ========== Access Control Tests ==========

    def test_admin_can_view_all_schedules(self):
        """Admin users can see all schedules."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # Should see all 6 schedules
        self.assertEqual(len(results), 6)

    def test_supervisor_role_can_view_all_schedules(self):
        """Users with role='supervisor' can see all schedules."""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 6)

    def test_instructor_can_view_only_own_schedules(self):
        """Regular instructors can only see their own schedules."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # instructor1 has 3 schedules
        self.assertEqual(len(results), 3)

        # All schedules should belong to instructor1
        for schedule in results:
            self.assertEqual(schedule['instructor'], self.instructor1.pk)

    def test_instructor2_can_view_only_own_schedules(self):
        """Second instructor can only see their own schedules."""
        self.client.force_authenticate(user=self.instructor_user2)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # instructor2 has 2 schedules
        self.assertEqual(len(results), 2)

        for schedule in results:
            self.assertEqual(schedule['instructor'], self.instructor2.pk)

    def test_regular_user_without_instructor_profile_sees_nothing(self):
        """Users without instructor profile see no schedules."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_unauthenticated_access_denied(self):
        """Unauthenticated users cannot access schedules."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ========== Filtering Tests (Admin Only) ==========

    def test_filter_by_instructor(self):
        """Admin can filter schedules by instructor."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, {
            'instructor': self.instructor1.pk
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 3)

        for schedule in results:
            self.assertEqual(schedule['instructor'], self.instructor1.pk)

    def test_filter_by_day_of_week(self):
        """Admin can filter schedules by day of week."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, {
            'day_of_week': 0  # Saturday
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # 3 schedules on Saturday: instructor1, instructor2, supervisor
        self.assertEqual(len(results), 3)

        for schedule in results:
            self.assertEqual(schedule['day_of_week'], 0)

    def test_filter_by_start_time_from(self):
        """Admin can filter schedules by minimum start time."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, {
            'start_time_from': '10:00'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # Should include schedules starting at 10:00 or later
        # schedule1_sun (14:00), schedule2_sat (14:00), schedule2_tue (10:00)
        self.assertGreaterEqual(len(results), 3)

        for schedule in results:
            self.assertGreaterEqual(schedule['start_time'], '10:00:00')

    def test_filter_by_start_time_to(self):
        """Admin can filter schedules by maximum start time."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, {
            'start_time_to': '09:00'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # Schedules starting at 09:00 or earlier
        # schedule1_sat (08:00), schedule1_mon (09:00), schedule_supervisor (07:00)
        self.assertEqual(len(results), 3)

        for schedule in results:
            self.assertLessEqual(schedule['start_time'], '09:00:00')

    def test_combined_filters(self):
        """Admin can combine multiple filters."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url, {
            'day_of_week': 0,  # Saturday
            'start_time_from': '08:00',
            'start_time_to': '14:00'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # Saturday schedules starting between 08:00 and 14:00:
        # schedule1_sat (08:00), schedule2_sat (14:00)
        self.assertGreaterEqual(len(results), 2)

    # ========== Create Permission Tests ==========

    def test_admin_can_create_schedule(self):
        """Admin can create new schedules."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, {
            'instructor': self.instructor1.pk,
            'day_of_week': 4,  # Wednesday
            'start_time': '10:00',
            'end_time': '14:00',
            'grace_period_minutes': 15,
            'auto_absent_after_minutes': 30
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['day_of_week'], 4)

    def test_supervisor_role_can_create_schedule(self):
        """Users with role='supervisor' can create schedules."""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.post(self.url, {
            'instructor': self.instructor2.pk,
            'day_of_week': 5,  # Thursday
            'start_time': '08:00',
            'end_time': '12:00',
            'grace_period_minutes': 10,
            'auto_absent_after_minutes': 25
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_instructor_cannot_create_schedule(self):
        """Regular instructors cannot create schedules."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.post(self.url, {
            'instructor': self.instructor1.pk,
            'day_of_week': 4,  # Wednesday
            'start_time': '10:00',
            'end_time': '14:00',
            'grace_period_minutes': 15,
            'auto_absent_after_minutes': 30
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ========== Response Format Tests ==========

    def test_response_includes_all_fields(self):
        """Response includes all expected fields."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertGreater(len(results), 0)

        schedule = results[0]
        expected_fields = [
            'id', 'instructor', 'instructor_name', 'day_of_week',
            'day_display', 'start_time', 'end_time',
            'grace_period_minutes', 'auto_absent_after_minutes'
        ]
        for field in expected_fields:
            self.assertIn(field, schedule)

    def test_schedules_ordered_by_day_and_time(self):
        """Schedules are returned ordered by day and start time."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)

        # Check ordering
        prev_day = -1
        prev_time = ''
        for schedule in results:
            if schedule['day_of_week'] == prev_day:
                self.assertGreaterEqual(schedule['start_time'], prev_time)
            else:
                self.assertGreater(schedule['day_of_week'], prev_day)
            prev_day = schedule['day_of_week']
            prev_time = schedule['start_time']


class SupervisorScheduleDetailViewTest(ScheduleAPIBaseTestCase):
    """Tests for the schedule detail endpoint."""

    def get_url(self, pk):
        return f'/api/attendance/schedules/{pk}/'

    # ========== Read Access Tests ==========

    def test_admin_can_view_any_schedule(self):
        """Admin can view any schedule."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.get_url(self.schedule1_sat.pk))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.schedule1_sat.pk)

    def test_instructor_can_view_own_schedule(self):
        """Instructor can view their own schedule."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.get_url(self.schedule1_sat.pk))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.schedule1_sat.pk)

    def test_instructor_cannot_view_other_schedule(self):
        """Instructor cannot view another instructor's schedule."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.get_url(self.schedule2_sat.pk))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== Update Permission Tests ==========

    def test_admin_can_update_schedule(self):
        """Admin can update any schedule."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(self.get_url(self.schedule1_sat.pk), {
            'grace_period_minutes': 20
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['grace_period_minutes'], 20)

    def test_supervisor_role_can_update_schedule(self):
        """Supervisor role can update schedules."""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.patch(self.get_url(self.schedule1_sat.pk), {
            'auto_absent_after_minutes': 35
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['auto_absent_after_minutes'], 35)

    def test_instructor_cannot_update_own_schedule(self):
        """Instructor cannot update even their own schedule."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.patch(self.get_url(self.schedule1_sat.pk), {
            'grace_period_minutes': 30
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ========== Delete Permission Tests ==========

    def test_admin_can_delete_schedule(self):
        """Admin can delete schedules."""
        # Create a schedule to delete
        schedule_to_delete = SupervisorSchedule.objects.create(
            instructor=self.instructor1,
            day_of_week=6,  # Friday
            start_time=time(8, 0),
            end_time=time(12, 0),
            grace_period_minutes=15,
            auto_absent_after_minutes=30
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.get_url(schedule_to_delete.pk))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            SupervisorSchedule.objects.filter(
                pk=schedule_to_delete.pk).exists()
        )

    def test_instructor_cannot_delete_schedule(self):
        """Instructor cannot delete schedules."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.delete(self.get_url(self.schedule1_mon.pk))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Schedule should still exist
        self.assertTrue(
            SupervisorSchedule.objects.filter(
                pk=self.schedule1_mon.pk).exists()
        )


class MyScheduleViewTest(ScheduleAPIBaseTestCase):
    """Tests for the my-schedule endpoint."""

    def setUp(self):
        super().setUp()
        self.url = '/api/attendance/my-schedule/'

    def test_instructor_sees_own_schedule(self):
        """Instructor sees only their own schedules."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # instructor1 has 3 schedules
        self.assertEqual(len(results), 3)

        for schedule in results:
            self.assertEqual(schedule['instructor'], self.instructor1.pk)

    def test_instructor2_sees_own_schedule(self):
        """Second instructor sees only their own schedules."""
        self.client.force_authenticate(user=self.instructor_user2)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # instructor2 has 2 schedules
        self.assertEqual(len(results), 2)

        for schedule in results:
            self.assertEqual(schedule['instructor'], self.instructor2.pk)

    def test_supervisor_sees_own_schedule(self):
        """Supervisor sees only their own schedules (not all)."""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        # supervisor has 1 schedule
        self.assertEqual(len(results), 1)

        self.assertEqual(
            results[0]['instructor'],
            self.supervisor_instructor.pk
        )

    def test_admin_sees_nothing_if_not_instructor(self):
        """Admin without instructor profile sees empty list."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_regular_user_sees_nothing(self):
        """Regular user without instructor profile sees empty list."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)

    def test_unauthenticated_access_denied(self):
        """Unauthenticated users cannot access my-schedule."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_schedules_ordered_by_day_and_time(self):
        """My schedules are ordered by day and start time."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)

        # Check ordering: Saturday (0, 08:00), Sunday (1, 14:00), Monday (2, 09:00)
        self.assertEqual(results[0]['day_of_week'], 0)  # Saturday
        self.assertEqual(results[1]['day_of_week'], 1)  # Sunday
        self.assertEqual(results[2]['day_of_week'], 2)  # Monday

    def test_response_includes_day_display(self):
        """Response includes human-readable day name (Arabic)."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)

        # Check day_display values (Arabic day names)
        day_displays = [s['day_display'] for s in results]
        self.assertIn('السبت', day_displays)  # Saturday
        self.assertIn('الأحد', day_displays)  # Sunday
        self.assertIn('الاثنين', day_displays)  # Monday

    def test_is_read_only(self):
        """MyScheduleView is read-only (no POST allowed)."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.post(self.url, {
            'instructor': self.instructor1.pk,
            'day_of_week': 4,
            'start_time': '10:00',
            'end_time': '14:00'
        })

        self.assertEqual(response.status_code,
                         status.HTTP_405_METHOD_NOT_ALLOWED)
