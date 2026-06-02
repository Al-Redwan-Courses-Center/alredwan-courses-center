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
from courses.models import Season, Course, CourseSchedule
from attendance.models import SupervisorSchedule, InstructorAttendance, AttendanceStatus, AttendanceType

TEST_PASSWORD = 'a' * 12


class ScheduleAPIBaseTestCase(TestCase):
    """Base test case with common setup for schedule API tests."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data for all tests in this class."""
        # Create admin user
        cls.admin_user = CustomUser.objects.create_user(
            phone_number1='+201100000001',
            password=TEST_PASSWORD,
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
            password=TEST_PASSWORD,
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
            password=TEST_PASSWORD,
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
            password=TEST_PASSWORD,
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
            password=TEST_PASSWORD,
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
    """Tests for the my-schedule endpoint (combined supervisor + course schedules)."""

    def setUp(self):
        super().setUp()
        self.url = '/api/attendance/my-schedule/'

    # ---- helpers -----------------------------------------------------------

    def _supervisor_schedules(self, response):
        return response.data['supervisor_schedules']

    def _course_schedules(self, response):
        return response.data['course_schedules']

    # ---- basic structure ---------------------------------------------------

    def test_response_has_required_keys(self):
        """Response always contains supervisor_schedules and course_schedules."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('supervisor_schedules', response.data)
        self.assertIn('course_schedules', response.data)

    def test_unauthenticated_access_denied(self):
        """Unauthenticated users cannot access my-schedule."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_instructor_user_returns_404(self):
        """User without an instructor profile receives 404."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_regular_user_returns_404(self):
        """Regular user without instructor profile receives 404."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_not_allowed(self):
        """MyScheduleView is read-only (POST → 405)."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ---- supervisor_schedules ---------------------------------------------

    def test_instructor1_supervisor_schedules_count(self):
        """instructor1 has 3 supervision shifts."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self._supervisor_schedules(response)), 3)

    def test_instructor2_supervisor_schedules_count(self):
        """instructor2 has 2 supervision shifts."""
        self.client.force_authenticate(user=self.instructor_user2)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self._supervisor_schedules(response)), 2)

    def test_supervisor_sees_only_own_supervisor_schedules(self):
        """Supervisor sees only their own shifts, not everyone's."""
        self.client.force_authenticate(user=self.supervisor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        shifts = self._supervisor_schedules(response)
        self.assertEqual(len(shifts), 1)
        self.assertEqual(shifts[0]['instructor'], self.supervisor_instructor.pk)

    def test_supervisor_schedules_ordered_by_day_and_time(self):
        """Supervisor shifts are ordered by day_of_week then start_time."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        shifts = self._supervisor_schedules(response)
        # Saturday(0) → Sunday(1) → Monday(2)
        self.assertEqual(shifts[0]['day_of_week'], 0)
        self.assertEqual(shifts[1]['day_of_week'], 1)
        self.assertEqual(shifts[2]['day_of_week'], 2)

    def test_supervisor_schedule_fields(self):
        """Each supervisor schedule includes all expected fields."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        shift = self._supervisor_schedules(response)[0]
        for field in ['id', 'instructor', 'instructor_name', 'day_of_week',
                      'day_display', 'start_time', 'end_time',
                      'grace_period_minutes', 'auto_absent_after_minutes']:
            self.assertIn(field, shift)

    def test_day_display_is_arabic(self):
        """day_display is the Arabic weekday name."""
        self.client.force_authenticate(user=self.instructor_user1)
        response = self.client.get(self.url)

        displays = {s['day_display'] for s in self._supervisor_schedules(response)}
        self.assertIn('السبت', displays)   # Saturday
        self.assertIn('الأحد', displays)   # Sunday
        self.assertIn('الاثنين', displays)  # Monday


# =============================================================================
# My-schedule: course_schedules section
# =============================================================================

class MyScheduleCourseSchedulesTest(TestCase):
    """
    Tests for the course_schedules section of GET /api/attendance/my-schedule/.

    Verifies that CourseSchedule entries for courses assigned to the instructor
    are returned, properly scoped to the active season by default, and that the
    ?season_id= filter works correctly.
    """

    @classmethod
    def setUpTestData(cls):
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201200000001',
            password=TEST_PASSWORD,
            first_name='Sched',
            last_name='Instructor',
            email='sched_instr@test.com',
            dob='1990-01-01',
            gender='male',
            role='instructor',
        )
        cls.instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=4000,
            type='normal',
        )

        cls.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201200000002',
            password=TEST_PASSWORD,
            first_name='Other',
            last_name='Instructor',
            email='other_instr@test.com',
            dob='1990-01-01',
            gender='male',
            role='instructor',
        )
        cls.other_instructor = Instructor.objects.create(
            user=cls.other_instructor_user,
            monthly_salary=4000,
            type='normal',
        )

        cls.active_season = Season.objects.create(
            name='Active Season',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True,
        )
        cls.other_season = Season.objects.create(
            name='Other Season',
            season_type='summer_camp',
            start_date=timezone.localdate() - timedelta(days=200),
            end_date=timezone.localdate() - timedelta(days=100),
            is_active=False,
        )

        # Course in active season assigned to our instructor
        cls.course_active = Course.objects.create(
            name='Active Course',
            start_date=timezone.localdate() - timedelta(days=20),
            end_date=timezone.localdate() + timedelta(days=40),
            capacity=20,
            price='100.00',
            season=cls.active_season,
            instructor=cls.instructor,
        )
        cls.sched_active_sat = CourseSchedule.objects.create(
            course=cls.course_active, weekday=0, start_time=time(9, 0), end_time=time(12, 0)
        )
        cls.sched_active_mon = CourseSchedule.objects.create(
            course=cls.course_active, weekday=2, start_time=time(9, 0), end_time=time(12, 0)
        )

        # Course in old season assigned to our instructor
        cls.course_old = Course.objects.create(
            name='Old Course',
            start_date=timezone.localdate() - timedelta(days=190),
            end_date=timezone.localdate() - timedelta(days=110),
            capacity=15,
            price='80.00',
            season=cls.other_season,
            instructor=cls.instructor,
        )
        cls.sched_old = CourseSchedule.objects.create(
            course=cls.course_old, weekday=1, start_time=time(10, 0), end_time=time(13, 0)
        )

        # Course in active season for OTHER instructor (should not appear)
        cls.course_other = Course.objects.create(
            name='Other Instructor Course',
            start_date=timezone.localdate() - timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=50),
            capacity=10,
            price='50.00',
            season=cls.active_season,
            instructor=cls.other_instructor,
        )
        CourseSchedule.objects.create(
            course=cls.course_other, weekday=3, start_time=time(14, 0), end_time=time(17, 0)
        )

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/attendance/my-schedule/'

    def _course_schedules(self, response):
        return response.data['course_schedules']

    def test_active_season_default_returns_active_course_schedules(self):
        """Default (no ?season_id) returns only schedules from the active season."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cs = self._course_schedules(response)
        self.assertEqual(len(cs), 2)  # sat + mon from active course only

        course_ids = {s['course_id'] for s in cs}
        self.assertEqual(course_ids, {self.course_active.id})

    def test_season_id_param_filters_correctly(self):
        """?season_id=<id> returns schedules for that specific season only."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': self.other_season.id})

        cs = self._course_schedules(response)
        self.assertEqual(len(cs), 1)
        self.assertEqual(cs[0]['course_id'], self.course_old.id)
        self.assertEqual(cs[0]['season_id'], self.other_season.id)

    def test_season_id_all_returns_all_seasons(self):
        """?season_id=all returns course schedules across every season."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': 'all'})

        cs = self._course_schedules(response)
        self.assertEqual(len(cs), 3)  # 2 active + 1 old

    def test_other_instructors_courses_not_included(self):
        """Course schedules for other instructors are never returned."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': 'all'})

        course_ids = {s['course_id'] for s in self._course_schedules(response)}
        self.assertNotIn(self.course_other.id, course_ids)

    def test_course_schedule_fields(self):
        """Each course schedule includes all expected fields."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url)

        cs = self._course_schedules(response)
        self.assertGreater(len(cs), 0)
        entry = cs[0]
        for field in ['id', 'course_id', 'course_name', 'season_id', 'season_name',
                      'weekday', 'weekday_display', 'start_time', 'end_time']:
            self.assertIn(field, entry)

    def test_invalid_season_id_returns_400(self):
        """A non-integer, non-'all' season_id returns 400."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': 'bad'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_active_season_returns_empty_course_schedules(self):
        """When no season is active and no season_id given, course_schedules is empty."""
        # Temporarily deactivate the season
        self.active_season.is_active = False
        self.active_season.save()
        try:
            self.client.force_authenticate(user=self.instructor_user)
            response = self.client.get(self.url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(self._course_schedules(response)), 0)
        finally:
            self.active_season.is_active = True
            self.active_season.save()


