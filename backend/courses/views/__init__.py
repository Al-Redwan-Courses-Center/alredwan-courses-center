#!/usr/bin/env python3
'''
Module for importing all Course views to make them accessible from courses.views
'''
from .course import CourseListView, CourseDetailView, CourseUpdateView, CourseScheduleListView, CourseScheduleDetailView
from .landing_page_courses import LandingPageCourseListView
from .lecture import LectureListCreateView, LectureNumberCheckView, LectureUpdateView, LectureDetailView, InstructorTodayLecturesView
from .ratings import CourseRatingsView

__all__ = [
    'CourseListView',
    'CourseDetailView',
    'CourseUpdateView',
    'CourseScheduleListView',
    'CourseScheduleDetailView',
    'LandingPageCourseListView',
    'LectureListCreateView',
    'LectureNumberCheckView',
    'LectureUpdateView',
    'LectureDetailView',
    'InstructorTodayLecturesView',
    'CourseRatingsView',
]
