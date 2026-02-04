#!/usr/bin/env python3
'''
Module for importing all Course views to make them accessible from courses.views
'''
from .course import CourseListView, CourseDetailView
from .landing_page_courses import LandingPageCourseListView
from .lecture import LectureListCreateView, LectureNumberCheckView

__all__ = [
    'CourseListView',
    'CourseDetailView',
    'LandingPageCourseListView',
    'LectureListCreateView',
    'LectureNumberCheckView',
]
