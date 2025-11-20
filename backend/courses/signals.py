#!/usr/bin/env python3
''' Signals for Course app'''
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import Lecture, CourseSchedule
from datetime import timedelta, timezone


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
