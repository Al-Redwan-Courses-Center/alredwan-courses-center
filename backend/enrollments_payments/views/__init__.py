#!/usr/bin/env python3
'''Views for enrollments_payments app'''
from .enrollment_request import (
    EnrollmentRequestCreateView,
    EnrollmentRequestListView,
    EnrollmentRequestDetailView,
    EnrollmentRequestCancelView
)

from .admin_enrollment_request import (
    AdminEnrollmentRequestListView,
    AdminEnrollmentRequestDetailView,
    AdminEnrollmentRequestUpdateView,
    AdminEnrollmentRequestApproveView,
    AdminEnrollmentRequestRejectView,
    AdminBulkApproveView,
    AdminBulkRejectView
)

from .enrollment import (
    EnrollmentListView,
    EnrollmentDetailView,
    EnrollmentProgressView
)

from .instructor_enrollment import (
    InstructorCourseEnrollmentListView,
    InstructorAllEnrollmentsListView,
    InstructorCourseEnrollmentStatsView
)
