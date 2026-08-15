#!/usr/bin/env python3
"""Views for Online Course Ratings"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404

from courses_online.models import OnlineCourse
from users.models.student_instructor_rating import StudentOnlineCourseRating, ParentOnlineCourseRating
from courses_online.serializers.ratings import OnlineCourseRatingSerializer, OnlineCourseRatingDetailSerializer


class OnlineCourseRatingsView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving ratings of a specific online course.
    GET /api/courses_online/courses/{id}/ratings/

    Returns aggregated rating statistics and individual ratings.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = OnlineCourseRatingDetailSerializer

    def get_object(self):
        """Get course by UUID"""
        lookup_value = self.kwargs.get('pk')
        return get_object_or_404(OnlineCourse, pk=lookup_value)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve course ratings and statistics"""
        course = self.get_object()

        # Get aggregated statistics using database aggregation
        student_stats = StudentOnlineCourseRating.objects.filter(course=course).aggregate(
            avg_rating=Avg('rating'),
            total_ratings=Count('id')
        )
        parent_stats = ParentOnlineCourseRating.objects.filter(course=course).aggregate(
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
        student_ratings = StudentOnlineCourseRating.objects.filter(
            course=course
        ).select_related('student__user').order_by('-created_at')

        parent_ratings = ParentOnlineCourseRating.objects.filter(
            course=course
        ).select_related('parent__user').order_by('-created_at')

        # Serialize the ratings
        student_ratings_data = OnlineCourseRatingSerializer(
            student_ratings, many=True, context={'type': 'student'}).data
        parent_ratings_data = OnlineCourseRatingSerializer(
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


class OnlineCourseRateView(generics.CreateAPIView):
    """
    API endpoint for submitting a rating for a specific online course.
    POST /api/courses_online/courses/{id}/rate/
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == 'parent':
            from courses_online.serializers.ratings import ParentOnlineCourseRateSerializer
            return ParentOnlineCourseRateSerializer
        from courses_online.serializers.ratings import StudentOnlineCourseRateSerializer
        return StudentOnlineCourseRateSerializer

    def create(self, request, *args, **kwargs):
        lookup_value = self.kwargs.get('pk')
        try:
            course = get_object_or_404(OnlineCourse, pk=lookup_value)

            serializer = self.get_serializer(
                data=request.data, 
                context={'request': request, 'course': course}
            )
            serializer.is_valid(raise_exception=True)
            
            if request.user.role == 'parent':
                rating, created = ParentOnlineCourseRating.objects.update_or_create(
                    parent=request.user.parent_profile,
                    course=course,
                    defaults={'rating': serializer.validated_data['rating'], 'feedback': serializer.validated_data.get('feedback', '')}
                )
            else:
                rating, created = StudentOnlineCourseRating.objects.update_or_create(
                    student=request.user.student_profile,
                    course=course,
                    defaults={'rating': serializer.validated_data['rating'], 'feedback': serializer.validated_data.get('feedback', '')}
                )

            return Response(
                {"detail": "تم حفظ التقييم بنجاح.", "created": created},
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": f"Internal Error: {str(e)}", "type": str(type(e))},
                status=status.HTTP_400_BAD_REQUEST
            )
