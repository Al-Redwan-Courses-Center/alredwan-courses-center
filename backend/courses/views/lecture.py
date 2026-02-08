#!/usr/bin/env python3
"""Views for Lecture management"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Max
from django_filters import rest_framework as filters

from courses.models import Course, Lecture
from courses.serializers import LectureListSerializer, InstructorLectureCreateSerializer, LectureUpdateSerializer
from courses.permissions import IsAdminOrCourseInstructor
from core.utils.pagination import CustomPageNumberPagination


class LectureFilter(filters.FilterSet):
    """
    Filter class for Lecture queryset with date ranges and other filters
    
    Available filters:
    - start_date: Filter lectures on or after this date (format: YYYY-MM-DD)
    - end_date: Filter lectures on or before this date (format: YYYY-MM-DD)
    - status: Filter by lecture status (scheduled, completed, cancelled, additional)
    - instructor: Filter by instructor ID
    - attendance_taken: Filter by whether attendance was taken (true/false)
    
    Example usage:
    - /api/courses/1/lectures/?start_date=2026-02-01&end_date=2026-02-28
    - /api/courses/1/lectures/?status=scheduled&instructor=5
    - /api/courses/1/lectures/?attendance_taken=false&page=1&page_size=20
    """
    start_date = filters.DateFilter(field_name='day', lookup_expr='gte', label='Start Date (>=)')
    end_date = filters.DateFilter(field_name='day', lookup_expr='lte', label='End Date (<=)')
    status = filters.ChoiceFilter(choices=Lecture._meta.get_field('status').choices)
    instructor = filters.NumberFilter(field_name='instructor__id')
    attendance_taken = filters.BooleanFilter()
    
    class Meta:
        model = Lecture
        fields = ['start_date', 'end_date', 'status', 'instructor', 'attendance_taken']


class LectureListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating lectures for a course
    
    GET /api/courses/<course_id>/lectures/
    Returns only accepted lectures (is_accepted=True) ordered by lecture_number
    
    Filters:
    - start_date: Filter lectures on or after this date (YYYY-MM-DD)
    - end_date: Filter lectures on or before this date (YYYY-MM-DD)
    - status: Filter by status (scheduled, completed, cancelled, additional)
    - instructor: Filter by instructor ID
    - attendance_taken: Filter by attendance status (true/false)
    
    Pagination: ?page=1&page_size=10 (default: 10, max: 100)
    
    Example:
    - /api/courses/1/lectures/?start_date=2026-02-01&end_date=2026-02-28&status=scheduled
    - /api/courses/1/lectures/?instructor=5&attendance_taken=false&page=1&page_size=20
    
    POST /api/courses/<course_id>/lectures/
    Creates a new ADDITIONAL lecture with is_accepted=False (requires approval)
    All users (Admin/Supervisor/Instructor) create additional lectures
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination
    filterset_class = LectureFilter
    filter_backends = [filters.DjangoFilterBackend]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method"""
        if self.request.method == 'POST':
            return InstructorLectureCreateSerializer
        return LectureListSerializer
    
    def get_queryset(self):
        """Return only accepted lectures for the specified course, ordered by lecture_number"""
        course_id = self.kwargs.get('course_id')
        return Lecture.objects.filter(
            course_id=course_id,
            is_accepted=True  # Only return accepted lectures
        ).select_related(
            'instructor__user'
        ).order_by('lecture_number', 'day', 'start_time')
    
    def get_serializer_context(self):
        """Add course to serializer context"""
        context = super().get_serializer_context()
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, pk=course_id)
        context['course'] = course
        return context
    
    def create(self, request, *args, **kwargs):
        """Create a new additional lecture with validation"""
        course_id = self.kwargs.get('course_id')
        course = get_object_or_404(Course, pk=course_id)
        
        # Check permissions - admin, supervisor, or instructor of this course
        user = request.user
        is_authorized = (
            user.role in ['admin', 'supervisor'] or
            (hasattr(user, 'instructor_profile') and 
             user.instructor_profile == course.instructor)
        )
        
        if not is_authorized:
            return Response(
                {
                    'error': 'You do not have permission to create lectures for this course.',
                    'detail': 'Only administrators, supervisors, or the course instructor can create lectures.'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            lecture = serializer.save()
            # Return response using list serializer
            response_serializer = LectureListSerializer(lecture)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class LectureNumberCheckView(APIView):
    """
    API endpoint for checking lecture number availability
    
    GET /api/courses/<course_id>/lectures/check-number/?lecture_number=8
    
    Always returns 200 OK with JSON body indicating:
    - is_available: true/false
    - message: descriptive message
    - existing_lecture: details if number exists
    - max_existing_number: if number is less than max
    - action: what will happen when this lecture is added
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        """Check if a lecture number is available for the course"""
        # Validate course exists
        course = get_object_or_404(Course, pk=course_id)
        
        # Get lecture_number from query params
        lecture_number_str = request.query_params.get('lecture_number')
        
        if not lecture_number_str:
            return Response(
                {
                    'error': 'lecture_number query parameter is required',
                    'detail': 'Please provide a lecture_number in the query string.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lecture_number = int(lecture_number_str)
        except ValueError:
            return Response(
                {
                    'error': 'Invalid lecture_number',
                    'detail': 'lecture_number must be a valid integer.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if lecture number exists (only accepted lectures)
        existing_lecture = Lecture.objects.filter(
            course=course,
            lecture_number=lecture_number,
            is_accepted=True
        ).select_related('instructor__user').first()
        
        # Get max existing lecture number (only accepted lectures)
        max_number = Lecture.objects.filter(
            course=course,
            is_accepted=True
        ).aggregate(Max('lecture_number'))['lecture_number__max']
        
        # Case 1: Number already exists - will trigger shifting
        if existing_lecture:
            return Response({
                'lecture_number': lecture_number,
                'is_available': False,
                'message': f'Lecture number {lecture_number} already exists',
                'action': 'shift',
                'action_description': f'New lecture will be inserted at position {lecture_number}. All lectures from {lecture_number} onwards will be shifted by +1.',
                'existing_lecture': {
                    'id': str(existing_lecture.id),
                    'status': existing_lecture.status,
                    'scheduled_at': existing_lecture.get_start_datetime().isoformat() if existing_lecture.get_start_datetime() else None
                },
                'affected_lectures': f'Lectures {lecture_number} and above will be renumbered'
            }, status=status.HTTP_200_OK)
        
        # Case 2: Number is less than max existing number - will be inserted in the middle
        if max_number is not None and lecture_number < max_number:
            return Response({
                'lecture_number': lecture_number,
                'is_available': True,
                'message': f'Lecture number {lecture_number} is available (inserting in the middle)',
                'action': 'insert',
                'action_description': f'New lecture will be created at position {lecture_number}. No other lectures will be affected.',
                'max_existing_number': max_number,
                'note': f'This lecture will be positioned between existing lectures (max lecture number is {max_number})'
            }, status=status.HTTP_200_OK)
        
        # Case 3: Number is equal to or greater than max + 1 - adding to the end
        if max_number is not None and lecture_number >= max_number + 1:
            course_end_date = course.end_date.isoformat() if course.end_date else 'not set'
            return Response({
                'lecture_number': lecture_number,
                'is_available': True,
                'message': f'Lecture number {lecture_number} is available (adding to the end)',
                'action': 'append',
                'action_description': f'New lecture will be added at the end. If lecture date is after course end date, the course end date will be automatically extended.',
                'max_existing_number': max_number,
                'current_course_end_date': course_end_date,
                'note': 'Course end date may be updated if the new lecture date exceeds it'
            }, status=status.HTTP_200_OK)
        
        # Case 4: No lectures exist yet - first lecture
        return Response({
            'lecture_number': lecture_number,
            'is_available': True,
            'message': f'Lecture number {lecture_number} is available (first lecture)',
            'action': 'create',
            'action_description': 'This will be the first lecture in the course.',
            'note': 'No existing lectures to affect'
        }, status=status.HTTP_200_OK)


class LectureUpdateView(generics.UpdateAPIView):
    """
    API endpoint for updating lecture information
    PUT/PATCH /api/lectures/{id}/edit/
    
    Authentication required: Admin or course instructor only
    """
    queryset = Lecture.objects.select_related('course', 'instructor')
    serializer_class = LectureUpdateSerializer
    permission_classes = [IsAdminOrCourseInstructor]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """Override to add custom response with detailed info"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'id': instance.id,
            'title': instance.title,
            'course': instance.course.name,
            'course_id': instance.course.id,
            'day': instance.day,
            'start_time': instance.start_time,
            'end_time': instance.end_time,
            'lecture_number': instance.lecture_number,
            'status': instance.status,
            'attendance_taken': instance.attendance_taken,
            'updated_at': instance.updated_at,
        })
