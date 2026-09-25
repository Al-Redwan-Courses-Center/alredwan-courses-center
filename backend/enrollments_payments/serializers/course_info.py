#!/usr/bin/env python3
"""Shared course-derived fields for Enrollment / EnrollmentRequest serializers.

Both models expose a ``course_instance`` property that resolves to either the
physical ``courses.Course`` or the ``courses_online.OnlineCourse`` the row
points at. Every ``get_course_*`` helper here goes through that property so
online rows serialize real values instead of ``None``.
"""


class CourseInfoSerializerMixin:
    """SerializerMethodField helpers for course-derived read-only fields."""

    def _course(self, obj):
        return obj.course_instance

    def get_course_name(self, obj):
        target = self._course(obj)
        return target.name if target else None

    def get_course_description(self, obj):
        target = self._course(obj)
        return target.description if target else None

    def get_course_price(self, obj):
        target = self._course(obj)
        if target is None or target.price is None:
            return None
        return str(target.price)

    def get_course_start_date(self, obj):
        target = self._course(obj)
        if target is None:
            return None
        if hasattr(target, 'start_date'):
            return target.start_date
        # Online courses have no schedule; fall back to publication date.
        return target.created_at.date()

    def get_course_end_date(self, obj):
        target = self._course(obj)
        return getattr(target, 'end_date', None) if target else None

    def get_course_instructor(self, obj):
        target = self._course(obj)
        if target and target.instructor and target.instructor.user:
            return target.instructor.user.get_full_name()
        return None

    def get_course_num_lectures(self, obj):
        target = self._course(obj)
        if target is None:
            return None
        if hasattr(target, 'num_lectures'):
            return target.num_lectures
        if hasattr(target, 'video_lectures'):
            return target.video_lectures.count()
        return None
