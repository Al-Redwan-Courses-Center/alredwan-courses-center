#!/usr/bin/env python3
"""Filters for attendance app."""

import django_filters
from django_filters import FilterSet

from attendance.models import InstructorAttendance, AttendanceStatus, AttendanceType, SupervisorSchedule
from courses.models import Weekday


class InstructorAttendanceFilter(FilterSet):
    """
    FilterSet for filtering instructor attendance records.
    
    Available filters:
    - date_from: Filter records from this date (inclusive)
    - date_to: Filter records up to this date (inclusive)
    - instructor: Filter by instructor ID
    - status: Filter by attendance status (present, absent, late, pending, not_started)
    - attendance_type: Filter by type (lecture, supervision)
    - rated_by: Filter by the admin who rated
    - has_rating: Filter records that have been rated (True/False)
    - season: Filter by season ID
    """
    date_from = django_filters.DateFilter(
        field_name='date',
        lookup_expr='gte',
        help_text='Filter records from this date (inclusive). Format: YYYY-MM-DD'
    )
    date_to = django_filters.DateFilter(
        field_name='date',
        lookup_expr='lte',
        help_text='Filter records up to this date (inclusive). Format: YYYY-MM-DD'
    )
    instructor = django_filters.UUIDFilter(
        field_name='instructor__user__id',
        help_text='Filter by instructor user ID (UUID)'
    )
    status = django_filters.ChoiceFilter(
        choices=AttendanceStatus.choices,
        help_text='Filter by attendance status (present, absent, late, pending, not_started)'
    )
    attendance_type = django_filters.ChoiceFilter(
        choices=AttendanceType.choices,
        help_text='Filter by attendance type (lecture, supervision)'
    )
    rated_by = django_filters.UUIDFilter(
        field_name='rated_by__id',
        help_text='Filter by the admin user ID who rated the attendance'
    )
    has_rating = django_filters.BooleanFilter(
        method='filter_has_rating',
        help_text='Filter records that have been rated (true) or not rated (false)'
    )
    season = django_filters.NumberFilter(
        field_name='season__id',
        help_text='Filter by season ID'
    )
    checked_in = django_filters.BooleanFilter(
        method='filter_checked_in',
        help_text='Filter records that have checked in (true) or not (false)'
    )
    checked_out = django_filters.BooleanFilter(
        method='filter_checked_out',
        help_text='Filter records that have checked out (true) or not (false)'
    )

    class Meta:
        model = InstructorAttendance
        fields = [
            'date_from', 'date_to', 'instructor', 'status', 
            'attendance_type', 'rated_by', 'has_rating', 'season',
            'checked_in', 'checked_out'
        ]

    def filter_has_rating(self, queryset, name, value):
        """Filter by whether the attendance has been rated."""
        if value is True:
            # Has been rated (rating > 0)
            return queryset.filter(rating__gt=0)
        elif value is False:
            # Not rated yet (rating is null or 0)
            return queryset.filter(rating__isnull=True) | queryset.filter(rating=0)
        return queryset

    def filter_checked_in(self, queryset, name, value):
        """Filter by whether the instructor has checked in."""
        if value is True:
            return queryset.filter(check_in_time__isnull=False)
        elif value is False:
            return queryset.filter(check_in_time__isnull=True)
        return queryset

    def filter_checked_out(self, queryset, name, value):
        """Filter by whether the instructor has checked out."""
        if value is True:
            return queryset.filter(check_out_time__isnull=False)
        elif value is False:
            return queryset.filter(check_out_time__isnull=True)
        return queryset


class SupervisorScheduleFilter(FilterSet):
    """
    FilterSet for filtering supervisor schedules.
    
    Available filters:
    - instructor: Filter by instructor profile ID (integer PK)
    - day_of_week: Filter by day of week (0=Saturday, 1=Sunday, ..., 6=Friday)
    - start_time_from: Filter schedules starting at or after this time
    - start_time_to: Filter schedules starting at or before this time
    """
    instructor = django_filters.NumberFilter(
        field_name='instructor__id',
        help_text='Filter by instructor profile ID (integer)'
    )
    day_of_week = django_filters.ChoiceFilter(
        choices=Weekday.choices,
        help_text='Filter by day of week (0=Saturday, 1=Sunday, ..., 6=Friday)'
    )
    start_time_from = django_filters.TimeFilter(
        field_name='start_time',
        lookup_expr='gte',
        help_text='Filter schedules starting at or after this time. Format: HH:MM'
    )
    start_time_to = django_filters.TimeFilter(
        field_name='start_time',
        lookup_expr='lte',
        help_text='Filter schedules starting at or before this time. Format: HH:MM'
    )

    class Meta:
        model = SupervisorSchedule
        fields = ['instructor', 'day_of_week', 'start_time_from', 'start_time_to']
