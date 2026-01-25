from django.contrib import admin
from enrollments_payments.models.payment import Payment, RefundRequest


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('get_payer', 'get_enrollment', 'get_amount', 'get_method',
                    'get_status', 'get_processed_by', 'get_processed_at', 'get_reference_number')
    list_filter = ('status', 'method', 'processed_at', 'created_at')
    search_fields = ('payer_parent__user__first_name',
                     'payer_student__user__first_name', 'reference_number', 'notes')
    date_hierarchy = 'processed_at'
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        ('معلومات الدفع', {
         'fields': ('enrollment', 'payer_parent', 'payer_student')}),
        ('المبلغ والطريقة', {
         'fields': ('amount', 'method', 'reference_number')}),
        ('الحالة', {'fields': ('status', 'notes')}),
        ('معلومات المعالجة', {'fields': ('processed_by', 'processed_at')}),
        ('التواريخ', {'fields': ('id', 'created_at', 'updated_at')}),
    )

    def get_enrollment(self, obj):
        return obj.enrollment
    get_enrollment.short_description = 'التسجيل'
    get_enrollment.admin_order_field = 'enrollment'

    def get_amount(self, obj):
        return obj.amount
    get_amount.short_description = 'المبلغ'
    get_amount.admin_order_field = 'amount'

    def get_method(self, obj):
        return obj.get_method_display()
    get_method.short_description = 'طريقة الدفع'
    get_method.admin_order_field = 'method'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_processed_by(self, obj):
        return obj.processed_by
    get_processed_by.short_description = 'تمت المعالجة بواسطة'
    get_processed_by.admin_order_field = 'processed_by'

    def get_processed_at(self, obj):
        return obj.processed_at
    get_processed_at.short_description = 'تاريخ المعالجة'
    get_processed_at.admin_order_field = 'processed_at'

    def get_reference_number(self, obj):
        return obj.reference_number
    get_reference_number.short_description = 'رقم المرجع'
    get_reference_number.admin_order_field = 'reference_number'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'enrollment' in form.base_fields:
            form.base_fields['enrollment'].label = 'التسجيل'
        if 'payer_parent' in form.base_fields:
            form.base_fields['payer_parent'].label = 'ولي الأمر الدافع'
        if 'payer_student' in form.base_fields:
            form.base_fields['payer_student'].label = 'الطالب الدافع'
        if 'amount' in form.base_fields:
            form.base_fields['amount'].label = 'المبلغ'
        if 'method' in form.base_fields:
            form.base_fields['method'].label = 'طريقة الدفع'
        if 'reference_number' in form.base_fields:
            form.base_fields['reference_number'].label = 'رقم المرجع'
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
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    def get_payer(self, obj):
        if obj.payer_parent:
            return obj.payer_parent.user.get_full_name()
        elif obj.payer_student:
            return obj.payer_student.user.get_full_name()
        return 'غير محدد'
    get_payer.short_description = 'الدافع'


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ('get_enrollment', 'get_requester', 'get_status',
                    'get_created_at', 'get_processed_by', 'get_processed_at')
    list_filter = ('status', 'created_at', 'processed_at')
    search_fields = ('enrollment__course__name', 'reason', 'processed_note',
                     'requested_by_parent__user__first_name', 'requested_by_student__user__first_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'processed_at')

    fieldsets = (
        ('معلومات الطلب', {'fields': ('enrollment',
         'requested_by_parent', 'requested_by_student')}),
        ('السبب', {'fields': ('reason',)}),
        ('الحالة', {'fields': ('status', 'processed_note')}),
        ('معلومات المعالجة', {'fields': ('processed_by', 'processed_at')}),
        ('التواريخ', {'fields': ('id', 'created_at')}),
    )

    def get_enrollment(self, obj):
        return obj.enrollment
    get_enrollment.short_description = 'التسجيل'
    get_enrollment.admin_order_field = 'enrollment'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_created_at(self, obj):
        return obj.created_at
    get_created_at.short_description = 'تاريخ الإنشاء'
    get_created_at.admin_order_field = 'created_at'

    def get_processed_by(self, obj):
        return obj.processed_by
    get_processed_by.short_description = 'تمت المعالجة بواسطة'
    get_processed_by.admin_order_field = 'processed_by'

    def get_processed_at(self, obj):
        return obj.processed_at
    get_processed_at.short_description = 'تاريخ المعالجة'
    get_processed_at.admin_order_field = 'processed_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'enrollment' in form.base_fields:
            form.base_fields['enrollment'].label = 'التسجيل'
        if 'requested_by_parent' in form.base_fields:
            form.base_fields['requested_by_parent'].label = 'ولي الأمر مقدم الطلب'
        if 'requested_by_student' in form.base_fields:
            form.base_fields['requested_by_student'].label = 'الطالب مقدم الطلب'
        if 'reason' in form.base_fields:
            form.base_fields['reason'].label = 'السبب'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'processed_note' in form.base_fields:
            form.base_fields['processed_note'].label = 'ملاحظة المعالجة'
        if 'processed_by' in form.base_fields:
            form.base_fields['processed_by'].label = 'تمت المعالجة بواسطة'
        if 'processed_at' in form.base_fields:
            form.base_fields['processed_at'].label = 'تاريخ المعالجة'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        return form

    def get_requester(self, obj):
        if obj.requested_by_parent:
            return obj.requested_by_parent.user.get_full_name()
        elif obj.requested_by_student:
            return obj.requested_by_student.user.get_full_name()
        return 'غير محدد'
    get_requester.short_description = 'مقدم الطلب'
