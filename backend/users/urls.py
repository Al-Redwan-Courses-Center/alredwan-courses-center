#!/usr/bin/env python3
"""URL patterns for Users app"""
from django.urls import path
from .views import (
    InstructorListView,
    InstructorDetailView,
    LandingPageInstructorListView,
    InstructorRatingsView
)
from .views.staff_import import (
    import_staff_from_upload,
    download_staff_passwords,
    list_available_password_files
)

app_name = 'users'

urlpatterns = [
    path('instructors/', InstructorListView.as_view(), name='instructor-list'),
    path('instructors/<int:pk>/', InstructorDetailView.as_view(), name='instructor-detail'),
    path('instructors/<int:pk>/ratings/', InstructorRatingsView.as_view(), name='instructor-ratings'),
    path('landingpageinstructors/', LandingPageInstructorListView.as_view(), name='landing-instructor-list'),
    
    # Staff import endpoints (Admin only)
    path('staff/import/', import_staff_from_upload, name='staff-import'),
    path('staff/download-passwords/<str:filename>/', download_staff_passwords, name='download-staff-passwords'),
    path('staff/password-files/', list_available_password_files, name='list-password-files'),
]
