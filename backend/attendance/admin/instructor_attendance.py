from django.contrib import admin
from ..models.instructor_attendance import InstructorAttendance


@admin.register(InstructorAttendance)
class InstructorAttendanceAdmin(admin.ModelAdmin):
    list_display = ('get_instructor', 'get_date', 'get_status',
                    'get_check_in_time', 'get_check_out_time', 'get_rating', 'get_rated_by')
    list_filter = ('status', 'date', 'season', 'check_in_method')
    search_fields = ('instructor__user__first_name',
                     'instructor__user__last_name')
    date_hierarchy = 'date'

    fieldsets = (
        ('معلومات الحضور', {
         'fields': ('instructor', 'date', 'season', 'status')}),
        ('التوقيت', {'fields': ('check_in_time', 'check_out_time',
         'check_in_method', 'check_in_device')}),
        ('المحاضرة والجدول', {'fields': ('lecture', 'schedule')}),
        ('التقييم', {'fields': ('rating', 'rated_by', 'notes')}),
    )

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_date(self, obj):
        return obj.date
    get_date.short_description = 'التاريخ'
    get_date.admin_order_field = 'date'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_check_in_time(self, obj):
        return obj.check_in_time
    get_check_in_time.short_description = 'وقت الحضور'
    get_check_in_time.admin_order_field = 'check_in_time'

    def get_check_out_time(self, obj):
        return obj.check_out_time
    get_check_out_time.short_description = 'وقت المغادرة'
    get_check_out_time.admin_order_field = 'check_out_time'

    def get_rating(self, obj):
        return obj.rating
    get_rating.short_description = 'التقييم'
    get_rating.admin_order_field = 'rating'

    def get_rated_by(self, obj):
        return obj.rated_by
    get_rated_by.short_description = 'تم التقييم بواسطة'
    get_rated_by.admin_order_field = 'rated_by'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'date' in form.base_fields:
            form.base_fields['date'].label = 'التاريخ'
        if 'season' in form.base_fields:
            form.base_fields['season'].label = 'الموسم'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'check_in_time' in form.base_fields:
            form.base_fields['check_in_time'].label = 'وقت الحضور'
        if 'check_out_time' in form.base_fields:
            form.base_fields['check_out_time'].label = 'وقت المغادرة'
        if 'check_in_method' in form.base_fields:
            form.base_fields['check_in_method'].label = 'طريقة التسجيل'
        if 'check_in_device' in form.base_fields:
            form.base_fields['check_in_device'].label = 'جهاز التسجيل'
        if 'lecture' in form.base_fields:
            form.base_fields['lecture'].label = 'المحاضرة'
        if 'schedule' in form.base_fields:
            form.base_fields['schedule'].label = 'الجدول'
        if 'rating' in form.base_fields:
            form.base_fields['rating'].label = 'التقييم'
        if 'rated_by' in form.base_fields:
            form.base_fields['rated_by'].label = 'تم التقييم بواسطة'
        if 'notes' in form.base_fields:
            form.base_fields['notes'].label = 'ملاحظات'
        return form
