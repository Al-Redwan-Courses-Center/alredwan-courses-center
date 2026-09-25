#!/usr/bin/env python3
"""Serializers for Online Course Ratings"""
from rest_framework import serializers
from users.models.student_instructor_rating import StudentOnlineCourseRating, ParentOnlineCourseRating
from ..participants import active_online_enrollments

class OnlineCourseRatingSerializer(serializers.Serializer):
    """Serializer for individual online course ratings (both student and parent)"""
    id = serializers.IntegerField(read_only=True)
    rating = serializers.IntegerField(read_only=True)
    feedback = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    rater_name = serializers.SerializerMethodField()
    rater_type = serializers.SerializerMethodField()

    def get_rater_name(self, obj):
        """Get the name of the person who gave the rating"""
        if isinstance(obj, StudentOnlineCourseRating):
            return obj.student.user.get_full_name()
        if isinstance(obj, ParentOnlineCourseRating):
            return obj.parent.user.get_full_name()
        return None

    def get_rater_type(self, obj):
        """Return whether the rater is a student or parent"""
        if isinstance(obj, StudentOnlineCourseRating):
            return 'student'
        if isinstance(obj, ParentOnlineCourseRating):
            return 'parent'
        return None


class OnlineCourseRatingDetailSerializer(serializers.Serializer):
    """Serializer for online course rating statistics and details"""
    course_id = serializers.UUIDField(read_only=True)
    course_name = serializers.CharField(read_only=True)
    statistics = serializers.DictField(read_only=True)
    ratings = serializers.DictField(read_only=True)


class StudentOnlineCourseRateSerializer(serializers.ModelSerializer):
    """Serializer for students to rate online courses"""
    class Meta:
        model = StudentOnlineCourseRating
        fields = ['rating', 'feedback']

    def validate(self, data):
        user = self.context['request'].user
        if user.role != 'student':
            raise serializers.ValidationError("هذا الحساب ليس حساب طالب.")

        try:
            student = user.student_profile
        except Exception:
            raise serializers.ValidationError(
                "لم يتم العثور على ملف تعريف طالب.")

        course = self.context['course']

        # Only an active (unexpired) enrollment may rate the course
        if not active_online_enrollments(course, student=student).exists():
            raise serializers.ValidationError(
                "يجب أن تكون مشتركاً في الدورة لتتمكن من تقييمها.")

        return data


class ParentOnlineCourseRateSerializer(serializers.ModelSerializer):
    """Serializer for parents to rate online courses"""
    class Meta:
        model = ParentOnlineCourseRating
        fields = ['rating', 'feedback']

    def validate(self, data):
        user = self.context['request'].user
        if user.role != 'parent':
            raise serializers.ValidationError("هذا الحساب ليس حساب ولي أمر.")

        try:
            parent = user.parent_profile
        except Exception:
            raise serializers.ValidationError(
                "لم يتم العثور على ملف تعريف ولي أمر.")

        course = self.context['course']

        # Check if parent has a child actively enrolled in the online course
        from parents.models import Child

        # Get parent's children
        child_ids = list(Child.objects.filter(
            primary_parent=parent).values_list('id', flat=True))
        extra_child_ids = list(
            parent.extra_children.values_list('child_id', flat=True))
        all_child_ids = set(child_ids + extra_child_ids)

        if not active_online_enrollments(course, child_id__in=all_child_ids).exists():
            raise serializers.ValidationError(
                "يجب أن يكون أحد أبنائك مشتركاً في الدورة لتتمكن من تقييمها.")

        return data
