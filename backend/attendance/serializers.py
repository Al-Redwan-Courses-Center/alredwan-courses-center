from rest_framework import serializers
from .models.lecture_attendance import LectureAttendance
from courses.models.lecture import Lecture
from parents.models import Child
from users.models import StudentUser


class MarkAttendanceSerializer(serializers.Serializer):
    """Serializer for marking attendance for a student or child."""
    
    lecture_id = serializers.IntegerField(
        help_text="ID of the lecture"
    )
    code = serializers.CharField(
        max_length=50,
        help_text="The unique code of the student or child (e.g., 'M64793')"
    )
    participant_type = serializers.ChoiceField(
        choices=['student', 'child'],
        help_text="Type of participant: 'student' or 'child'"
    )
    rating = serializers.IntegerField(
        min_value=1,
        max_value=10,
        required=True,
        help_text="Rating from 1 to 10 (required when marking attendance)"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Optional notes about the attendance"
    )

    def validate_lecture_id(self, value):
        """Validate that the lecture exists."""
        try:
            lecture = Lecture.objects.get(id=value)
            self.context['lecture'] = lecture
            return value
        except Lecture.DoesNotExist:
            raise serializers.ValidationError("Lecture not found.")

    def validate(self, data):
        """Validate the attendance marking request."""
        lecture = self.context.get('lecture')
        code = data.get('code')
        participant_type = data.get('participant_type')
        
        if not lecture:
            raise serializers.ValidationError("Invalid lecture.")
        
        # Find the participant based on type and code
        participant = None
        attendance = None
        
        if participant_type == 'child':
            try:
                participant = Child.objects.get(code=code)
                # Get or check the attendance record
                attendance = LectureAttendance.objects.filter(
                    lecture=lecture,
                    child=participant
                ).first()
            except Child.DoesNotExist:
                raise serializers.ValidationError(f"Child with code '{code}' not found.")
        
        elif participant_type == 'student':
            try:
                participant = StudentUser.objects.get(code=code)
                # Get or check the attendance record
                attendance = LectureAttendance.objects.filter(
                    lecture=lecture,
                    student=participant
                ).first()
            except StudentUser.DoesNotExist:
                raise serializers.ValidationError(f"Student with code '{code}' not found.")
        
        if not attendance:
            raise serializers.ValidationError(
                f"No attendance record found for this {participant_type} in this lecture. "
                "The attendance record must be created first."
            )
        
        # Store for later use
        self.context['attendance'] = attendance
        self.context['participant'] = participant
        
        # Check if marking is allowed for this lecture (unless user is admin)
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and not user.is_staff:  # Non-admin users must respect time window
            if not LectureAttendance.can_mark_now(lecture):
                raise serializers.ValidationError(
                    "Attendance can only be marked within the allowed time window "
                    "(from 24 hours before lecture start until 24 hours after)."
                )
        
        return data


class LectureAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for reading LectureAttendance records."""
    
    participant_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    participant_code = serializers.SerializerMethodField()
    lecture_title = serializers.CharField(source='lecture.title', read_only=True)
    marked_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LectureAttendance
        fields = [
            'id', 'lecture', 'lecture_title', 'child', 'student',
            'participant_name', 'participant_type', 'participant_code',
            'present', 'rating', 'notes', 'marked_by', 'marked_by_name',
            'marked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'marked_by', 'marked_at', 'created_at', 'updated_at'
        ]
    
    def get_participant_name(self, obj):
        """Get the name of the participant (child or student)."""
        if obj.child:
            return obj.child.first_name
        elif obj.student and obj.student.user:
            return obj.student.user.get_full_name() or obj.student.user.username
        return "Unknown"
    
    def get_participant_type(self, obj):
        """Get the type of participant."""
        return "child" if obj.child else "student"
    
    def get_participant_code(self, obj):
        """Get the code of the participant."""
        if obj.child:
            return obj.child.code
        elif obj.student:
            return obj.student.code
        return None
    
    def get_marked_by_name(self, obj):
        """Get the name of the user who marked the attendance."""
        if obj.marked_by:
            return obj.marked_by.get_full_name() or obj.marked_by.username
        return None
