#!/usr/bin/env python3
"""Tests for courses signals - lecture generation based on schedules."""
from datetime import date, time, timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone

from courses.models import Course, CourseSchedule, Lecture, Weekday
from courses.models.lecture import LectureStatus
from courses.signals import (
    _system_weekday_to_python,
    _iterate_dates,
    _get_course_generation_window,
    _regenerate_future_lectures_for_course,
)


class WeekdayConversionTests(TestCase):
    """Tests for _system_weekday_to_python function."""

    def test_saturday_conversion(self):
        """Saturday (system=0) should convert to Python's 5."""
        self.assertEqual(_system_weekday_to_python(Weekday.SATURDAY), 5)

    def test_sunday_conversion(self):
        """Sunday (system=1) should convert to Python's 6."""
        self.assertEqual(_system_weekday_to_python(Weekday.SUNDAY), 6)

    def test_monday_conversion(self):
        """Monday (system=2) should convert to Python's 0."""
        self.assertEqual(_system_weekday_to_python(Weekday.MONDAY), 0)

    def test_tuesday_conversion(self):
        """Tuesday (system=3) should convert to Python's 1."""
        self.assertEqual(_system_weekday_to_python(Weekday.TUESDAY), 1)

    def test_wednesday_conversion(self):
        """Wednesday (system=4) should convert to Python's 2."""
        self.assertEqual(_system_weekday_to_python(Weekday.WEDNESDAY), 2)

    def test_thursday_conversion(self):
        """Thursday (system=5) should convert to Python's 3."""
        self.assertEqual(_system_weekday_to_python(Weekday.THURSDAY), 3)

    def test_friday_conversion(self):
        """Friday (system=6) should convert to Python's 4."""
        self.assertEqual(_system_weekday_to_python(Weekday.FRIDAY), 4)


class IterateDatesTests(TestCase):
    """Tests for _iterate_dates helper function."""

    def test_single_day(self):
        """Iterating from a date to itself should yield that single date."""
        start = date(2026, 1, 15)
        dates = list(_iterate_dates(start, start))
        self.assertEqual(dates, [start])

    def test_multiple_days(self):
        """Iterating over a range should yield all dates inclusive."""
        start = date(2026, 1, 15)
        end = date(2026, 1, 18)
        dates = list(_iterate_dates(start, end))
        expected = [
            date(2026, 1, 15),
            date(2026, 1, 16),
            date(2026, 1, 17),
            date(2026, 1, 18),
        ]
        self.assertEqual(dates, expected)

    def test_end_before_start(self):
        """If end < start, should yield nothing."""
        start = date(2026, 1, 20)
        end = date(2026, 1, 15)
        dates = list(_iterate_dates(start, end))
        self.assertEqual(dates, [])


class CourseGenerationWindowTests(TestCase):
    """Tests for _get_course_generation_window function."""

    def setUp(self):
        """Set up a test course."""
        self.today = timezone.localdate()
        self.course = Course.objects.create(
            name="Test Course",
            start_date=self.today + timedelta(days=7),
            end_date=self.today + timedelta(days=30),
            capacity=20,
            price=100.00,
        )

    def test_future_course_start(self):
        """If course starts in the future, start_date should be course.start_date."""
        start, end, num = _get_course_generation_window(self.course)
        self.assertEqual(start, self.course.start_date)
        self.assertEqual(end, self.course.end_date)
        self.assertIsNone(num)

    def test_past_course_start(self):
        """If course started in the past, start_date should be today."""
        self.course.start_date = self.today - timedelta(days=5)
        self.course.save()

        start, end, num = _get_course_generation_window(self.course)
        self.assertEqual(start, self.today)
        self.assertEqual(end, self.course.end_date)

    def test_num_lectures_mode(self):
        """If course has num_lectures, it should be returned."""
        self.course.num_lectures = 10
        self.course.end_date = None
        self.course.save()

        start, end, num = _get_course_generation_window(self.course)
        self.assertEqual(num, 10)
        self.assertIsNone(end)


