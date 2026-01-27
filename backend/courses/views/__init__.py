#!/usr/bin/env python3
'''
Module for importing all Course views to make them accessible from courses.views
'''
from .course import CourseListView, CourseDetailView
from .landing_page import LandingPageCourseListView, LandingPageInstructorListView

__all__ = [
    'CourseListView',
    'CourseDetailView',
    'LandingPageCourseListView',
    'LandingPageInstructorListView',
]
