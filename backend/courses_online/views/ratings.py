#!/usr/bin/env python3
"""Views for Online Course Ratings"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Count
from django.shortcuts import get_object_or_404

from courses_online.models import OnlineCourse
from users.models.student_instructor_rating import StudentOnlineCourseRating, ParentOnlineCourseRating
from courses_online.serializers.ratings import OnlineCourseRatingSerializer, OnlineCourseRatingDetailSerializer


class StudentRatingsPagination(PageNumberPagination):
    page_size = 20
    page_query_param = 'student_page'


class ParentRatingsPagination(PageNumberPagination):
    page_size = 20
    page_query_param = 'parent_page'


class OnlineCourseRatingsView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving ratings of a specific online course.
    GET /api/online-courses/courses/{id}/ratings/

    Returns aggregated rating statistics and individual ratings in paginated envelopes.
    """
    permission_classes = [AllowAny]
    serializer_class = OnlineCourseRatingDetailSerializer

    def get_object(self):
        """Get course by UUID"""
        lookup_value = self.kwargs.get('pk')
        return get_object_or_404(OnlineCourse, pk=lookup_value)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve course ratings and statistics"""
        course = self.get_object()

        # Get aggregated statistics using Sum and Count directly
        student_stats = StudentOnlineCourseRating.objects.filter(course=course).aggregate(
            sum_rating=Sum('rating'),
            total_ratings=Count('id')
        )
        parent_stats = ParentOnlineCourseRating.objects.filter(course=course).aggregate(
            sum_rating=Sum('rating'),
            total_ratings=Count('id')
        )

        student_sum = student_stats['sum_rating'] or 0
        parent_sum = parent_stats['sum_rating'] or 0
        student_count = student_stats['total_ratings'] or 0
        parent_count = parent_stats['total_ratings'] or 0
        total_count = student_count + parent_count

        combined_avg = None
        if total_count > 0:
            combined_avg = round((student_sum + parent_sum) / total_count, 2)

        # Get individual ratings with pagination support
        student_ratings = StudentOnlineCourseRating.objects.filter(
            course=course
        ).select_related('student__user').order_by('-created_at')

        parent_ratings = ParentOnlineCourseRating.objects.filter(
            course=course
        ).select_related('parent__user').order_by('-created_at')

        student_paginator = StudentRatingsPagination()
        parent_paginator = ParentRatingsPagination()

        student_page = student_paginator.paginate_queryset(student_ratings, request)
        if student_page is not None:
            student_ratings_data = OnlineCourseRatingSerializer(student_page, many=True, context={'type': 'student'}).data
            student_paginated = student_paginator.get_paginated_response(student_ratings_data).data
        else:
            student_ratings_data = OnlineCourseRatingSerializer(student_ratings, many=True, context={'type': 'student'}).data
            student_paginated = {
                'count': len(student_ratings_data),
                'next': None,
                'previous': None,
                'results': student_ratings_data
            }

        parent_page = parent_paginator.paginate_queryset(parent_ratings, request)
        if parent_page is not None:
            parent_ratings_data = OnlineCourseRatingSerializer(parent_page, many=True, context={'type': 'parent'}).data
            parent_paginated = parent_paginator.get_paginated_response(parent_ratings_data).data
        else:
            parent_ratings_data = OnlineCourseRatingSerializer(parent_ratings, many=True, context={'type': 'parent'}).data
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
                'student_ratings_count': student_count,
                'student_average': round(student_sum / student_count, 2) if student_count > 0 else None,
                'parent_ratings_count': parent_count,
                'parent_average': round(parent_sum / parent_count, 2) if parent_count > 0 else None,
            },
            'ratings': {
                'student_ratings': student_paginated,
                'parent_ratings': parent_paginated,
            }
        }

        return Response(response_data)


class OnlineCourseRateView(generics.CreateAPIView):
    """
    API endpoint for submitting a rating for a specific online course.
    POST /api/online-courses/courses/{id}/rate/
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if getattr(self.request.user, 'role', None) == 'parent':
            from courses_online.serializers.ratings import ParentOnlineCourseRateSerializer
            return ParentOnlineCourseRateSerializer
        from courses_online.serializers.ratings import StudentOnlineCourseRateSerializer
        return StudentOnlineCourseRateSerializer

    def create(self, request, *args, **kwargs):
        course = get_object_or_404(OnlineCourse, pk=self.kwargs.get('pk'))

        serializer = self.get_serializer(
            data=request.data,
            context={'request': request, 'course': course}
        )
        serializer.is_valid(raise_exception=True)

        defaults = {
            'rating': serializer.validated_data['rating'],
            'feedback': serializer.validated_data.get('feedback', ''),
        }

        user_role = getattr(request.user, 'role', None)
        if user_role == 'parent':
            parent_profile = getattr(request.user, 'parent_profile', None)
            if not parent_profile:
                return Response(
                    {"detail": "لم يتم العثور على ملف ولي الأمر لهذا المستخدم."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            _, created = ParentOnlineCourseRating.objects.update_or_create(
                parent=parent_profile, course=course, defaults=defaults
            )
        elif user_role == 'student':
            student_profile = getattr(request.user, 'student_profile', None)
            if not student_profile:
                return Response(
                    {"detail": "لم يتم العثور على ملف الطالب لهذا المستخدم."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            _, created = StudentOnlineCourseRating.objects.update_or_create(
                student=student_profile, course=course, defaults=defaults
            )
        else:
            return Response(
                {"detail": "فقط الطلاب وأولياء الأمور يمكنهم تقديم تقييمات."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"detail": "تم حفظ التقييم بنجاح.", "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
