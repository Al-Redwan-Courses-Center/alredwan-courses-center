#!/usr/bin/env python3
"""
Courses Admin Package

This package contains modular admin configurations for all course-related models.
Each model has its own file for better maintainability.

Structure:
    - base.py: Mixins, constants, and helper functions
    - filters.py: Custom admin filters
    - actions.py: Bulk admin actions
    - inlines.py: Inline admin classes
    - season.py: SeasonAdmin
    - tag.py: TagAdmin
    - course.py: CourseAdmin
    - course_schedule.py: CourseScheduleAdmin
    - lecture.py: LectureAdmin
    - exam.py: ExamAdmin, ExamResultAdmin
    - landing_page_course.py: LandingPageCourseAdmin
"""

# Import all admin classes for auto-discovery
from .season import SeasonAdmin
from .tag import TagAdmin
from .course import CourseAdmin
from .course_schedule import CourseScheduleAdmin
from .lecture import LectureAdmin
from .exam import ExamAdmin, ExamResultAdmin
from .landing_page_course import LandingPageCourseAdmin

# Import base components for external use
from .base import (
    ArabicLabelsMixin,
    OptimizedQuerysetMixin,
    ARABIC_FIELD_LABELS,
    STATUS_COLORS,
)

# Import filters for external use
from .filters import (
    ActiveStatusFilter,
    CapacityStatusFilter,
    DateRangeFilter,
    LectureDateRangeFilter,
    PassedFilter,
)

# Import actions for external use
from .actions import (
    activate_selected,
    deactivate_selected,
    duplicate_selected,
    mark_lectures_completed,
    mark_lectures_cancelled,
    reschedule_next_week,
)

# Import inlines for external use
from .inlines import (
    CourseScheduleInline,
    LectureInline,
    ExamInline,
    ExamResultInline,
    TagCourseInline,
    TagInstructorInline,
)


__all__ = [
    # Admin classes
    'SeasonAdmin',
    'TagAdmin',
    'CourseAdmin',
    'CourseScheduleAdmin',
    'LectureAdmin',
    'ExamAdmin',
    'ExamResultAdmin',
    'LandingPageCourseAdmin',

    # Base components
    'ArabicLabelsMixin',
    'OptimizedQuerysetMixin',
    'ARABIC_FIELD_LABELS',
    'STATUS_COLORS',

    # Filters
    'ActiveStatusFilter',
    'CapacityStatusFilter',
    'DateRangeFilter',
    'LectureDateRangeFilter',
    'PassedFilter',

    # Actions
    'activate_selected',
    'deactivate_selected',
    'duplicate_selected',
    'mark_lectures_completed',
    'mark_lectures_cancelled',
    'reschedule_next_week',

    # Inlines
    'CourseScheduleInline',
    'LectureInline',
    'ExamInline',
    'ExamResultInline',
    'TagCourseInline',
    'TagInstructorInline',
]
