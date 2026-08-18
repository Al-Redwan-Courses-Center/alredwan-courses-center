#!/usr/bin/env python3
"""Serializers for Course app"""
from rest_framework import serializers
from .models import Course, Tag, Season, CourseSchedule, LandingPageCourse
from users.serializers import InstructorSerializer


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""
    class Meta:
        model = Tag
        fields = ['id', 'name']


class SeasonSerializer(serializers.ModelSerializer):
    """Serializer for Season model"""
    class Meta:
        model = Season
        fields = ['id', 'name', 'season_type',
                  'start_date', 'end_date', 'is_active']


class CourseScheduleSerializer(serializers.ModelSerializer):
    """Serializer for CourseSchedule model"""
    weekday_display = serializers.CharField(
        source='get_weekday_display', read_only=True)

    class Meta:
        model = CourseSchedule
        fields = ['id', 'weekday', 'weekday_display', 'start_time', 'end_time']


class CourseListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing courses.

    Note: enrolled_count, available_spots, is_full use annotated _enrolled_count
    from the view's queryset to avoid N+1 queries. Falls back to model properties
    if annotation is not present.
    """
    tags = TagSerializer(many=True, read_only=True)
    instructor = InstructorSerializer(read_only=True)
    season = SeasonSerializer(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'start_date', 'end_date',
            'num_lectures', 'capacity', 'price', 'is_active',
            'season', 'instructor', 'tags', 'for_adults',
            'min_age', 'max_age', 'enrolled_count', 'available_spots',
            'is_full', 'created_at', 'updated_at', 'average_rating', 'rating_count'
        ]

    def get_enrolled_count(self, obj):
        """Use annotated count if available, otherwise fall back to property."""
        if hasattr(obj, '_enrolled_count'):
            return obj._enrolled_count
        return obj.enrolled_count

    def get_available_spots(self, obj):
        """Calculate available spots using annotated count if available."""
        enrolled = self.get_enrolled_count(obj)
        return max(0, obj.capacity - enrolled)

    def get_is_full(self, obj):
        """Check if course is full using annotated count if available."""
        enrolled = self.get_enrolled_count(obj)
        return enrolled >= obj.capacity

    def get_average_rating(self, obj):
        """Get average rating using annotated values if available."""
        # Use annotated values for optimal performance
        if hasattr(obj, '_student_rating_sum') and hasattr(obj, '_parent_rating_sum'):
            total_sum = (obj._student_rating_sum or 0) + \
                (obj._parent_rating_sum or 0)
            total_count = (obj._student_rating_count or 0) + \
                (obj._parent_rating_count or 0)
            if total_count == 0:
                return None
            return round(total_sum / total_count, 2)
        # Fallback to model property
        return obj.average_rating

    def get_rating_count(self, obj):
        """Get total number of ratings using annotated value if available."""
        if hasattr(obj, '_rating_count'):
            return obj._rating_count
        return obj.rating_count


class CourseDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed course view.

    Note: Uses annotated _enrolled_count from queryset to avoid N+1 queries.
    """
    tags = TagSerializer(many=True, read_only=True)
    instructor = InstructorSerializer(read_only=True)
    season = SeasonSerializer(read_only=True)
    schedules = CourseScheduleSerializer(many=True, read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'start_date', 'end_date',
            'num_lectures', 'capacity', 'price', 'is_active',
            'season', 'instructor', 'tags', 'schedules', 'for_adults',
            'min_age', 'max_age', 'enrolled_count', 'available_spots',
            'is_full', 'created_at', 'updated_at'
        ]

    def get_enrolled_count(self, obj):
        """Use annotated count if available, otherwise fall back to property."""
        if hasattr(obj, '_enrolled_count'):
            return obj._enrolled_count
        return obj.enrolled_count

    def get_available_spots(self, obj):
        """Calculate available spots using annotated count if available."""
        enrolled = self.get_enrolled_count(obj)
        return max(0, obj.capacity - enrolled)

    def get_is_full(self, obj):
        """Check if course is full using annotated count if available."""
        enrolled = self.get_enrolled_count(obj)
        return enrolled >= obj.capacity


class LandingPageCourseSerializer(serializers.ModelSerializer):
    """Serializer for landing page featured courses"""
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = LandingPageCourse
        fields = ['id', 'course', 'order', 'created_at']


class CourseRatingSerializer(serializers.Serializer):
    """Serializer for individual course ratings (both student and parent)"""
    id = serializers.IntegerField(read_only=True)
    rating = serializers.IntegerField(read_only=True)
    feedback = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    rater_name = serializers.SerializerMethodField()
    rater_type = serializers.SerializerMethodField()

    def get_rater_name(self, obj):
        """Get the name of the person who gave the rating"""
        if hasattr(obj, 'student'):
            return obj.student.user.get_full_name()
        elif hasattr(obj, 'parent'):
            return obj.parent.user.get_full_name()
        return None

    def get_rater_type(self, obj):
        """Return whether the rater is a student or parent"""
        if hasattr(obj, 'student'):
            return 'student'
        elif hasattr(obj, 'parent'):
            return 'parent'
        return None


class CourseRatingDetailSerializer(serializers.Serializer):
    """Serializer for course rating statistics and details"""
    course_id = serializers.IntegerField(read_only=True)
    course_name = serializers.CharField(read_only=True)
    statistics = serializers.DictField(read_only=True)
    ratings = serializers.DictField(read_only=True)
