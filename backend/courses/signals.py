#!/usr/bin/env python3
''' Signals for Course app'''
from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver
from .models import Lecture, CourseSchedule
from attendance.models.lecture_attendance import LectureAttendance
from datetime import timezone


@receiver(pre_delete, sender=CourseSchedule)
def delete_lectures_on_schedule_delete(sender, instance, **kwargs):
    ''' Delete lectures when a course schedule is deleted '''
    course = instance.course
    lectures_to_delete = Lecture.objects.filter(
        course=course,
        day__week_day=instance.weekday,
        day__gt=timezone.now())
    lectures_to_delete.delete()


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
