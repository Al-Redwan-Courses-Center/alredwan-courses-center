from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models.lecture_attendance import LectureAttendance
from .serializers import MarkAttendanceSerializer, LectureAttendanceSerializer


class LectureAttendanceView(APIView):
    """
    API endpoint to mark attendance for a student or child.
    
    POST /api/attendance/lecture/<lecture_id>/mark/
    
    Request body:
    {
        "code": "M64793",
        "participant_type": "student",
        "rating": 8,
        "notes": "Optional notes"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, lecture_id):
        """Mark attendance for a student or child using their code."""
        # Add lecture_id to the request data
        data = request.data.copy()
        data['lecture_id'] = lecture_id
        
        serializer = MarkAttendanceSerializer(
            data=data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the validated data and attendance record
        validated_data = serializer.validated_data
        attendance = serializer.context['attendance']
        
        try:
            with transaction.atomic():
                # Set rating and notes before marking
                attendance.rating = validated_data['rating']
                attendance.notes = validated_data.get('notes', '')
                
                # Use the model's mark() method to mark as present (attended)
                attendance.mark(
                    present=True,
                    marked_by_user=request.user
                )
            
            # Return the updated attendance record
            response_serializer = LectureAttendanceSerializer(attendance)
            return Response(
                {
                    'message': 'Attendance marked successfully',
                    'lecture_id': validated_data['lecture_id'],
                    'attendance': response_serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to mark attendance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
