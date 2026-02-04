#!/usr/bin/env python3
"""Views for Lecture management"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Max

from courses.models import Course, Lecture
from courses.serializers import LectureListSerializer, InstructorLectureCreateSerializer


class LectureListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating lectures for a course
    
    GET /api/courses/<course_id>/lectures/
    Returns only accepted lectures (is_accepted=True) ordered by lecture_number
    
    POST /api/courses/<course_id>/lectures/
    Creates a new ADDITIONAL lecture with is_accepted=False (requires approval)
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


class LectureNumberCheckView(APIView):
    """
    API endpoint for checking lecture number availability
    
    GET /api/courses/<course_id>/lectures/check-number/?lecture_number=8
    
    Always returns 200 OK with JSON body indicating:
    - is_available: true/false
    - message: descriptive message
    - existing_lecture: details if number exists
    - max_existing_number: if number is less than max
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
        
        # Case 1: Number already exists
        if existing_lecture:
            return Response({
                'lecture_number': lecture_number,
                'is_available': False,
                'message': f'Lecture number {lecture_number} already exists',
                'existing_lecture': {
                    'id': str(existing_lecture.id),
                    'status': existing_lecture.status,
                    'scheduled_at': existing_lecture.get_start_datetime().isoformat() if existing_lecture.get_start_datetime() else None
                }
            }, status=status.HTTP_200_OK)
        
        # Case 2: Number is less than max existing number
        if max_number is not None and lecture_number < max_number:
            return Response({
                'lecture_number': lecture_number,
                'is_available': False,
                'message': f'Lecture number {lecture_number} is less than existing lectures',
                'max_existing_number': max_number,
                'suggestion': f'Consider using a number greater than {max_number} or check if you want to insert in the middle'
            }, status=status.HTTP_200_OK)
        
        # Case 3: Number is available
        return Response({
            'lecture_number': lecture_number,
            'is_available': True,
            'message': f'Lecture number {lecture_number} is available'
        }, status=status.HTTP_200_OK)
