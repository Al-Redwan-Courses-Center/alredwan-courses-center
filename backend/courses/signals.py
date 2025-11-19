#!/usr/bin/env python3
''' Signals for Course app'''
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import Lecture, CourseSchedule
from datetime import timedelta, timezone


@receiver(post_save, sender=CourseSchedule)
def create_lectures_on_schedule_create(sender, instance, created, **kwargs):
    ''' Create lectures when a new course schedule is created '''
    if created:
        course = instance.course
        course_start_date = course.start_date
        course_end_date = course.end_date if course.end_date else None
        course_number_of_lectures = course.num_lectures if course.num_lectures else None
        created_at, updated_at = instance.created_at, instance.updated_at
        if course_end_date and not course_number_of_lectures:
            count = Lecture.objects.filter(course=course).count()
            current_date = course_start_date
            while current_date <= course_end_date:
                if current_date.weekday() == instance.weekday:
                    Lecture.objects.create(
                        course=course,
                        day=current_date,
                        start_time=instance.start_time,
                        end_time=instance.end_time,
                        lecture_number=count + 1,
                        instructor=course.instructor,
                        created_at=created_at,
                        updated_at=updated_at,
                    )
                    count += 1
                current_date += timedelta(days=1)
            course.num_lectures = count
        elif course_number_of_lectures:  # edit logic to handle 2 course_schedules per week with num_lectures
            count = Lecture.objects.filter(course=course).count()
            current_date = course_start_date
            end_date = None
            while count <= course_number_of_lectures:
                if current_date.weekday() == instance.weekday:
                    Lecture.objects.create(
                        course=course,
                        day=current_date,
                        start_time=instance.start_time,
                        end_time=instance.end_time,
                        lecture_number=count,
                        instructor=course.instructor,
                        created_at=created_at,
                        updated_at=updated_at,
                    )
                    end_date = current_date
                    count += 1
                current_date += timedelta(days=1)
            course.end_date = end_date
        course.save()


@receiver(pre_delete, sender=CourseSchedule)
def delete_lectures_on_schedule_delete(sender, instance, **kwargs):
    ''' Delete lectures when a course schedule is deleted '''
    course = instance.course
    lectures_to_delete = Lecture.objects.filter(
        course=course,
        # Django's week_day is 1 (Sunday) to 7 (Saturday)
        day__week_day=instance.weekday,
        day__gt=timezone.now())
    lectures_to_delete.delete()
