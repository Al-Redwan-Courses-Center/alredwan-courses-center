#!/usr/bin/env python3
"""Serializers for Course app"""
from rest_framework import serializers
from .models import Course, Tag, Season, CourseSchedule, LandingPageCourse, Lecture
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
        fields = ['id', 'name', 'season_type', 'start_date', 'end_date', 'is_active']


class CourseScheduleSerializer(serializers.ModelSerializer):
    """Serializer for CourseSchedule model"""
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = CourseSchedule
        fields = ['id', 'weekday', 'weekday_display', 'start_time', 'end_time']


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


class CourseUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating course information"""
    
    class Meta:
        model = Course
        fields = [
            'name', 'description', 'image', 'start_date', 'end_date',
            'num_lectures', 'capacity', 'price', 'is_active',
            'for_adults', 'min_age', 'max_age'
        ]
        extra_kwargs = {
            'name': {'required': False},
            'start_date': {'required': False},
            'capacity': {'required': False},
            'price': {'required': False},
        }
    
    def validate(self, data):
        """Validate course update data"""
        instance = self.instance
        
        # Check if end_date is being updated and validate it
        end_date = data.get('end_date', instance.end_date if instance else None)
        start_date = data.get('start_date', instance.start_date if instance else None)
        
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be on or after start date.'
            })
        
        # Validate age constraints
        min_age = data.get('min_age', instance.min_age if instance else None)
        max_age = data.get('max_age', instance.max_age if instance else None)
        
        if min_age and max_age and min_age > max_age:
            raise serializers.ValidationError({
                'min_age': 'Minimum age cannot be greater than maximum age.'
            })
        
        return data


class LectureUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating lecture information"""
    
    class Meta:
        model = Lecture
        fields = [
            'title', 'day', 'start_time', 'end_time', 'status'
        ]
        extra_kwargs = {
            'title': {'required': False},
            'day': {'required': False},
            'start_time': {'required': False},
            'end_time': {'required': False},
            'status': {'required': False},
        }
    
    def validate(self, data):
        """Validate lecture update data"""
        instance = self.instance
        
        # Check if times are valid
        start_time = data.get('start_time', instance.start_time if instance else None)
        end_time = data.get('end_time', instance.end_time if instance else None)
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        # Prevent changing lecture if attendance has been taken
        if instance and instance.attendance_taken:
            if 'day' in data or 'start_time' in data or 'end_time' in data:
                raise serializers.ValidationError({
                    'non_field_errors': 'Cannot modify lecture date/time after attendance has been taken.'
                })
        
        return data

