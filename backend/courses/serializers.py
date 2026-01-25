#!/usr/bin/env python3
"""Serializers for Course app"""
from rest_framework import serializers
from .models import Course, Tag, Season, CourseSchedule, LandingPageCourse, LandingPageInstructor
from users.models import Instructor


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""
    class Meta:
        model = Tag
        fields = ['id', 'name']


class SeasonSerializer(serializers.ModelSerializer):
    """Serializer for Season model"""
    class Meta:
        model = Season
        fields = ['id', 'name', 'season_type', 'start_date', 'end_date', 'is_active']


class CourseScheduleSerializer(serializers.ModelSerializer):
    """Serializer for CourseSchedule model"""
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = CourseSchedule
        fields = ['id', 'weekday', 'weekday_display', 'start_time', 'end_time']


class InstructorSerializer(serializers.ModelSerializer):
    """Serializer for Instructor model"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Instructor
        fields = ['id', 'name']


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer for listing courses"""
    tags = TagSerializer(many=True, read_only=True)
    instructor = InstructorSerializer(read_only=True)
    season = SeasonSerializer(read_only=True)
    enrolled_count = serializers.IntegerField(read_only=True)
    available_spots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'slug', 'description', 'start_date', 'end_date',
            'num_lectures', 'capacity', 'price', 'is_active',
            'season', 'instructor', 'tags', 'for_adults',
            'min_age', 'max_age', 'enrolled_count', 'available_spots',
            'is_full', 'created_at', 'updated_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed course view"""
    tags = TagSerializer(many=True, read_only=True)
    instructor = InstructorSerializer(read_only=True)
    season = SeasonSerializer(read_only=True)
    schedules = CourseScheduleSerializer(many=True, read_only=True)
    enrolled_count = serializers.IntegerField(read_only=True)
    available_spots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'slug', 'description', 'start_date', 'end_date',
            'num_lectures', 'capacity', 'price', 'is_active',
            'season', 'instructor', 'tags', 'schedules', 'for_adults',
            'min_age', 'max_age', 'enrolled_count', 'available_spots',
            'is_full', 'created_at', 'updated_at'
        ]


class LandingPageCourseSerializer(serializers.ModelSerializer):
    """Serializer for landing page featured courses"""
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = LandingPageCourse
        fields = ['id', 'course', 'order', 'created_at']


class LandingPageInstructorDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed instructor info on landing page"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number1', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Instructor
        fields = ['id', 'name', 'email', 'phone', 'bio', 'type', 'type_display', 'image_url', 'joined_date']
    
    def get_image_url(self, obj):
        """Get the full URL for the instructor's image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class LandingPageInstructorSerializer(serializers.ModelSerializer):
    """Serializer for landing page featured instructors"""
    instructor = LandingPageInstructorDetailSerializer(read_only=True)
    
    class Meta:
        model = LandingPageInstructor
        fields = ['id', 'instructor', 'order', 'created_at']
