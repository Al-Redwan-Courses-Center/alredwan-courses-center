from django.contrib import admin
from .models import StudentInstructorRating, ParentInstructorRating, StudentCourseRating, ParentCourseRating
from .mixins import ExcelExportMixin


@admin.register(StudentInstructorRating)
class StudentInstructorRatingAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('action_checkbox', 'get_student', 'get_instructor',
                    'get_course', 'get_rating', 'get_created_at')


@admin.register(ParentInstructorRating)
class ParentInstructorRatingAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('action_checkbox', 'get_parent', 'get_instructor',
                    'get_course', 'get_rating', 'get_created_at')


@admin.register(StudentCourseRating)
class StudentCourseRatingAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('action_checkbox', 'get_student', 'get_course',
                    'get_rating', 'get_created_at')


@admin.register(ParentCourseRating)
class ParentCourseRatingAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('action_checkbox', 'get_parent', 'get_course', 'get_rating', 'get_created_at')