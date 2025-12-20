from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import EnrollmentRequest, Enrollment, Payment, RefundRequest


@admin.register(EnrollmentRequest)
class EnrollmentRequestAdmin(admin.ModelAdmin):
    list_display = ('get_participant', 'course', 'price', 'status', 'payment_method', 'created_at', 'processed_by')
    list_filter = ('status', 'payment_method', 'created_at', 'course')
    search_fields = ('student__user__first_name', 'child__first_name', 'parent__user__first_name', 'course__name', 'notes')
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'processed_at', 'expires_at')
    
    fieldsets = (
        ('معلومات الطلب', {'fields': ('course', 'parent', 'student', 'child')}),
        ('السعر وطريقة الدفع', {'fields': ('price', 'payment_method')}),
        ('الحالة', {'fields': ('status', 'notes')}),
        ('معلومات المعالجة', {'fields': ('processed_by', 'processed_at')}),
        ('التواريخ', {'fields': ('id', 'created_at', 'expires_at')}),
    )
    
    def get_participant(self, obj):
        return obj.get_participant()
    get_participant.short_description = 'الطالب/الطفل'


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('get_participant', 'course', 'status', 'enrolled_at', 'created_by', 'get_amount_paid', 'get_remaining')
    list_filter = ('status', 'enrolled_at', 'course')
    search_fields = ('student__user__first_name', 'child__first_name', 'course__name')
    date_hierarchy = 'enrolled_at'
    readonly_fields = ('id', 'enrolled_at', 'updated_at', 'get_amount_paid', 'get_remaining')
    
    fieldsets = (
        ('معلومات التسجيل', {'fields': ('course', 'student', 'child')}),
        ('الحالة', {'fields': ('status', 'enrolled_at', 'created_by')}),
        ('معلومات المدفوعات', {'fields': ('get_amount_paid', 'get_remaining')}),
        ('التواريخ', {'fields': ('id', 'updated_at')}),
    )
    
    def get_participant(self, obj):
        return obj.get_participant()
    get_participant.short_description = 'الطالب/الطفل'
    
    def get_amount_paid(self, obj):
        return f"{obj.amount_paid()} جنيه"
    get_amount_paid.short_description = 'المبلغ المدفوع'
    
    def get_remaining(self, obj):
        return f"{obj.remaining_amount()} جنيه"
    get_remaining.short_description = 'المبلغ المتبقي'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('get_payer', 'enrollment', 'amount', 'method', 'status', 'processed_by', 'processed_at', 'reference_number')
    list_filter = ('status', 'method', 'processed_at', 'created_at')
    search_fields = ('payer_parent__user__first_name', 'payer_student__user__first_name', 'reference_number', 'notes')
    date_hierarchy = 'processed_at'
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات الدفع', {'fields': ('enrollment', 'payer_parent', 'payer_student')}),
        ('المبلغ والطريقة', {'fields': ('amount', 'method', 'reference_number')}),
        ('الحالة', {'fields': ('status', 'notes')}),
        ('معلومات المعالجة', {'fields': ('processed_by', 'processed_at')}),
        ('التواريخ', {'fields': ('id', 'created_at', 'updated_at')}),
    )
    
    def get_payer(self, obj):
        if obj.payer_parent:
            return obj.payer_parent.user.get_full_name()
        elif obj.payer_student:
            return obj.payer_student.user.get_full_name()
        return 'غير محدد'
    get_payer.short_description = 'الدافع'


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'get_requester', 'status', 'created_at', 'processed_by', 'processed_at')
    list_filter = ('status', 'created_at', 'processed_at')
    search_fields = ('enrollment__course__name', 'reason', 'processed_note', 'requested_by_parent__user__first_name', 'requested_by_student__user__first_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'processed_at')
    
    fieldsets = (
        ('معلومات الطلب', {'fields': ('enrollment', 'requested_by_parent', 'requested_by_student')}),
        ('السبب', {'fields': ('reason',)}),
        ('الحالة', {'fields': ('status', 'processed_note')}),
        ('معلومات المعالجة', {'fields': ('processed_by', 'processed_at')}),
        ('التواريخ', {'fields': ('id', 'created_at')}),
    )
    
    def get_requester(self, obj):
        if obj.requested_by_parent:
            return obj.requested_by_parent.user.get_full_name()
        elif obj.requested_by_student:
            return obj.requested_by_student.user.get_full_name()
        return 'غير محدد'
    get_requester.short_description = 'مقدم الطلب'
