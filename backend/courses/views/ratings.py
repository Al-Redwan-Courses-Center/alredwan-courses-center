#!/usr/bin/env python3
"""Views for Course Ratings"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404

from courses.models import Course
from users.models.student_instructor_rating import StudentCourseRating, ParentCourseRating
from courses.serializers import CourseRatingSerializer, CourseRatingDetailSerializer


class StudentRatingsPagination(PageNumberPagination):
    page_size = 20
    page_query_param = 'student_page'


class ParentRatingsPagination(PageNumberPagination):
    page_size = 20
    page_query_param = 'parent_page'


class CourseRatingsView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving ratings of a specific course.
    GET /api/courses/{id}/ratings/
    GET /api/courses/{slug}/ratings/

    Returns aggregated rating statistics and individual ratings in paginated envelopes.
    """
    permission_classes = [AllowAny]
    serializer_class = CourseRatingDetailSerializer

    def get_object(self):
        """Get course by ID or slug"""
        lookup_value = self.kwargs.get('pk')
        try:
            return Course.objects.get(pk=lookup_value)
        except (Course.DoesNotExist, ValueError):
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

        student_paginator = StudentRatingsPagination()
        parent_paginator = ParentRatingsPagination()

        student_page = student_paginator.paginate_queryset(student_ratings, request)
        if student_page is not None:
            student_ratings_data = CourseRatingSerializer(
                student_page, many=True, context={'type': 'student'}).data
            student_paginated = student_paginator.get_paginated_response(student_ratings_data).data
        else:
            student_ratings_data = CourseRatingSerializer(
                student_ratings, many=True, context={'type': 'student'}).data
            student_paginated = {
                'count': len(student_ratings_data),
                'next': None,
                'previous': None,
                'results': student_ratings_data
            }

        parent_page = parent_paginator.paginate_queryset(parent_ratings, request)
        if parent_page is not None:
            parent_ratings_data = CourseRatingSerializer(
                parent_page, many=True, context={'type': 'parent'}).data
            parent_paginated = parent_paginator.get_paginated_response(parent_ratings_data).data
        else:
            parent_ratings_data = CourseRatingSerializer(
                parent_ratings, many=True, context={'type': 'parent'}).data
            parent_paginated = {
                'count': len(parent_ratings_data),
                'next': None,
                'previous': None,
                'results': parent_ratings_data
            }

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
                'student_ratings': student_paginated,
                'parent_ratings': parent_paginated,
            }
        }

        return Response(response_data)


class CourseRateView(generics.CreateAPIView):
    """
    API endpoint for submitting a rating for a specific course.
    POST /api/courses/{id}/rate/
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == 'parent':
            from courses.serializers import ParentCourseRateSerializer
            return ParentCourseRateSerializer
        from courses.serializers import StudentCourseRateSerializer
        return StudentCourseRateSerializer

    def create(self, request, *args, **kwargs):
        lookup_value = self.kwargs.get('pk')
        try:
            try:
                course = Course.objects.get(pk=lookup_value)
            except (Course.DoesNotExist, ValueError):
                course = get_object_or_404(Course, slug=lookup_value)

            serializer = self.get_serializer(
                data=request.data, 
                context={'request': request, 'course': course}
            )
            serializer.is_valid(raise_exception=True)
            
            if request.user.role == 'parent':
                rating, created = ParentCourseRating.objects.update_or_create(
                    parent=request.user.parent_profile,
                    course=course,
                    defaults={'rating': serializer.validated_data['rating'], 'feedback': serializer.validated_data.get('feedback', '')}
                )
            else:
                rating, created = StudentCourseRating.objects.update_or_create(
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
