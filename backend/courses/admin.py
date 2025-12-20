from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Season, Tag, Course, CourseSchedule, Lecture, Exam, ExamResult


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'season_type', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('season_type', 'is_active', 'start_date')
    search_fields = ('name', 'description')
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('معلومات الموسم', {'fields': ('name', 'season_type', 'description')}),
        ('التواريخ', {'fields': ('start_date', 'end_date', 'is_active')}),
    )


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'instructor', 'season', 'start_date', 'end_date', 'capacity', 'enrolled_count', 'price', 'is_active')
    list_filter = ('is_active', 'season', 'instructor', 'for_adults', 'start_date')
    search_fields = ('name', 'description', 'slug')
    date_hierarchy = 'start_date'
    filter_horizontal = ('tags',)
    
    fieldsets = (
        ('معلومات الدورة', {'fields': ('name', 'description', 'instructor', 'season')}),
        ('التواريخ والمحاضرات', {'fields': ('start_date', 'end_date', 'num_lectures')}),
        ('السعة والسعر', {'fields': ('capacity', 'enrolled_count', 'price')}),
        ('الفئة العمرية', {'fields': ('for_adults', 'min_age', 'max_age')}),
        ('إعدادات إضافية', {'fields': ('tags', 'slug', 'is_active')}),
    )


@admin.register(CourseSchedule)
class CourseScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'get_weekday', 'start_time', 'end_time')
    list_filter = ('weekday', 'course')
    search_fields = ('course__name',)
    
    def get_weekday(self, obj):
        return obj.get_weekday_display()
    get_weekday.short_description = 'اليوم'


@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'lecture_number', 'day', 'start_time', 'end_time', 'instructor', 'status', 'attendance_taken')
    list_filter = ('status', 'attendance_taken', 'day', 'course', 'instructor')
    search_fields = ('title', 'course__name', 'instructor__user__first_name')
    date_hierarchy = 'day'
    
    fieldsets = (
        ('معلومات المحاضرة', {'fields': ('title', 'course', 'lecture_number', 'instructor')}),
        ('التوقيت', {'fields': ('day', 'start_time', 'end_time')}),
        ('الحالة', {'fields': ('status', 'attendance_taken')}),
    )


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'exam_type', 'course', 'instructor', 'scheduled_at', 'total_marks')
    list_filter = ('exam_type', 'course', 'instructor', 'scheduled_at')
    search_fields = ('name', 'description', 'course__name')
    date_hierarchy = 'scheduled_at'
    
    fieldsets = (
        ('معلومات الامتحان', {'fields': ('name', 'exam_type', 'description')}),
        ('الدورة والمدرس', {'fields': ('course', 'instructor')}),
        ('التوقيت والدرجات', {'fields': ('scheduled_at', 'total_marks')}),
    )


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('exam', 'get_participant', 'marks_obtained', 'percentage', 'passed', 'entered_by', 'entered_at')
    list_filter = ('passed', 'exam', 'entered_at')
    search_fields = ('exam__name', 'student__user__first_name', 'child__first_name', 'notes')
    date_hierarchy = 'entered_at'
    readonly_fields = ('percentage', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات النتيجة', {'fields': ('exam', 'student', 'child')}),
        ('الدرجات', {'fields': ('marks_obtained', 'percentage', 'passed')}),
        ('ملاحظات', {'fields': ('notes', 'entered_by', 'entered_at')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_participant(self, obj):
        return obj.student or obj.child
    get_participant.short_description = 'الطالب/الطفل'
