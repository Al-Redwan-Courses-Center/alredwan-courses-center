#!/usr/bin/env python3
"""Views for Instructor Ratings"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404

from users.models import Instructor
from users.models.student_instructor_rating import StudentInstructorRating, ParentInstructorRating
from users.serializers import InstructorRatingSerializer, InstructorRatingDetailSerializer


class InstructorRatingsView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving ratings of a specific instructor.
    GET /api/instructors/{id}/ratings/

    Returns aggregated rating statistics and individual ratings.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = InstructorRatingDetailSerializer

    def get_object(self):
        """Get instructor by ID"""
        instructor_id = self.kwargs.get('pk')
        return get_object_or_404(Instructor, pk=instructor_id)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve instructor ratings and statistics"""
        instructor = self.get_object()

        # Get aggregated statistics using database aggregation
        student_stats = StudentInstructorRating.objects.filter(instructor=instructor).aggregate(
            avg_rating=Avg('rating'),
            total_ratings=Count('id')
        )
        parent_stats = ParentInstructorRating.objects.filter(instructor=instructor).aggregate(
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
        student_ratings = StudentInstructorRating.objects.filter(
            instructor=instructor
        ).select_related('student__user', 'course').order_by('-created_at')

        parent_ratings = ParentInstructorRating.objects.filter(
            instructor=instructor
        ).select_related('parent__user', 'course').order_by('-created_at')

        # Serialize the ratings
        student_ratings_data = InstructorRatingSerializer(
            student_ratings, many=True, context={'type': 'student'}).data
        parent_ratings_data = InstructorRatingSerializer(
            parent_ratings, many=True, context={'type': 'parent'}).data

        response_data = {
            'instructor_id': instructor.id,
            'instructor_name': instructor.user.get_full_name(),
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
