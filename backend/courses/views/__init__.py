#!/usr/bin/env python3
'''
Module for importing all Course views to make them accessible from courses.views
'''
from .course import CourseListView, CourseDetailView, CourseUpdateView
from .landing_page_courses import LandingPageCourseListView
from .landing_page import LandingPageInstructorListView
from .lecture import LectureListCreateView, LectureNumberCheckView, LectureUpdateView
from .ratings import CourseRatingsView

__all__ = [
    'CourseListView',
    'CourseDetailView',
    'CourseUpdateView',
    'LandingPageCourseListView',
    'LandingPageInstructorListView',
    'LectureListCreateView',
    'LectureNumberCheckView',
    'LectureUpdateView',
    'CourseRatingsView',
]
