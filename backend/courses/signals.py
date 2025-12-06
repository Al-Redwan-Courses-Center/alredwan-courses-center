#!usr/bin/env python3
''' Signals for Course app'''

from datetime import timedelta, datetime, time as dt_time
from django.db import transaction
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings

from .models import CourseSchedule, Course, Lecture, Weekday


def _system_weekday_to_python(system_weekday: int) -> int:
    """
    Convert your Weekday enum (Sat=0..Fri=6) to Python's weekday() format
    where Monday=0..Sunday=6.
    """
    return (system_weekday + 5) % 7


def _iterate_dates(start_date, end_date):
    """Yield dates from start_date to end_date inclusive."""
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


def _get_course_generation_window(course: Course):
    """
    Determine generation window: (start_date, end_date, num_lectures_mode)
    - start_date: date to start generating (>= today and >= course.start_date)
    - end_date: date to stop generating (may be None)
    - num_lectures: if course.num_lectures is set, use it as target count; else None
    """
    today = timezone.localdate()
    start = max(today, course.start_date)
    end = course.end_date  # may be None
    num_lectures = course.num_lectures
    return start, end, num_lectures


@transaction.atomic
def _regenerate_future_lectures_for_course(course: Course):
    """
    Delete all future lectures (day >= today) for the course and regenerate them
    using all existing CourseSchedule rows for that course.

    Rules:
    - Keep past lectures (day < today) unchanged.
    - Regenerate future lectures from max(today, course.start_date) to course.end_date (if set)
      OR until num_lectures reached (if set).
    - Interleave schedules by calendar date; when multiple schedules fall on same day, create
      multiple lectures for that day in order of schedule.start_time.
    - Lecture.lecture_number is sequential per course across past + newly generated lectures.
    """
    today = timezone.localdate()
    start_date, end_date, target_num = _get_course_generation_window(course)

    # If neither end_date nor target_num set -> nothing to generate
    if end_date is None and not target_num:
        return

    # Delete future lectures for this course (keep past ones)
    Lecture.objects.filter(course=course, day__gte=today).delete()

    # Load schedules for the course
    schedules = list(course.schedules.all())
    if not schedules:
        # nothing to generate
        return

    # Prepare a mapping of python_weekday -> list of schedules (sorted by start_time)
    schedules_by_pyweekday = {}
    for s in schedules:
        pywd = _system_weekday_to_python(s.weekday)
        schedules_by_pyweekday.setdefault(pywd, []).append(s)

    for pywd, lst in schedules_by_pyweekday.items():
        # sort schedules with same weekday by start_time to have deterministic order
        lst.sort(key=lambda x: (
            x.start_time or dt_time.min, x.end_time or dt_time.max))
        schedules_by_pyweekday[pywd] = lst

    # Count existing past lectures to start numbering from
    past_count = Lecture.objects.filter(course=course, day__lt=today).count()
    next_number = past_count + 1

    # If target_num is set, we only need to generate up to remaining = target_num - past_count
    remaining = None
    if target_num:
        remaining = max(target_num - past_count, 0)
        if remaining == 0:
            # target already satisfied by past lectures, nothing to generate
            return

    # If end_date is None but remaining is set (num_lectures mode), set an arbitrary cap far in future
    if end_date is None and remaining:
        # will generate until remaining lectures are created
        # set an upper bound to avoid infinite loops (e.g., 2 years from start)
        end_date = start_date + timedelta(days=365 * 2)

    # Iterate days and create lectures when there's a schedule for that weekday
    created = 0
    last_date = end_date or (start_date + timedelta(days=365 * 2))
    for day in _iterate_dates(start_date, last_date):
        pywd = day.weekday()  # Python weekday
        if pywd not in schedules_by_pyweekday:
            continue

        # for each schedule on that weekday, create a lecture for that day
        for schedule in schedules_by_pyweekday[pywd]:
            # guard: do not create lecture for past time today (if start_time exists and already passed)
            if day == today and schedule.start_time:
                now = timezone.localtime()
                schedule_start_dt = timezone.make_aware(datetime.combine(day, schedule.start_time),
                                                        timezone.get_current_timezone())
                # if current time is after lecture end, skip (treat as past)
                # small buffer
                if now > schedule_start_dt + timedelta(minutes=5):
                    # skip creating today's lecture if it already mostly passed
                    continue

            # Create lecture
            Lecture.objects.create(
                course=course,
                day=day,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                lecture_number=next_number,
                instructor=course.instructor,  # default instructor; can be edited per lecture
            )
            next_number += 1
            created += 1

            # If in num_lectures mode stop when we reached remaining
            if remaining is not None:
                if created >= remaining:
                    break
        if remaining is not None and created >= remaining:
            break

    # If we generated at least one lecture and course.end_date was None but we have num_lectures mode,
    # set course.end_date to the last generated lecture day (optional). Keep this commented unless desired.
    # if target_num and created > 0 and course.end_date is None:
    #     last_lecture = Lecture.objects.filter(course=course).order_by('-day').first()
    #     if last_lecture:
    #         course.end_date = last_lecture.day
    #         course.save(update_fields=['end_date'])


@receiver(post_save, sender=CourseSchedule)
def on_schedule_saved(sender, instance: CourseSchedule, created, **kwargs):
    """
    When a schedule is created or updated:
    - Rebuild all *future* lectures for the related course (keeps past lectures).
    """
    course = instance.course
    _regenerate_future_lectures_for_course(course)


@receiver(post_delete, sender=CourseSchedule)
def on_schedule_deleted(sender, instance: CourseSchedule, **kwargs):
    """
    When a schedule is deleted:
    - Rebuild all future lectures for the course (removes lectures for that weekday).
    """
    course = instance.course
    _regenerate_future_lectures_for_course(course)


""" @receiver(post_save, sender=Lecture)
def create_lecture_attendance_on_lecture_create(sender, instance, created, **kwargs):
    ''' Create lecture attendance records when a new lecture is created '''
    if created:
        lecture = instance
        enrollments = lecture.course.enrollments.all()
        for enrollment in enrollments:
            if enrollment.child:
                LectureAttendance.objects.create(
                    lecture=lecture,
                    child=enrollment.child
                )
            elif enrollment.student:
                LectureAttendance.objects.create(
                    lecture=lecture,
                    student=enrollment.student
                )
 """

