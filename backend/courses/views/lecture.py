#!/usr/bin/env python3
"""Views for Lecture management"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Max
from django_filters import rest_framework as filters
from django.utils import timezone

from courses.models import Course, Lecture
from courses.serializers import LectureListSerializer, InstructorLectureCreateSerializer, LectureUpdateSerializer, LectureDetailSerializer
from courses.permissions import IsAdminOrCourseInstructor, IsAdminOrInstructorOrSupervisor
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
    start_date = filters.DateFilter(
        field_name='day', lookup_expr='gte', label='Start Date (>=)')
    end_date = filters.DateFilter(
        field_name='day', lookup_expr='lte', label='End Date (<=)')
    status = filters.ChoiceFilter(
        choices=Lecture._meta.get_field('status').choices)
    instructor = filters.NumberFilter(field_name='instructor__id')
    attendance_taken = filters.BooleanFilter()

    class Meta:
        model = Lecture
        fields = ['start_date', 'end_date', 'status',
                  'instructor', 'attendance_taken']


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

    Permissions:
    - Admins: Full access to all courses
    - Supervisors: Full access to all courses
    - Instructors: Only access to courses they are assigned to teach
    """
    permission_classes = [IsAdminOrCourseInstructor]
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
    API endpoint for checking if a lecture can be created at a specific date and time

    GET /api/courses/<course_id>/lectures/check-datetime/?day=2026-02-15&start_time=10:00:00

    Always returns 200 OK with JSON body indicating:
    - is_available: true/false
    - message: descriptive message
    - existing_lecture: details if a lecture exists at that date+time
    - calculated_lecture_number: the lecture number that will be assigned
    - action: what will happen when this lecture is added
    """
    permission_classes = [IsAdminOrCourseInstructor]

    def get(self, request, course_id):
        """Check if a lecture can be created at the specified date and time"""
        from datetime import datetime as dt

        # Validate course exists
        course = get_object_or_404(Course, pk=course_id)

        # Get day and start_time from query params
        day_str = request.query_params.get('day')
        start_time_str = request.query_params.get('start_time')

        if not day_str:
            return Response(
                {
                    'error': 'day query parameter is required',
                    'detail': 'Please provide a day in the query string (format: YYYY-MM-DD).'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse date
        try:
            from django.utils.dateparse import parse_date, parse_time
            day = parse_date(day_str)
            if not day:
                raise ValueError("Invalid date format")
        except (ValueError, TypeError):
            return Response(
                {
                    'error': 'Invalid day format',
                    'detail': 'day must be in format YYYY-MM-DD (e.g., 2026-02-15).'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse time (optional)
        start_time = None
        if start_time_str:
            try:
                start_time = parse_time(start_time_str)
                if not start_time:
                    raise ValueError("Invalid time format")
            except (ValueError, TypeError):
                return Response(
                    {
                        'error': 'Invalid start_time format',
                        'detail': 'start_time must be in format HH:MM:SS (e.g., 10:00:00).'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check if lecture already exists at this date+time (only accepted lectures)
        existing_lecture = Lecture.objects.filter(
            course=course,
            day=day,
            start_time=start_time,
            is_accepted=True
        ).select_related('instructor__user').first()

        if existing_lecture:
            return Response({
                'day': day.isoformat(),
                'start_time': start_time.isoformat() if start_time else None,
                'is_available': False,
                'message': f'محاضرة موجودة بالفعل في {day} في الوقت {start_time or "midnight"}',
                'action': 'conflict',
                'action_description': 'Cannot create a lecture at the same date and time as an existing lecture.',
                'existing_lecture': {
                    'id': str(existing_lecture.id),
                    'lecture_number': existing_lecture.lecture_number,
                    'title': existing_lecture.title,
                    'status': existing_lecture.status,
                    'instructor': existing_lecture.instructor.user.get_full_name() if existing_lecture.instructor and existing_lecture.instructor.user else None
                }
            }, status=status.HTTP_200_OK)

        # Calculate where this lecture would be inserted
        from django.utils import timezone
        import datetime

        new_lecture_dt = timezone.make_aware(
            datetime.datetime.combine(day, start_time or datetime.time.min),
            timezone.get_current_timezone()
        )

        # Get all accepted lectures ordered by datetime
        existing_lectures = list(Lecture.objects.filter(
            course=course,
            is_accepted=True
        ).order_by('day', 'start_time'))

        # Determine insert position
        insert_position = None
        lectures_to_shift = []

        for idx, lecture in enumerate(existing_lectures):
            lecture_dt = lecture.get_start_datetime()
            if new_lecture_dt < lecture_dt:
                insert_position = idx
                lectures_to_shift = existing_lectures[idx:]
                break

        # Calculate the lecture number
        if insert_position is None:
            # Adding at the end
            calculated_lecture_number = len(existing_lectures) + 1
            action = 'append'
            action_description = f'New lecture will be added at the end as lecture #{calculated_lecture_number}.'
            affected_info = 'No existing lectures will be renumbered.'
        else:
            # Inserting in the middle
            calculated_lecture_number = insert_position + 1
            action = 'insert'
            action_description = f'New lecture will be inserted as lecture #{calculated_lecture_number}. All lectures from #{calculated_lecture_number} onwards will be shifted by +1.'
            affected_info = f'{len(lectures_to_shift)} lecture(s) will be renumbered (lectures #{calculated_lecture_number} to #{existing_lectures[-1].lecture_number} will become #{calculated_lecture_number + 1} to #{existing_lectures[-1].lecture_number + 1}).'

        # Check if date exceeds course end date
        course_end_warning = None
        if course.end_date and day > course.end_date:
            course_end_warning = f'The lecture date ({day}) is after the course end date ({course.end_date}). The course end date will be automatically extended.'

        return Response({
            'day': day.isoformat(),
            'start_time': start_time.isoformat() if start_time else None,
            'is_available': True,
            'message': f'يمكن إنشاء محاضرة في {day} في الوقت {start_time or "midnight"}',
            'calculated_lecture_number': calculated_lecture_number,
            'action': action,
            'action_description': action_description,
            'affected_lectures': affected_info,
            'total_lectures_after': len(existing_lectures) + 1,
            'course_end_date_warning': course_end_warning
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
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial)
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


class LectureDetailView(generics.RetrieveAPIView):
    """
    API endpoint for getting detailed lecture information

    GET /api/courses/lectures/{id}/

    Returns full lecture details including:
    - Lecture info (title, number, day, times, status)
    - Full course details
    - Instructor information
    - Duration in minutes

    Authentication required: Admin, Supervisor, or Course Instructor
    """
    queryset = Lecture.objects.select_related(
        'course__instructor__user',
        'course__season',
        'instructor__user'
    ).prefetch_related('course__tags')
    serializer_class = LectureDetailSerializer
    permission_classes = [IsAdminOrInstructorOrSupervisor]
    lookup_field = 'pk'


class InstructorTodayLecturesView(APIView):
    """
    API endpoint for getting today's lectures

    GET /api/courses/lectures/today/

    Behavior based on user role:
    - Regular Instructors: Returns only their own lectures scheduled for today
    - Admins/Supervisors: Returns all lectures for all instructors scheduled for today

    Returns all lectures (accepted and pending) ordered by start_time, then lecture_number.

    Authentication required: Admin, Supervisor, or Instructor
    """
    permission_classes = [IsAdminOrInstructorOrSupervisor]

    def get(self, request):
        """Get today's lectures based on user role"""
        # Get today's date
        today = timezone.now().date()

        # Determine if user is admin/supervisor or regular instructor
        is_admin_or_supervisor = (
            request.user.is_staff or
            request.user.is_superuser or
            (hasattr(request.user, 'instructor_profile') and
             request.user.instructor_profile.type == 'supervisor')
        )

        # Build query based on user role
        if is_admin_or_supervisor:
            # Admin/Supervisor: Get all lectures for today
            lectures = Lecture.objects.filter(
                day=today
            ).select_related(
                'course',
                'instructor__user'
            ).order_by('start_time', 'lecture_number')

            user_role = 'admin/supervisor'
        else:
            # Regular Instructor: Get only their own lectures
            instructor_profile = request.user.instructor_profile
            lectures = Lecture.objects.filter(
                instructor=instructor_profile,
                day=today
            ).select_related(
                'course',
                'instructor__user'
            ).order_by('start_time', 'lecture_number')

            user_role = 'instructor'

        # Serialize the lectures
        serializer = LectureListSerializer(lectures, many=True)

        return Response({
            'date': today.isoformat(),
            'count': lectures.count(),
            'user_role': user_role,
            'lectures': serializer.data
        }, status=status.HTTP_200_OK)
