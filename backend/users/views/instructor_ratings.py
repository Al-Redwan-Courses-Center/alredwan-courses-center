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


class InstructorRateView(generics.CreateAPIView):
    """
    API endpoint for submitting a rating for a specific instructor.
    POST /api/instructors/{id}/rate/
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == 'parent':
            from users.serializers import ParentInstructorRateSerializer
            return ParentInstructorRateSerializer
        from users.serializers import StudentInstructorRateSerializer
        return StudentInstructorRateSerializer

    def create(self, request, *args, **kwargs):
        instructor_id = self.kwargs.get('pk')
        instructor = get_object_or_404(Instructor, pk=instructor_id)

        serializer = self.get_serializer(
            data=request.data, 
            context={'request': request, 'instructor': instructor}
        )
        serializer.is_valid(raise_exception=True)
        
        if request.user.role == 'parent':
            rating, created = ParentInstructorRating.objects.update_or_create(
                parent=request.user.parent_profile,
                instructor=instructor,
                defaults={
                    'course': serializer.validated_data['course'],
                    'rating': serializer.validated_data['rating'], 
                    'feedback': serializer.validated_data.get('feedback', '')
                }
            )
        else:
            rating, created = StudentInstructorRating.objects.update_or_create(
                student=request.user.student_profile,
                instructor=instructor,
                defaults={
                    'course': serializer.validated_data['course'],
                    'rating': serializer.validated_data['rating'], 
                    'feedback': serializer.validated_data.get('feedback', '')
                }
            )

        return Response(
            {"detail": "تم حفظ التقييم بنجاح.", "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
