#!/usr/bin/env python3
"""Views for Course Ratings"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404

from courses.models import Course
from users.models.student_instructor_rating import StudentCourseRating, ParentCourseRating
from courses.serializers import CourseRatingSerializer, CourseRatingDetailSerializer


class CourseRatingsView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving ratings of a specific course.
    GET /api/courses/{id}/ratings/
    GET /api/courses/{slug}/ratings/

    Returns aggregated rating statistics and individual ratings.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CourseRatingDetailSerializer

    def get_object(self):
        """Get course by ID or slug"""
        lookup_value = self.kwargs.get('pk')

        if lookup_value.isdigit():
            return get_object_or_404(Course, pk=lookup_value)
        return get_object_or_404(Course, slug=lookup_value)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve course ratings and statistics"""
        course = self.get_object()

        # Get aggregated statistics using database aggregation
        student_stats = StudentCourseRating.objects.filter(course=course).aggregate(
            avg_rating=Avg('rating'),
            total_ratings=Count('id')
        )
        parent_stats = ParentCourseRating.objects.filter(course=course).aggregate(
            avg_rating=Avg('rating'),
            total_ratings=Count('id')
        )

        # Calculate combined average
        student_total = (student_stats['avg_rating'] or 0) * \
            (student_stats['total_ratings'] or 0)
        parent_total = (parent_stats['avg_rating'] or 0) * \
            (parent_stats['total_ratings'] or 0)
        total_count = (student_stats['total_ratings']
                       or 0) + (parent_stats['total_ratings'] or 0)

        combined_avg = None
        if total_count > 0:
            combined_avg = round(
                (student_total + parent_total) / total_count, 2)

        # Get individual ratings with pagination support
        student_ratings = StudentCourseRating.objects.filter(
            course=course
        ).select_related('student__user').order_by('-created_at')

        parent_ratings = ParentCourseRating.objects.filter(
            course=course
        ).select_related('parent__user').order_by('-created_at')

        # Serialize the ratings
        student_ratings_data = CourseRatingSerializer(
            student_ratings, many=True, context={'type': 'student'}).data
        parent_ratings_data = CourseRatingSerializer(
            parent_ratings, many=True, context={'type': 'parent'}).data

        response_data = {
            'course_id': course.id,
            'course_name': course.name,
            'statistics': {
                'average_rating': combined_avg,
                'total_ratings': total_count,
                'student_ratings_count': student_stats['total_ratings'] or 0,
                'student_average': round(student_stats['avg_rating'], 2) if student_stats['avg_rating'] else None,
                'parent_ratings_count': parent_stats['total_ratings'] or 0,
                'parent_average': round(parent_stats['avg_rating'], 2) if parent_stats['avg_rating'] else None,
            },
            'ratings': {
                'student_ratings': student_ratings_data,
                'parent_ratings': parent_ratings_data,
            }
        }

        return Response(response_data)
