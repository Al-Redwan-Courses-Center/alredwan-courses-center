from django.contrib import admin
from enrollments_payments.models.enrollment_request import EnrollmentRequest


@admin.register(EnrollmentRequest)
class EnrollmentRequestAdmin(admin.ModelAdmin):
    list_display = ('get_participant', 'get_course', 'get_price', 'get_status',
                    'get_payment_method', 'get_created_at', 'get_processed_by')
    list_filter = ('status', 'payment_method', 'created_at', 'course')
    search_fields = ('student__user__first_name', 'child__first_name',
                     'parent__user__first_name', 'course__name', 'notes')
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'processed_at', 'expires_at')

    fieldsets = (
        ('معلومات الطلب', {
         'fields': ('course', 'parent', 'student', 'child')}),
        ('السعر وطريقة الدفع', {'fields': ('price', 'payment_method')}),
        ('الحالة', {'fields': ('status', 'notes')}),
        ('معلومات المعالجة', {'fields': ('processed_by', 'processed_at')}),
        ('التواريخ', {'fields': ('id', 'created_at', 'expires_at')}),
    )

    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_price(self, obj):
        return obj.price
    get_price.short_description = 'السعر'
    get_price.admin_order_field = 'price'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_payment_method(self, obj):
        return obj.get_payment_method_display()
    get_payment_method.short_description = 'طريقة الدفع'
    get_payment_method.admin_order_field = 'payment_method'

    def get_created_at(self, obj):
        return obj.created_at
    get_created_at.short_description = 'تاريخ الإنشاء'
    get_created_at.admin_order_field = 'created_at'

    def get_processed_by(self, obj):
        return obj.processed_by
    get_processed_by.short_description = 'تمت المعالجة بواسطة'
    get_processed_by.admin_order_field = 'processed_by'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'parent' in form.base_fields:
            form.base_fields['parent'].label = 'ولي الأمر'
        if 'student' in form.base_fields:
            form.base_fields['student'].label = 'الطالب'
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'price' in form.base_fields:
            form.base_fields['price'].label = 'السعر'
        if 'payment_method' in form.base_fields:
            form.base_fields['payment_method'].label = 'طريقة الدفع'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'notes' in form.base_fields:
            form.base_fields['notes'].label = 'ملاحظات'
        if 'processed_by' in form.base_fields:
            form.base_fields['processed_by'].label = 'تمت المعالجة بواسطة'
        if 'processed_at' in form.base_fields:
            form.base_fields['processed_at'].label = 'تاريخ المعالجة'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'expires_at' in form.base_fields:
            form.base_fields['expires_at'].label = 'تاريخ الانتهاء'
        return form

    def get_participant(self, obj):
        return obj.get_participant()
    get_participant.short_description = 'الطالب/الطفل'