# =============================================================================
# My-attendance endpoint
# =============================================================================

class MyAttendanceViewTest(TestCase):
    """
    Tests for GET /api/attendance/my-attendance/

    Verifies that an instructor sees only their own records, that filters
    work correctly, and that no N+1 queries are issued.
    """

    @classmethod
    def setUpTestData(cls):
        cls.instructor_user = CustomUser.objects.create_user(
            phone_number1='+201500000001',
            password=TEST_PASSWORD,
            first_name='Attend',
            last_name='Instructor',
            email='attend_instr@test.com',
            dob='1990-01-01',
            gender='male',
            role='instructor',
        )
        cls.instructor = Instructor.objects.create(
            user=cls.instructor_user,
            monthly_salary=4000,
            type='normal',
        )

        cls.other_instructor_user = CustomUser.objects.create_user(
            phone_number1='+201500000002',
            password=TEST_PASSWORD,
            first_name='Other',
            last_name='Attend',
            email='other_attend@test.com',
            dob='1990-01-01',
            gender='male',
            role='instructor',
        )
        cls.other_instructor = Instructor.objects.create(
            user=cls.other_instructor_user,
            monthly_salary=4000,
            type='normal',
        )

        cls.regular_user = CustomUser.objects.create_user(
            phone_number1='+201500000003',
            password=TEST_PASSWORD,
            first_name='Regular',
            last_name='User',
            dob='1990-01-01',
            gender='male',
        )

        cls.active_season = Season.objects.create(
            name='Attend Active Season',
            season_type='school',
            start_date=timezone.localdate() - timedelta(days=30),
            end_date=timezone.localdate() + timedelta(days=60),
            is_active=True,
        )
        cls.old_season = Season.objects.create(
            name='Attend Old Season',
            season_type='summer_camp',
            start_date=timezone.localdate() - timedelta(days=200),
            end_date=timezone.localdate() - timedelta(days=100),
            is_active=False,
        )

        # Records for our instructor in active season
        cls.rec_present = InstructorAttendance.objects.create(
            instructor=cls.instructor,
            date=timezone.localdate() - timedelta(days=5),
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.LECTURE,
            season=cls.active_season,
        )
        cls.rec_absent = InstructorAttendance.objects.create(
            instructor=cls.instructor,
            date=timezone.localdate() - timedelta(days=4),
            status=AttendanceStatus.ABSENT,
            attendance_type=AttendanceType.SUPERVISION,
            season=cls.active_season,
        )
        # Future record (attendance pre-created)
        cls.rec_future = InstructorAttendance.objects.create(
            instructor=cls.instructor,
            date=timezone.localdate() + timedelta(days=3),
            status=AttendanceStatus.NOT_STARTED,
            attendance_type=AttendanceType.LECTURE,
            season=cls.active_season,
        )
        # Record in old season
        cls.rec_old_season = InstructorAttendance.objects.create(
            instructor=cls.instructor,
            date=timezone.localdate() - timedelta(days=150),
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.LECTURE,
            season=cls.old_season,
        )

        # Record for OTHER instructor (must never appear)
        cls.rec_other = InstructorAttendance.objects.create(
            instructor=cls.other_instructor,
            date=timezone.localdate() - timedelta(days=5),
            status=AttendanceStatus.PRESENT,
            attendance_type=AttendanceType.LECTURE,
            season=cls.active_season,
        )

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/attendance/my-attendance/'

    def _results(self, response):
        return response.data.get('results', response.data)

    # ---- access control ---------------------------------------------------

    def test_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_instructor_returns_empty_list(self):
        """User without instructor profile gets an empty paginated list."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self._results(response)), 0)

    # ---- default (active season) ------------------------------------------

    def test_default_returns_active_season_only(self):
        """Without ?season_id, only active-season records are returned."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._results(response)
        # 3 records in active season for our instructor
        self.assertEqual(len(results), 3)

    def test_other_instructor_records_never_returned(self):
        """Records belonging to another instructor are never included."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': 'all'})

        ids = {r['id'] for r in self._results(response)}
        self.assertNotIn(self.rec_other.id, ids)

    def test_future_records_are_included(self):
        """Pre-created future attendance records are visible."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url)

        ids = {r['id'] for r in self._results(response)}
        self.assertIn(self.rec_future.id, ids)

    # ---- season_id filter -------------------------------------------------

    def test_season_id_filter(self):
        """?season_id=<id> returns only records for that season."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': self.old_season.id})

        results = self._results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.rec_old_season.id)

    def test_season_id_all_returns_all_records(self):
        """?season_id=all returns records across all seasons."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'season_id': 'all'})

        results = self._results(response)
        self.assertEqual(len(results), 4)  # 3 active + 1 old

    # ---- status filter ----------------------------------------------------

    def test_status_filter_present(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {
            'status': 'present', 'season_id': 'all'
        })
        results = self._results(response)
        self.assertTrue(all(r['status'] == 'present' for r in results))
        # rec_present (active season) + rec_old_season (old season) = 2 PRESENT records
        self.assertEqual(len(results), 2)

    def test_status_filter_absent(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'status': 'absent'})
        results = self._results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'absent')

    # ---- attendance_type filter -------------------------------------------

    def test_attendance_type_filter_lecture(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'attendance_type': 'lecture'})
        results = self._results(response)
        self.assertTrue(all(r['attendance_type'] == 'lecture' for r in results))

    def test_attendance_type_filter_supervision(self):
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url, {'attendance_type': 'supervision'})
        results = self._results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['attendance_type'], 'supervision')

    # ---- date range filters -----------------------------------------------

    def test_date_from_filter(self):
        self.client.force_authenticate(user=self.instructor_user)
        date_from = str(timezone.localdate())  # today
        response = self.client.get(self.url, {
            'date_from': date_from, 'season_id': 'all'
        })
        results = self._results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.rec_future.id)

    def test_date_to_filter(self):
        self.client.force_authenticate(user=self.instructor_user)
        date_to = str(timezone.localdate() - timedelta(days=5))
        response = self.client.get(self.url, {
            'date_to': date_to, 'season_id': 'all'
        })
        results = self._results(response)
        for r in results:
            self.assertLessEqual(r['date'], date_to)

    # ---- ordering ---------------------------------------------------------

    def test_records_ordered_by_date_descending(self):
        """Records are returned newest first."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url)

        results = self._results(response)
        dates = [r['date'] for r in results]
        self.assertEqual(dates, sorted(dates, reverse=True))

    # ---- response fields --------------------------------------------------

    def test_response_fields(self):
        """Each record includes the expected fields."""
        self.client.force_authenticate(user=self.instructor_user)
        response = self.client.get(self.url)

        results = self._results(response)
        self.assertGreater(len(results), 0)
        rec = results[0]
        for field in ['id', 'date', 'status', 'status_display',
                      'attendance_type', 'attendance_type_display',
                      'check_in_time', 'check_out_time', 'rating']:
            self.assertIn(field, rec)

    # ---- no N+1 queries ---------------------------------------------------

    def test_no_n_plus_1_queries(self):
        """
        Fetching records issues a bounded number of queries regardless of
        result count (select_related should collapse everything into one join).
        """
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        self.client.force_authenticate(user=self.instructor_user)

        with CaptureQueriesContext(connection) as ctx_small:
            self.client.get(self.url, {'season_id': 'all'})

        query_count = len(ctx_small.captured_queries)
        # With select_related, 1-3 queries total (auth + main qs + optional pagination)
        self.assertLessEqual(
            query_count, 5,
            f"Too many queries ({query_count}); check select_related coverage.",
        )