class LectureGenerationSignalTests(TestCase):
    """Tests for lecture generation via signals."""

    def setUp(self):
        """Set up test data."""
        self.today = timezone.localdate()
        # Create course starting in a week, ending in 5 weeks
        self.course = Course.objects.create(
            name="Signal Test Course",
            start_date=self.today + timedelta(days=7),
            end_date=self.today + timedelta(days=35),
            capacity=15,
            price=150.00,
        )

    def test_schedule_creation_generates_lectures(self):
        """Creating a schedule should trigger lecture generation."""
        # Find the next Monday from course start_date
        course_start = self.course.start_date

        # Create schedule for Monday
        schedule = CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.MONDAY,  # System Monday = 2
            start_time=time(10, 0),
            end_time=time(12, 0),
        )

        # Lectures should be created
        lectures = Lecture.objects.filter(course=self.course)
        self.assertGreater(lectures.count(), 0)

        # All lectures should be on Monday (Python weekday 0)
        for lecture in lectures:
            self.assertEqual(lecture.day.weekday(), 0)  # Python Monday

    def test_schedule_update_regenerates_lectures(self):
        """Updating a schedule should regenerate lectures with new times."""
        # Create initial schedule
        schedule = CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.TUESDAY,
            start_time=time(9, 0),
            end_time=time(11, 0),
        )

        initial_count = Lecture.objects.filter(course=self.course).count()

        # Update the schedule time
        schedule.start_time = time(14, 0)
        schedule.end_time = time(16, 0)
        schedule.save()

        # Count should remain the same
        self.assertEqual(
            Lecture.objects.filter(course=self.course).count(),
            initial_count
        )

        # But times should be updated
        for lecture in Lecture.objects.filter(course=self.course):
            self.assertEqual(lecture.start_time, time(14, 0))
            self.assertEqual(lecture.end_time, time(16, 0))

    def test_schedule_deletion_removes_lectures(self):
        """Deleting a schedule should remove its associated future lectures."""
        # Create two schedules for different days
        schedule_mon = CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.MONDAY,
            start_time=time(10, 0),
            end_time=time(12, 0),
        )
        schedule_wed = CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.WEDNESDAY,
            start_time=time(14, 0),
            end_time=time(16, 0),
        )

        total_before = Lecture.objects.filter(course=self.course).count()
        monday_lectures_before = Lecture.objects.filter(
            course=self.course,
            day__week_day=2  # Django week_day: Monday=2
        ).count()

        # Delete Monday schedule
        schedule_mon.delete()

        # Should have fewer lectures
        total_after = Lecture.objects.filter(course=self.course).count()
        self.assertLess(total_after, total_before)

        # Wednesday lectures should still exist
        wednesday_lectures = Lecture.objects.filter(course=self.course)
        for lecture in wednesday_lectures:
            self.assertEqual(lecture.day.weekday(), 2)  # Python Wednesday

    def test_multiple_schedules_same_day(self):
        """Multiple schedules on same day should create multiple lectures per day."""
        # Create two schedules for the same day
        CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.FRIDAY,
            start_time=time(9, 0),
            end_time=time(11, 0),
        )
        CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.FRIDAY,
            start_time=time(14, 0),
            end_time=time(16, 0),
        )

        lectures = Lecture.objects.filter(course=self.course)

        # Count lectures per unique day
        days = set(l.day for l in lectures)

        # Each Friday in the range should have 2 lectures
        for day in days:
            day_lectures = lectures.filter(day=day)
            self.assertEqual(day_lectures.count(), 2)


class NumLecturesModeTests(TestCase):
    """Tests for courses using num_lectures instead of end_date."""

    def setUp(self):
        """Set up test data for num_lectures mode."""
        self.today = timezone.localdate()
        self.course = Course.objects.create(
            name="Num Lectures Course",
            start_date=self.today + timedelta(days=7),
            end_date=None,  # No end date
            num_lectures=5,
            capacity=10,
            price=200.00,
        )

    def test_generates_exact_num_lectures(self):
        """Should generate exactly num_lectures lectures."""
        CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.MONDAY,
            start_time=time(10, 0),
            end_time=time(12, 0),
        )

        lectures = Lecture.objects.filter(course=self.course)
        self.assertEqual(lectures.count(), 5)

    def test_lecture_numbers_sequential(self):
        """Lecture numbers should be sequential starting from 1."""
        CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.TUESDAY,
            start_time=time(15, 0),
            end_time=time(17, 0),
        )

        lectures = Lecture.objects.filter(
            course=self.course).order_by('lecture_number')
        expected_numbers = list(range(1, 6))  # 1, 2, 3, 4, 5
        actual_numbers = list(lectures.values_list(
            'lecture_number', flat=True))
        self.assertEqual(actual_numbers, expected_numbers)


