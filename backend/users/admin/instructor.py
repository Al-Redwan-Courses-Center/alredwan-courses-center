from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from ..models.instructor import Instructor
from attendance.models import SupervisorSchedule, InstructorAttendance
from courses.models import Lecture


class SupervisorScheduleInline(admin.TabularInline):
    model = SupervisorSchedule
    extra = 0
    classes = ('collapse',)
    verbose_name = 'جدول المشرف'
    verbose_name_plural = 'جداول المشرف'
    fields = ('day_of_week', 'start_time', 'end_time', 'grace_period_minutes', 'auto_absent_after_minutes')


class InstructorAttendanceInline(admin.TabularInline):
    model = InstructorAttendance
    extra = 0
    classes = ('collapse',)
    verbose_name = 'سجل حضور'
    verbose_name_plural = 'سجلات الحضور'
    fields = ('date', 'status', 'check_in_time', 'check_out_time', 'rating', 'season')
    readonly_fields = ('date', 'check_in_time', 'check_out_time', 'season')
    ordering = ('-date',)
    max_num = 20  # Limit to recent records for performance


class LectureInline(admin.TabularInline):
    model = Lecture
    extra = 0
    classes = ('collapse',)
    verbose_name = 'محاضرة'
    verbose_name_plural = 'المحاضرات'
    fields = ('course', 'day', 'start_time', 'end_time', 'lecture_number', 'status')
    readonly_fields = ('course', 'day', 'lecture_number')
    ordering = ('-day',)
    max_num = 20  # Limit for performance

    def has_add_permission(self, request, obj=None):
        return False  # Lectures are managed through courses


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_type',
                    'get_monthly_salary', 'get_phone', 'get_tags_display', 'get_joined_date')
    list_filter = ('type', 'tags', 'joined_date')
    search_fields = ('user__first_name', 'user__last_name',
                     'user__phone_number1')
    list_select_related = ('user',)
    prefetch_related = ('tags',)
    filter_horizontal = ('tags',)
    inlines = [SupervisorScheduleInline, InstructorAttendanceInline, LectureInline]
    fieldsets = (
        ('معلومات المدرس', {
         'fields': ('user', 'type', 'bio', 'monthly_salary')}),
        ('الفئات', {'fields': ('tags',)}),
        ('الصور', {'fields': ('image', 'nid_front', 'nid_back'),
                   'classes': ('collapse',)}),
    )
    autocomplete_fields = ('user',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('tags').annotate(tags_count=Count('tags'))

    def get_tags_display(self, obj):
        """Display tags as colored badges."""
        tags = obj.tags.all()
        if tags:
            badges = ''.join([
                format_html(
                    '<span style="background: #9b59b6; color: white; padding: 2px 6px; '
                    'border-radius: 8px; margin: 1px; display: inline-block; font-size: 0.85em;">{}</span>',
                    tag.name
                ) for tag in tags[:3]  # Show max 3 tags
            ])
            if len(tags) > 3:
                badges += format_html(
                    '<span style="color: #7f8c8d; font-size: 0.85em;"> +{}</span>',
                    len(tags) - 3
                )
            return format_html(badges)
        return format_html('<span style="color: #95a5a6;">-</span>')
    get_tags_display.short_description = 'الفئات'
    def get_type(self, obj):
        return obj.get_type_display()
    get_type.short_description = 'النوع'
    get_type.admin_order_field = 'type'

    def get_monthly_salary(self, obj):
        return obj.monthly_salary
    get_monthly_salary.short_description = 'الراتب الشهري'
    get_monthly_salary.admin_order_field = 'monthly_salary'

    def get_joined_date(self, obj):
        return obj.joined_date
    get_joined_date.short_description = 'تاريخ الانضمام'
    get_joined_date.admin_order_field = 'joined_date'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'type' in form.base_fields:
            form.base_fields['type'].label = 'النوع'
        if 'bio' in form.base_fields:
            form.base_fields['bio'].label = 'السيرة الذاتية'
        if 'monthly_salary' in form.base_fields:
            form.base_fields['monthly_salary'].label = 'الراتب الشهري'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        if 'nid_front' in form.base_fields:
            form.base_fields['nid_front'].label = 'صورة الهوية (أمامي)'
        if 'nid_back' in form.base_fields:
            form.base_fields['nid_back'].label = 'صورة الهوية (خلفي)'
        if 'joined_date' in form.base_fields:
            form.base_fields['joined_date'].label = 'تاريخ الانضمام'
        return form

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'

    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'
