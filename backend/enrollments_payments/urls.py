#!/usr/bin/env python3
'''URL configuration for enrollments_payments app'''
from django.urls import path
from .views import (
    # User enrollment request endpoints
    EnrollmentRequestCreateView,
    EnrollmentRequestListView,
    EnrollmentRequestDetailView,
    EnrollmentRequestCancelView,
    # Admin enrollment request endpoints
    AdminEnrollmentRequestListView,
    AdminEnrollmentRequestDetailView,
    AdminEnrollmentRequestUpdateView,
    AdminEnrollmentRequestApproveView,
    AdminEnrollmentRequestRejectView,
    AdminBulkApproveView,
    AdminBulkRejectView,
    # User enrollment endpoints
    EnrollmentListView,
    EnrollmentDetailView,
    EnrollmentProgressView,
    # Instructor enrollment endpoints
    InstructorCourseEnrollmentListView,
    InstructorAllEnrollmentsListView,
    InstructorCourseEnrollmentStatsView,
)

app_name = 'enrollments_payments'

urlpatterns = [
    # ============== User Enrollment Request Endpoints ==============
    # POST /api/enrollment-requests/ - Create new request
    path(
        'enrollment-requests/',
        EnrollmentRequestCreateView.as_view(),
        name='enrollment-request-create'
    ),
    
    # GET /api/enrollment-requests/my-requests/ - List user's requests
    path(
        'enrollment-requests/my-requests/',
        EnrollmentRequestListView.as_view(),
        name='enrollment-request-list'
    ),
    
    # GET /api/enrollment-requests/{id}/ - View request details
    path(
        'enrollment-requests/<uuid:id>/',
        EnrollmentRequestDetailView.as_view(),
        name='enrollment-request-detail'
    ),
    
    # DELETE /api/enrollment-requests/{id}/cancel/ - Cancel request
    path(
        'enrollment-requests/<uuid:id>/cancel/',
        EnrollmentRequestCancelView.as_view(),
        name='enrollment-request-cancel'
    ),

    # ============== User Enrollment Endpoints ==============
    # GET /api/enrollments/my-enrollments/ - List user's enrollments
    path(
        'enrollments/my-enrollments/',
        EnrollmentListView.as_view(),
        name='enrollment-list'
    ),
    
    # GET /api/enrollments/{id}/ - View enrollment details
    path(
        'enrollments/<uuid:id>/',
        EnrollmentDetailView.as_view(),
        name='enrollment-detail'
    ),
    
    # GET /api/enrollments/{id}/progress/ - View enrollment progress
    path(
        'enrollments/<uuid:id>/progress/',
        EnrollmentProgressView.as_view(),
        name='enrollment-progress'
    ),

    # ============== Admin Enrollment Request Endpoints ==============
    # GET /api/admin/enrollment-requests/ - List all requests (with filters)
    path(
        'admin/enrollment-requests/',
        AdminEnrollmentRequestListView.as_view(),
        name='admin-enrollment-request-list'
    ),
    
    # GET /api/admin/enrollment-requests/{id}/ - View request details
    path(
        'admin/enrollment-requests/<uuid:id>/',
        AdminEnrollmentRequestDetailView.as_view(),
        name='admin-enrollment-request-detail'
    ),
    
    # PATCH /api/admin/enrollment-requests/{id}/ - Update request
    path(
        'admin/enrollment-requests/<uuid:id>/update/',
        AdminEnrollmentRequestUpdateView.as_view(),
        name='admin-enrollment-request-update'
    ),
    
    # POST /api/admin/enrollment-requests/{id}/approve/ - Approve request
    path(
        'admin/enrollment-requests/<uuid:id>/approve/',
        AdminEnrollmentRequestApproveView.as_view(),
        name='admin-enrollment-request-approve'
    ),
    
    # POST /api/admin/enrollment-requests/{id}/reject/ - Reject request
    path(
        'admin/enrollment-requests/<uuid:id>/reject/',
        AdminEnrollmentRequestRejectView.as_view(),
        name='admin-enrollment-request-reject'
    ),
    
    # POST /api/admin/enrollment-requests/bulk-approve/ - Bulk approve
    path(
        'admin/enrollment-requests/bulk-approve/',
        AdminBulkApproveView.as_view(),
        name='admin-enrollment-request-bulk-approve'
    ),
    
    # POST /api/admin/enrollment-requests/bulk-reject/ - Bulk reject
    path(
        'admin/enrollment-requests/bulk-reject/',
        AdminBulkRejectView.as_view(),
        name='admin-enrollment-request-bulk-reject'
    ),

    # ============== Instructor Enrollment Endpoints ==============
    # GET /api/instructor/enrollments/ - List all enrollments across instructor's courses
    path(
        'instructor/enrollments/',
        InstructorAllEnrollmentsListView.as_view(),
        name='instructor-enrollment-list'
    ),
    
    # GET /api/instructor/courses/{course_id}/enrollments/ - List enrollments in a course
    path(
        'instructor/courses/<int:course_id>/enrollments/',
        InstructorCourseEnrollmentListView.as_view(),
        name='instructor-course-enrollment-list'
    ),
    
    # GET /api/instructor/courses/{course_id}/enrollment-stats/ - Get enrollment stats
    path(
        'instructor/courses/<int:course_id>/enrollment-stats/',
        InstructorCourseEnrollmentStatsView.as_view(),
        name='instructor-course-enrollment-stats'
    ),
]