class PastLecturePreservationTests(TestCase):
    """Tests to ensure past lectures are preserved during regeneration."""

    def setUp(self):
        """Set up course with past and future dates."""
        self.today = timezone.localdate()
        # Course that started in the past
        self.course = Course.objects.create(
            name="Past Future Course",
            start_date=self.today - timedelta(days=14),
            end_date=self.today + timedelta(days=30),
            capacity=20,
            price=100.00,
        )

    def test_past_lectures_not_deleted(self):
        """Past lectures should not be deleted when regenerating."""
        # First, manually create a "past" lecture with COMPLETED status to bypass validation
        past_lecture = Lecture.objects.create(
            course=self.course,
            day=self.today - timedelta(days=7),
            start_time=time(10, 0),
            end_time=time(12, 0),
            lecture_number=1,
            status=LectureStatus.COMPLETED,  # Completed lectures can be in the past
        )

        # Now create a schedule which triggers regeneration
        CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.WEDNESDAY,
            start_time=time(10, 0),
            end_time=time(12, 0),
        )

        # Past lecture should still exist
        self.assertTrue(
            Lecture.objects.filter(pk=past_lecture.pk).exists()
        )

    def test_lecture_numbering_continues_from_past(self):
        """New lectures should continue numbering from past lectures."""
        # Create 3 past lectures with COMPLETED status to bypass validation
        for i in range(1, 4):
            Lecture.objects.create(
                course=self.course,
                day=self.today - timedelta(days=7+i),
                start_time=time(10, 0),
                end_time=time(12, 0),
                lecture_number=i,
                status=LectureStatus.COMPLETED,  # Completed lectures can be in the past
            )

        # Create schedule to trigger new lecture generation
        CourseSchedule.objects.create(
            course=self.course,
            weekday=Weekday.THURSDAY,
            start_time=time(14, 0),
            end_time=time(16, 0),
        )

        # Future lectures should start from number 4
        future_lectures = Lecture.objects.filter(
            course=self.course,
            day__gte=self.today
        ).order_by('lecture_number')

        if future_lectures.exists():
            first_future_number = future_lectures.first().lecture_number
            self.assertEqual(first_future_number, 4)


class EdgeCaseTests(TestCase):
    """Tests for edge cases in lecture generation."""

    def setUp(self):
        """Set up test data."""
        self.today = timezone.localdate()

    def test_no_schedules_no_lectures(self):
        """Course with no schedules should have no lectures."""
        course = Course.objects.create(
            name="No Schedule Course",
            start_date=self.today + timedelta(days=7),
            end_date=self.today + timedelta(days=30),
            capacity=10,
            price=50.00,
        )

        _regenerate_future_lectures_for_course(course)

        lectures = Lecture.objects.filter(course=course)
        self.assertEqual(lectures.count(), 0)

    def test_no_end_date_no_num_lectures(self):
        """Course with neither end_date nor num_lectures generates nothing."""
        course = Course.objects.create(
            name="Open Ended Course",
            start_date=self.today + timedelta(days=7),
            end_date=self.today + timedelta(days=30),  # Required by clean()
            num_lectures=None,
            capacity=10,
            price=50.00,
        )
        # Manually set end_date to None to test edge case
        Course.objects.filter(pk=course.pk).update(end_date=None)
        course.refresh_from_db()

        _regenerate_future_lectures_for_course(course)

        # Should not generate any lectures
        lectures = Lecture.objects.filter(course=course)
        self.assertEqual(lectures.count(), 0)

    def test_course_start_in_past_generates_from_today(self):
        """Course that started in past should generate lectures from today."""
        course = Course.objects.create(
            name="Already Started Course",
            start_date=self.today - timedelta(days=30),
            end_date=self.today + timedelta(days=30),
            capacity=10,
            price=50.00,
        )

        CourseSchedule.objects.create(
            course=course,
            weekday=Weekday.SATURDAY,
            start_time=time(9, 0),
            end_time=time(11, 0),
        )

        # All generated lectures should be >= today
        lectures = Lecture.objects.filter(course=course)
        for lecture in lectures:
            self.assertGreaterEqual(lecture.day, self.today)
