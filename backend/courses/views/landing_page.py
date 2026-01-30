#!/usr/bin/env python3
"""Views for Landing Page featured content"""
from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.db.models import Count, Q

from courses.models import LandingPageCourse
from courses.serializers import LandingPageCourseSerializer
from users.models import LandingPageInstructor
from users.serializers import LandingPageInstructorSerializer


class LandingPageCourseListView(generics.ListAPIView):
    """
    API endpoint for listing featured courses on landing page
    GET /api/courses/landingpagecourses/
    
    Returns courses ordered by their display order.
    """
    serializer_class = LandingPageCourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Return optimized queryset with annotated enrollment counts.
        Only includes active courses that are featured on the landing page.
        """
        return LandingPageCourse.objects.select_related(
            'course__instructor__user',
            'course__season'
        ).prefetch_related(
            'course__tags',
            'course__schedules'
        ).filter(
            course__is_active=True
        ).annotate(
            # Annotate on the related course's enrollments
            _course_enrolled_count=Count(
                'course__enrollments',
                filter=Q(course__enrollments__status='active')
            )
        )


class LandingPageInstructorListView(generics.ListAPIView):
    """
    API endpoint for listing featured instructors on landing page
    GET /api/landingpageinstructors/
    
    Returns instructors ordered by their display order.
    """
    serializer_class = LandingPageInstructorSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Return optimized queryset."""
        return LandingPageInstructor.objects.select_related(
            'instructor__user'
        ).prefetch_related(
            'instructor__tags'
        )
