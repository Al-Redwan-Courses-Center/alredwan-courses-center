#!/usr/bin/env python3
"""Test script for generate_lectures() method"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE',
                      'Redwan_courses_center.settings')
django.setup()

# Import Django models AFTER setup
from datetime import date, time  # noqa: E402
from courses.models.lecture import Lecture  # noqa: E402
from courses.models import Course, CourseSchedule, Season, Weekday  # noqa: E402


# Create a test season
season, _ = Season.objects.get_or_create(
    name='Test Season',
    defaults={
        'season_type': 'summer_camp',
        'start_date': date(2026, 1, 1),
        'end_date': date(2026, 3, 31),
        'is_active': True
    }
)

# Create a test course
course, created = Course.objects.get_or_create(
    name='Test Course for Lecture Generation',
    defaults={
        'start_date': date(2026, 1, 5),  # Monday
        'num_lectures': 8,
        'capacity': 30,
        'price': 100.00,
        'season': season,
    }
)

if not created:
    # Clean up existing lectures and schedules
    Lecture.objects.filter(course=course).delete()
    CourseSchedule.objects.filter(course=course).delete()
    course.num_lectures = 8
    course.end_date = None
    course.save()

print(f'Course: {course.name}')
print(f'Start date: {course.start_date} (weekday: {course.start_date.weekday()} = {course.start_date.strftime("%A")})')
print(f'Num lectures: {course.num_lectures}')
print(f'End date: {course.end_date}')
print(f'Slug: {course.slug}')
print()

# Create schedules: Saturday (0 in your system) and Tuesday (3 in your system)
# Saturday = 0 in your system -> Python weekday 5
# Tuesday = 3 in your system -> Python weekday 1
schedule1, _ = CourseSchedule.objects.get_or_create(
    course=course,
    weekday=Weekday.SATURDAY,  # 0
    defaults={'start_time': time(10, 0), 'end_time': time(12, 0)}
)
schedule2, _ = CourseSchedule.objects.get_or_create(
    course=course,
    weekday=Weekday.TUESDAY,  # 3
    defaults={'start_time': time(14, 0), 'end_time': time(16, 0)}
)

print(f'Schedule 1: {schedule1} (system weekday: {schedule1.weekday})')
print(f'Schedule 2: {schedule2} (system weekday: {schedule2.weekday})')
print()

# Test the conversion
print('Testing weekday conversion:')
print(
    f'  Saturday (0) -> Python: {course._system_weekday_to_python(0)} (should be 5)')
print(
    f'  Sunday (1) -> Python: {course._system_weekday_to_python(1)} (should be 6)')
print(
    f'  Monday (2) -> Python: {course._system_weekday_to_python(2)} (should be 0)')
print(
    f'  Tuesday (3) -> Python: {course._system_weekday_to_python(3)} (should be 1)')
print()

# Generate lectures (delete signals-generated ones first)
Lecture.objects.filter(course=course).delete()
course.generate_lectures()

# Reload course to see updated fields
course.refresh_from_db()
print(f'After generation:')
print(f'  Num lectures: {course.num_lectures}')
print(f'  End date: {course.end_date}')
print()

# Show generated lectures
lectures = Lecture.objects.filter(course=course).order_by('day', 'start_time')
print(f'Generated {lectures.count()} lectures:')
for lec in lectures:
    print(f'  #{lec.lecture_number}: {lec.day} ({lec.day.strftime("%A")}) {lec.start_time}-{lec.end_time} | created_at: {lec.created_at}')

# Verify all timestamps are identical
timestamps = set(lectures.values_list('created_at', flat=True))
print(f'\nAll timestamps identical: {len(timestamps) == 1}')
