from django.contrib import admin
from enrollments_payments.models.enrollment import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('get_participant', 'get_course', 'get_status',
                    'get_enrolled_at', 'get_created_by', 'get_amount_paid', 'get_remaining')
    list_filter = ('status', 'enrolled_at', 'course')
    search_fields = ('student__user__first_name',
                     'child__first_name', 'course__name')
    date_hierarchy = 'enrolled_at'
    readonly_fields = ('id', 'enrolled_at', 'updated_at',
                       'get_amount_paid', 'get_remaining')

    fieldsets = (
        ('معلومات التسجيل', {'fields': ('course', 'student', 'child')}),
        ('الحالة', {'fields': ('status', 'enrolled_at', 'created_by')}),
        ('معلومات المدفوعات', {
         'fields': ('get_amount_paid', 'get_remaining')}),
        ('التواريخ', {'fields': ('id', 'updated_at')}),
    )

    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_enrolled_at(self, obj):
        return obj.enrolled_at
    get_enrolled_at.short_description = 'تاريخ التسجيل'
    get_enrolled_at.admin_order_field = 'enrolled_at'

    def get_created_by(self, obj):
        return obj.created_by
    get_created_by.short_description = 'تم الإنشاء بواسطة'
    get_created_by.admin_order_field = 'created_by'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'student' in form.base_fields:
            form.base_fields['student'].label = 'الطالب'
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'enrolled_at' in form.base_fields:
            form.base_fields['enrolled_at'].label = 'تاريخ التسجيل'
        if 'created_by' in form.base_fields:
            form.base_fields['created_by'].label = 'تم الإنشاء بواسطة'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    def get_participant(self, obj):
        return obj.get_participant()
    get_participant.short_description = 'الطالب/الطفل'

    def get_amount_paid(self, obj):
        return f"{obj.amount_paid()} جنيه"
    get_amount_paid.short_description = 'المبلغ المدفوع'

    def get_remaining(self, obj):
        return f"{obj.remaining_amount()} جنيه"
    get_remaining.short_description = 'المبلغ المتبقي'
