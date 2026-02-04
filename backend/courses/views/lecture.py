#!/usr/bin/env python3
"""Views for Lecture management"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import datetime, time

from courses.models import Course, Lecture
from courses.serializers import LectureListSerializer, InstructorLectureCreateSerializer


class LectureListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating lectures for a course
    
    GET /api/courses/<course_id>/lectures/
    Returns only accepted lectures (is_accepted=True) ordered by lecture_number
    
    POST /api/courses/<course_id>/lectures/
    Creates a new ADDITIONAL lecture with is_accepted=False (requires approval)
    Lecture number is automatically calculated based on chronological order (date + time)
    All users (Admin/Supervisor/Instructor) create additional lectures
    """
    permission_classes = [IsAuthenticated]
    
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


class LectureDateCheckView(APIView):
    """
    API endpoint for checking lecture date and getting position information
    
    GET /api/courses/<course_id>/lectures/check-date/?day=2026-02-15
    
    Optional parameters: start_time, end_time (for conflict checking)
    
    Returns:
    - Date validation
    - Projected lecture number based on chronological order
    - Position information (where it will be inserted)
    - Previous and next lectures
    - Time conflict information (only if times provided)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        """Check lecture date for validity and position"""
        # Validate course exists
        course = get_object_or_404(Course, pk=course_id)
        
        # Get parameters from query string
        day_str = request.query_params.get('day')
        start_time_str = request.query_params.get('start_time')
        end_time_str = request.query_params.get('end_time')
        
        # Validate required parameters
        if not day_str:
            return Response(
                {
                    'error': 'day query parameter is required',
                    'detail': 'Please provide a day in format YYYY-MM-DD.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse date
        try:
            day = datetime.strptime(day_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {
                    'error': 'Invalid day format',
                    'detail': 'day must be in format YYYY-MM-DD.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse times (optional - only for conflict checking)
        start_time = None
        end_time = None
        
        if start_time_str:
            try:
                start_time = datetime.strptime(start_time_str, '%H:%M:%S').time()
            except ValueError:
                try:
                    start_time = datetime.strptime(start_time_str, '%H:%M').time()
                except ValueError:
                    return Response(
                        {
                            'error': 'Invalid start_time format',
                            'detail': 'start_time must be in format HH:MM:SS or HH:MM.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        if end_time_str:
            try:
                end_time = datetime.strptime(end_time_str, '%H:%M:%S').time()
            except ValueError:
                try:
                    end_time = datetime.strptime(end_time_str, '%H:%M').time()
                except ValueError:
                    return Response(
                        {
                            'error': 'Invalid end_time format',
                            'detail': 'end_time must be in format HH:MM:SS or HH:MM.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # Get position information (using day and default start_time if not provided)
        position_info = Lecture.get_lecture_position_info(
            course=course,
            day=day,
            start_time=start_time or time(0, 0)  # Default to start of day
        )
        
        # Build base response
        response_data = {
            'day': day.isoformat(),
            'is_valid': True,
            **position_info
        }
        
        # Add time information if provided
        if start_time:
            response_data['start_time'] = start_time.strftime('%H:%M:%S')
        if end_time:
            response_data['end_time'] = end_time.strftime('%H:%M:%S')
        
        # Check for time conflicts only if BOTH times are provided
        if start_time and end_time:
            conflict_info = Lecture.check_date_conflict(
                course=course,
                day=day,
                start_time=start_time,
                end_time=end_time
            )
            response_data['conflict_check'] = conflict_info
        else:
            # If times not provided, just show how many lectures exist on this day
            lectures_on_day = Lecture.objects.filter(
                course=course,
                day=day,
                is_accepted=True
            ).count()
            response_data['lectures_on_day'] = lectures_on_day
        
        return Response(response_data, status=status.HTTP_200_OK)
