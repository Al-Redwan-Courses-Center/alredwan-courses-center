#!/usr/bin/env python3
'''
Module for importing all Course views to make them accessible from courses.views
'''
from .course import CourseListView, CourseDetailView, CourseUpdateView
from .course_schedule import CourseScheduleListView, CourseScheduleDetailView, BatchCourseScheduleListView
from .landing_page_courses import LandingPageCourseListView
from .lecture import (
    LectureListCreateView, 
    LectureNumberCheckView, 
    LectureUpdateView, 
    LectureDetailView, 
    InstructorTodayLecturesView,
    StudentCourseLecturesView,
    ParentCourseLecturesView
)
from .ratings import CourseRatingsView, CourseRateView

__all__ = [
    'CourseListView',
    'CourseDetailView',
    'CourseUpdateView',
    'CourseScheduleListView',
    'CourseScheduleDetailView',
    'BatchCourseScheduleListView',
    'LandingPageCourseListView',
    'LectureListCreateView',
    'LectureNumberCheckView',
    'LectureUpdateView',
    'LectureDetailView',
    'InstructorTodayLecturesView',
    'CourseRatingsView',
    'CourseRateView',
    'StudentCourseLecturesView',
    'ParentCourseLecturesView',
]
