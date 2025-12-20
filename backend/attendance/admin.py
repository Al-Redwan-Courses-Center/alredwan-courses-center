from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import AttendanceDevice, LectureAttendance, StudentInstructorRating, ParentInstructorRating


@admin.register(AttendanceDevice)
class AttendanceDeviceAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'name', 'location', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('device_id', 'name', 'location')
    
    fieldsets = (
        ('معلومات الجهاز', {'fields': ('device_id', 'name', 'location', 'is_active')}),
    )


@admin.register(LectureAttendance)
class LectureAttendanceAdmin(admin.ModelAdmin):
    list_display = ('lecture', 'get_participant', 'present', 'rating', 'marked_by', 'marked_at')
    list_filter = ('present', 'lecture__course', 'marked_at')
    search_fields = ('lecture__title', 'student__user__first_name', 'child__first_name', 'notes')
    date_hierarchy = 'marked_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات الحضور', {'fields': ('lecture', 'student', 'child')}),
        ('الحالة والتقييم', {'fields': ('present', 'rating', 'notes')}),
        ('معلومات التسجيل', {'fields': ('marked_by', 'marked_at')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_participant(self, obj):
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return 'غير محدد'
    get_participant.short_description = 'الطالب/الطفل'


@admin.register(StudentInstructorRating)
class StudentInstructorRatingAdmin(admin.ModelAdmin):
    list_display = ('student', 'instructor', 'course', 'rating', 'created_at')
    list_filter = ('rating', 'course', 'instructor', 'created_at')
    search_fields = ('student__user__first_name', 'instructor__user__first_name', 'feedback')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات التقييم', {'fields': ('student', 'instructor', 'course')}),
        ('التقييم', {'fields': ('rating', 'feedback')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(ParentInstructorRating)
class ParentInstructorRatingAdmin(admin.ModelAdmin):
    list_display = ('parent', 'instructor', 'course', 'rating', 'created_at')
    list_filter = ('rating', 'course', 'instructor', 'created_at')
    search_fields = ('parent__user__first_name', 'instructor__user__first_name', 'feedback')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات التقييم', {'fields': ('parent', 'instructor', 'course')}),
        ('التقييم', {'fields': ('rating', 'feedback')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )
