#!/usr/bin/env python3
'''
Module for importing all User views to make them accessible from users.views
'''
from .instructor import InstructorListView, InstructorDetailView
from .landing_page_instructors import LandingPageInstructorListView
from .instructor_ratings import InstructorRatingsView, InstructorRateView

__all__ = [
    'InstructorListView',
    'InstructorDetailView',
    'LandingPageInstructorListView',
    'InstructorRatingsView',
    'InstructorRateView',
]
