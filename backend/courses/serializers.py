#!/usr/bin/env python3
"""Serializers for Course app"""
from rest_framework import serializers
from .models import Course, Tag, Season, CourseSchedule, LandingPageCourse, Lecture, LectureStatus
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

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'start_date', 'end_date',
            'num_lectures', 'capacity', 'price', 'is_active',
            'season', 'instructor', 'tags', 'for_adults',
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


class LectureInstructorSerializer(serializers.ModelSerializer):
    """Minimal instructor serializer for lecture responses"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InstructorSerializer.Meta.model
        fields = ['id', 'full_name']
    
    def get_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return ""


class LectureListSerializer(serializers.ModelSerializer):
    """Serializer for listing lectures"""
    instructor = LectureInstructorSerializer(read_only=True)
    scheduled_at = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Lecture
        fields = [
            'id', 'lecture_number', 'title', 'day', 'scheduled_at',
            'start_time', 'end_time', 'instructor', 'status', 
            'status_display', 'is_accepted', 'attendance_taken', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'attendance_taken']
    
    def get_scheduled_at(self, obj):
        """Return timezone-aware datetime for the lecture start"""
        start_dt = obj.get_start_datetime()
        return start_dt.isoformat() if start_dt else None


class LectureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating lectures"""
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=InstructorSerializer.Meta.model.objects.all(),
        required=False,
        allow_null=True
    )
    is_accepted = serializers.BooleanField(required=False, default=True)
    
    class Meta:
        model = Lecture
        fields = [
            'lecture_number', 'title', 'day', 'start_time', 
            'end_time', 'instructor', 'status', 'is_accepted'
        ]
    
    def validate_lecture_number(self, value):
        """Validate that lecture_number is positive"""
        if value <= 0:
            raise serializers.ValidationError(
                "رقم المحاضرة يجب أن يكون عددًا صحيحًا موجبًا."
            )
        return value
    
    def validate(self, data):
        """Validate lecture data"""
        # Check time coherence
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': "وقت البداية يجب أن يكون قبل وقت النهاية."
            })
        
        # Get course from context
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError("Course is required in context")
        
        return data
    
    def create(self, validated_data):
        """Create lecture with course from context using add_lecture_with_shift"""
        course = self.context.get('course')
        
        # If no instructor specified, use course instructor
        if 'instructor' not in validated_data or validated_data['instructor'] is None:
            validated_data['instructor'] = course.instructor
        
        # Use the add_lecture_with_shift method to handle insertion and shifting
        lecture = Lecture.add_lecture_with_shift(course, validated_data)
        
        return lecture


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


class InstructorLectureCreateSerializer(serializers.ModelSerializer):
    """Serializer for instructors creating additional lectures"""
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=InstructorSerializer.Meta.model.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Lecture
        fields = [
            'lecture_number', 'title', 'day', 'start_time', 
            'end_time', 'instructor'
        ]
    
    def validate_lecture_number(self, value):
        """Validate that lecture_number is positive"""
        if value <= 0:
            raise serializers.ValidationError(
                "رقم المحاضرة يجب أن يكون عددًا صحيحًا موجبًا."
            )
        return value
    
    def validate(self, data):
        """Validate lecture data"""
        # Check time coherence
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': "وقت البداية يجب أن يكون قبل وقت النهاية."
            })
        
        # Get course from context
        course = self.context.get('course')
        if not course:
            raise serializers.ValidationError("Course is required in context")
        
        return data
    
    def create(self, validated_data):
        """Create additional lecture using add_lecture_with_shift method - always shifts existing lectures"""
        course = self.context.get('course')
        instructor = validated_data.get('instructor') or course.instructor
        
        # Always use add_lecture_with_shift to handle conflicts properly
        lecture_data = {
            'lecture_number': validated_data['lecture_number'],
            'day': validated_data['day'],
            'start_time': validated_data.get('start_time'),
            'end_time': validated_data.get('end_time'),
            'instructor': instructor,
            'title': validated_data.get('title', ''),
            'status': LectureStatus.ADDITIONAL,
            'is_accepted': False
        }
        lecture = Lecture.add_lecture_with_shift(course, lecture_data)
        
        return lecture
