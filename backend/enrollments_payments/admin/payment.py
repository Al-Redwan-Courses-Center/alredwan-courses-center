from django.contrib import admin
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse
from django.db.models import Sum, Count
from core.utils import ExcelExportMixin

from enrollments_payments.models.payment import (
    Payment, RefundRequest, PaymentStatus, PaymentMethod
)


# =============================================================================
# Custom Filters for Payment
# =============================================================================
class PaymentStatusFilter(admin.SimpleListFilter):
    """Filter payments by status with visual indicators."""
    title = _('حالة الدفع')
    parameter_name = 'payment_status'

    def lookups(self, request, model_admin):
        return (
            ('pending', _('⏳ معلق')),
            ('paid', _('✅ مدفوع')),
            ('refunded', _('💸 مسترد')),
            ('void', _('❌ ملغى')),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset


class PaymentMethodFilter(admin.SimpleListFilter):
    """Filter by payment method."""
    title = _('طريقة الدفع')
    parameter_name = 'payment_method'

    def lookups(self, request, model_admin):
        return (
            ('cash', _('💵 نقدًا')),
            ('card', _('💳 بطاقة')),
            ('bank_transfer', _('🏦 تحويل بنكي')),
            ('instapay', _('📱 إنستاباي')),
            ('vodafone_cash', _('📲 فودافون كاش')),
            ('other', _('📋 أخرى')),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(method=self.value())
        return queryset


class PayerTypeFilter(admin.SimpleListFilter):
    """Filter by payer type."""
    title = _('نوع الدافع')
    parameter_name = 'payer_type'

    def lookups(self, request, model_admin):
        return (
            ('parent', _('👨‍👩‍👧 ولي أمر')),
            ('student', _('🧑‍🎓 طالب')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'parent':
            return queryset.filter(payer_parent__isnull=False)
        if self.value() == 'student':
            return queryset.filter(payer_student__isnull=False)
        return queryset


class AmountRangeFilter(admin.SimpleListFilter):
    """Filter by payment amount range."""
    title = _('نطاق المبلغ')
    parameter_name = 'amount_range'

    def lookups(self, request, model_admin):
        return (
            ('small', _('💰 أقل من 500 ج.م')),
            ('medium', _('💰 500 - 1000 ج.م')),
            ('large', _('💰 1000 - 2000 ج.م')),
            ('xlarge', _('💰 أكثر من 2000 ج.م')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'small':
            return queryset.filter(amount__lt=500)
        elif self.value() == 'medium':
            return queryset.filter(amount__gte=500, amount__lt=1000)
        elif self.value() == 'large':
            return queryset.filter(amount__gte=1000, amount__lt=2000)
        elif self.value() == 'xlarge':
            return queryset.filter(amount__gte=2000)
        return queryset


class PaymentPeriodFilter(admin.SimpleListFilter):
    """Filter by payment date period."""
    title = _('فترة الدفع')
    parameter_name = 'payment_period'

    def lookups(self, request, model_admin):
        return (
            ('today', _('📅 اليوم')),
            ('week', _('📆 هذا الأسبوع')),
            ('month', _('🗓️ هذا الشهر')),
            ('older', _('📜 أقدم من شهر')),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'today':
            return queryset.filter(processed_at__date=now.date())
        elif self.value() == 'week':
            week_ago = now - timezone.timedelta(days=7)
            return queryset.filter(processed_at__gte=week_ago)
        elif self.value() == 'month':
            month_ago = now - timezone.timedelta(days=30)
            return queryset.filter(processed_at__gte=month_ago)
        elif self.value() == 'older':
            month_ago = now - timezone.timedelta(days=30)
            return queryset.filter(processed_at__lt=month_ago)
        return queryset


# =============================================================================
# Admin Actions for Payment
# =============================================================================
@admin.action(description=_('✅ تأكيد الدفع للعناصر المحددة'))
def mark_as_paid(modeladmin, request, queryset):
    """Mark selected pending payments as paid."""
    pending = queryset.filter(status=PaymentStatus.PENDING)
    count = 0
    errors = []
    
    for payment in pending:
        try:
            payment.mark_paid(processed_by_user=request.user)
            count += 1
        except Exception as e:
            errors.append(str(e))
    
    if count:
        modeladmin.message_user(
            request,
            _(f'تم تأكيد {count} دفعة بنجاح'),
            level=messages.SUCCESS
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل تأكيد بعض الدفعات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('💸 استرداد الدفعات المحددة'))
def mark_as_refunded(modeladmin, request, queryset):
    """Mark selected paid payments as refunded."""
    paid = queryset.filter(status=PaymentStatus.PAID)
    count = 0
    errors = []
    
    for payment in paid:
        try:
            payment.mark_refunded(processed_by_user=request.user)
            count += 1
        except Exception as e:
            errors.append(str(e))
    
    if count:
        modeladmin.message_user(
            request,
            _(f'تم استرداد {count} دفعة'),
            level=messages.WARNING
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل استرداد بعض الدفعات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('❌ إلغاء الدفعات المحددة'))
def void_payments(modeladmin, request, queryset):
    """Void selected pending payments."""
    pending = queryset.filter(status=PaymentStatus.PENDING)
    count = 0
    errors = []
    
    for payment in pending:
        try:
            payment.update_status(PaymentStatus.VOID, processed_by=request.user)
            count += 1
        except Exception as e:
            errors.append(str(e))
    
    if count:
        modeladmin.message_user(
            request,
            _(f'تم إلغاء {count} دفعة'),
            level=messages.WARNING
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل إلغاء بعض الدفعات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


# =============================================================================
# Payment Admin Configuration
# =============================================================================
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin, ExcelExportMixin):
    """Enhanced admin configuration for Payment model."""
    
    # List display
    list_display = (
        'get_payer_display', 'get_enrollment_link', 'get_amount_display',
        'get_method_badge', 'get_status_badge', 'get_processed_date',
        'get_processed_by_display', 'get_reference_display'
    )
    
    # Filters
    list_filter = (
        PaymentStatusFilter, PaymentMethodFilter, PayerTypeFilter,
        AmountRangeFilter, PaymentPeriodFilter, 'enrollment__course'
    )
    
    # Search
    search_fields = (
        'payer_parent__user__first_name', 'payer_parent__user__last_name',
        'payer_student__user__first_name', 'payer_student__user__last_name',
        'enrollment__course__name', 'reference_number', 'notes', 'id'
    )
    
    # Date navigation
    date_hierarchy = 'processed_at'
    
    # Autocomplete
    autocomplete_fields = ['enrollment', 'payer_parent', 'payer_student', 'processed_by']
    
    # Pagination
    list_per_page = 25
    
    # Ordering
    ordering = ('-created_at',)
    
    # Save on top
    save_on_top = True
    
    # Actions
    actions = [mark_as_paid, mark_as_refunded, void_payments]
    
    # Excel export configuration
    excel_filename = 'payments'
    
    # =========================================================================
    # Dynamic Fieldsets
    # =========================================================================
    def get_fieldsets(self, request, obj=None):
        """Return different fieldsets for add vs edit."""
        if obj is None:
            # ADD PAGE
            return (
                (_('معلومات الإلتحاق'), {
                    'fields': ('enrollment',),
                    'description': _('اختر الإلتحاق المرتبط بهذه الدفعة')
                }),
                (_('معلومات الدافع'), {
                    'fields': ('payer_parent', 'payer_student'),
                    'description': _('اختر إما ولي أمر أو طالب (ليس كلاهما)')
                }),
                (_('تفاصيل الدفع'), {
                    'fields': ('amount', 'method', 'reference_number'),
                }),
                (_('الحالة'), {
                    'fields': ('status',),
                }),
                (_('ملاحظات'), {
                    'fields': ('notes',),
                    'classes': ('collapse',),
                }),
            )
        else:
            # EDIT PAGE
            return (
                (_('معلومات الإلتحاق'), {
                    'fields': ('enrollment', 'get_enrollment_info'),
                }),
                (_('معلومات الدافع'), {
                    'fields': ('get_payer_info',),
                }),
                (_('تفاصيل الدفع'), {
                    'fields': ('amount', 'method', 'reference_number'),
                }),
                (_('الحالة'), {
                    'fields': ('status', 'notes'),
                }),
                (_('معلومات المعالجة'), {
                    'fields': ('processed_by', 'processed_at'),
                    'classes': ('collapse',),
                }),
                (_('معلومات النظام'), {
                    'fields': ('id', 'created_at', 'updated_at'),
                    'classes': ('collapse',),
                }),
            )
    
    def get_readonly_fields(self, request, obj=None):
        """Return readonly fields based on add vs edit."""
        if obj is None:
            return ()
        else:
            readonly = ['id', 'created_at', 'updated_at', 'get_enrollment_info', 'get_payer_info']
            # Lock payer info after creation
            if obj.payer_parent or obj.payer_student:
                readonly.extend(['payer_parent', 'payer_student'])
            return readonly
    
    # =========================================================================
    # Query Optimization
    # =========================================================================
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related(
            'enrollment',
            'enrollment__course',
            'enrollment__student',
            'enrollment__student__user',
            'enrollment__child',
            'payer_parent',
            'payer_parent__user',
            'payer_student',
            'payer_student__user',
            'processed_by'
        )
    
    # =========================================================================
    # Display Methods
    # =========================================================================
    @admin.display(description=_('الدافع'))
    def get_payer_display(self, obj):
        """Display payer with type indicator."""
        if obj.payer_parent and obj.payer_parent.user:
            name = obj.payer_parent.user.get_full_name()
            return format_html(
                '<span style="color: #9b59b6;" title="ولي أمر">'
                '👨‍👩‍👧 <strong>{}</strong></span>',
                name
            )
        elif obj.payer_student and obj.payer_student.user:
            name = obj.payer_student.user.get_full_name()
            return format_html(
                '<span style="color: #2980b9;" title="طالب">'
                '🧑‍🎓 <strong>{}</strong></span>',
                name
            )
        return format_html('<span style="color: #95a5a6;">غير محدد</span>')
    
    @admin.display(description=_('الإلتحاق'), ordering='enrollment')
    def get_enrollment_link(self, obj):
        """Display enrollment as clickable link."""
        if obj.enrollment:
            url = reverse('admin:enrollments_payments_enrollment_change', args=[obj.enrollment.pk])
            participant = obj.enrollment.get_participant()
            course = obj.enrollment.course.name if obj.enrollment.course else '-'
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;" title="{}">'
                '📚 {}</a>',
                url, f'{participant} - {course}', course[:30]
            )
        return '-'
    
    @admin.display(description=_('المبلغ'), ordering='amount')
    def get_amount_display(self, obj):
        """Display amount with currency and visual styling."""
        if obj.amount is not None:
            amount_formatted = "{:,.0f}".format(float(obj.amount))
            if obj.amount == 0:
                return format_html(
                    '<span style="color: #95a5a6;">0 ج.م</span>'
                )
            elif obj.amount >= 1000:
                return format_html(
                    '<span style="color: #27ae60; font-weight: bold; font-size: 1.1em;">'
                    '💰 {} ج.م</span>',
                    amount_formatted
                )
            else:
                return format_html(
                    '<span style="color: #27ae60; font-weight: bold;">'
                    '{} ج.م</span>',
                    amount_formatted
                )
        return '-'
    
    @admin.display(description=_('طريقة الدفع'), ordering='method')
    def get_method_badge(self, obj):
        """Display payment method with icon."""
        method_config = {
            'cash': ('💵', '#27ae60', 'نقدًا'),
            'card': ('💳', '#3498db', 'بطاقة'),
            'bank_transfer': ('🏦', '#9b59b6', 'تحويل بنكي'),
            'instapay': ('📱', '#e74c3c', 'إنستاباي'),
            'vodafone_cash': ('📲', '#e74c3c', 'فودافون كاش'),
            'other': ('📋', '#95a5a6', 'أخرى'),
        }
        
        icon, color, label = method_config.get(
            obj.method, ('💰', '#95a5a6', obj.get_method_display())
        )
        
        return format_html(
            '<span style="color: {};">{} {}</span>',
            color, icon, label
        )
    
    @admin.display(description=_('الحالة'), ordering='status')
    def get_status_badge(self, obj):
        """Display status as colored badge."""
        status_config = {
            'pending': ('⏳', '#f39c12', 'معلق'),
            'paid': ('✅', '#27ae60', 'مدفوع'),
            'refunded': ('💸', '#9b59b6', 'مسترد'),
            'void': ('❌', '#e74c3c', 'ملغى'),
        }
        
        icon, color, label = status_config.get(
            obj.status, ('❓', '#95a5a6', obj.get_status_display())
        )
        
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 0.85em; white-space: nowrap;">'
            '{} {}</span>',
            color, icon, label
        )
    
    @admin.display(description=_('تاريخ الدفع'), ordering='processed_at')
    def get_processed_date(self, obj):
        """Display processed date with relative time."""
        if obj.processed_at:
            now = timezone.now()
            diff = now - obj.processed_at
            
            if diff.days == 0:
                hours = diff.seconds // 3600
                if hours == 0:
                    minutes = diff.seconds // 60
                    relative = f'منذ {minutes} دقيقة'
                else:
                    relative = f'منذ {hours} ساعة'
            elif diff.days == 1:
                relative = 'أمس'
            elif diff.days < 7:
                relative = f'منذ {diff.days} أيام'
            else:
                relative = obj.processed_at.strftime('%Y/%m/%d')
            
            return format_html(
                '<span title="{}">{}</span>',
                obj.processed_at.strftime('%Y/%m/%d %H:%M'),
                relative
            )
        return format_html('<small style="color: #f39c12;">لم يُعالج بعد</small>')
    
    @admin.display(description=_('بواسطة'))
    def get_processed_by_display(self, obj):
        """Display who processed the payment."""
        if obj.processed_by:
            name = obj.processed_by.get_full_name() or obj.processed_by.username
            return format_html(
                '<small style="color: #7f8c8d;">👤 {}</small>',
                name
            )
        return format_html('<small style="color: #bdc3c7;">-</small>')
    
    @admin.display(description=_('رقم المرجع'))
    def get_reference_display(self, obj):
        """Display reference number with copy hint."""
        if obj.reference_number:
            return format_html(
                '<code style="background: #264b5d; padding: 2px 6px; '
                'border-radius: 3px; font-size: 0.85em;" title="انقر للنسخ">{}</code>',
                obj.reference_number
            )
        return format_html('<small style="color: #bdc3c7;">-</small>')
    
    # =========================================================================
    # Readonly Display Fields
    # =========================================================================
    @admin.display(description=_('معلومات الإلتحاق'))
    def get_enrollment_info(self, obj):
        """Display detailed enrollment info."""
        if obj.enrollment:
            participant = obj.enrollment.get_participant()
            course = obj.enrollment.course
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👤 المشترك:</strong> {}<br>'
                '<strong>📚 الدورة:</strong> {}<br>'
                '<strong>💰 سعر الدورة:</strong> {} ج.م<br>'
                '<strong>✅ المدفوع:</strong> {} ج.م<br>'
                '<strong>⏳ المتبقي:</strong> {} ج.م'
                '</div>',
                participant,
                course.name if course else '-',
                course.price if course else '-',
                obj.enrollment.amount_paid(),
                obj.enrollment.remaining_amount()
            )
        return '-'
    
    @admin.display(description=_('معلومات الدافع'))
    def get_payer_info(self, obj):
        """Display detailed payer info."""
        if obj.payer_parent and obj.payer_parent.user:
            user = obj.payer_parent.user
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👨‍👩‍👧 ولي الأمر:</strong> {}<br>'
                '<strong>📧 البريد:</strong> {}<br>'
                '<strong>📱 الهاتف:</strong> {}'
                '</div>',
                user.get_full_name(),
                user.email or '-',
                getattr(user, 'phone_number1', '-')
            )
        elif obj.payer_student and obj.payer_student.user:
            user = obj.payer_student.user
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>🧑‍🎓 الطالب:</strong> {}<br>'
                '<strong>📧 البريد:</strong> {}<br>'
                '<strong>📱 الهاتف:</strong> {}'
                '</div>',
                user.get_full_name(),
                user.email or '-',
                getattr(user, 'phone_number1', '-')
            )
        return '-'
    
    # =========================================================================
    # Form Customization
    # =========================================================================
    def get_form(self, request, obj=None, **kwargs):
        """Apply Arabic labels."""
        form = super().get_form(request, obj, **kwargs)
        
        labels = {
            'enrollment': 'الإلتحاق',
            'payer_parent': 'ولي الأمر الدافع',
            'payer_student': 'الطالب الدافع',
            'amount': 'المبلغ',
            'method': 'طريقة الدفع',
            'reference_number': 'رقم المرجع',
            'status': 'الحالة',
            'notes': 'ملاحظات',
            'processed_by': 'تمت المعالجة بواسطة',
            'processed_at': 'تاريخ المعالجة',
            'created_at': 'تاريخ الإنشاء',
            'updated_at': 'تاريخ التحديث',
        }
        
        help_texts = {
            'payer_parent': 'اختر ولي الأمر إذا كان هو الدافع',
            'payer_student': 'اختر الطالب إذا كان هو الدافع',
            'reference_number': 'مطلوب للتحويلات البنكية',
        }
        
        for field_name, label in labels.items():
            if field_name in form.base_fields:
                form.base_fields[field_name].label = label
        
        if obj is None:
            for field_name, help_text in help_texts.items():
                if field_name in form.base_fields:
                    form.base_fields[field_name].help_text = help_text
        
        return form
    
    def save_model(self, request, obj, form, change):
        """Auto-set processed_by and processed_at when marking as paid."""
        if not change or obj.status == PaymentStatus.PAID:
            if not obj.processed_by:
                obj.processed_by = request.user
            if not obj.processed_at and obj.status == PaymentStatus.PAID:
                obj.processed_at = timezone.now()
        super().save_model(request, obj, form, change)
    
    def add_view(self, request, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = _('إضافة دفعة جديدة')
        return super().add_view(request, form_url, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = _('تفاصيل الدفعة')
        return super().change_view(request, object_id, form_url, extra_context)


# =============================================================================
# Custom Filters for RefundRequest
# =============================================================================
class RefundStatusFilter(admin.SimpleListFilter):
    """Filter refund requests by status."""
    title = _('حالة الطلب')
    parameter_name = 'refund_status'

    def lookups(self, request, model_admin):
        return (
            ('requested', _('📝 مطلوب')),
            ('approved', _('✅ موافق عليه')),
            ('rejected', _('❌ مرفوض')),
            ('processed', _('💸 تم المعالجة')),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset


class RequesterTypeFilter(admin.SimpleListFilter):
    """Filter by requester type."""
    title = _('نوع مقدم الطلب')
    parameter_name = 'requester_type'

    def lookups(self, request, model_admin):
        return (
            ('parent', _('👨‍👩‍👧 ولي أمر')),
            ('student', _('🧑‍🎓 طالب')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'parent':
            return queryset.filter(requested_by_parent__isnull=False)
        if self.value() == 'student':
            return queryset.filter(requested_by_student__isnull=False)
        return queryset


# =============================================================================
# Admin Actions for RefundRequest
# =============================================================================
@admin.action(description=_('✅ الموافقة ومعالجة طلبات الاسترداد'))
def approve_and_process_refunds(modeladmin, request, queryset):
    """Approve and process selected refund requests."""
    requested = queryset.filter(status=RefundRequest.RefundStatus.REQUESTED)
    count = 0
    errors = []
    
    for refund_request in requested:
        try:
            refund_request.approve_and_process(admin_user=request.user)
            count += 1
        except Exception as e:
            errors.append(f"{refund_request.enrollment}: {str(e)}")
    
    if count:
        modeladmin.message_user(
            request,
            _(f'تم معالجة {count} طلب استرداد بنجاح'),
            level=messages.SUCCESS
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل معالجة بعض الطلبات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('❌ رفض طلبات الاسترداد المحددة'))
def reject_refunds(modeladmin, request, queryset):
    """Reject selected refund requests."""
    requested = queryset.filter(status=RefundRequest.RefundStatus.REQUESTED)
    count = 0
    errors = []
    
    for refund_request in requested:
        try:
            refund_request.reject(admin_user=request.user, note="رفض جماعي من لوحة الإدارة")
            count += 1
        except Exception as e:
            errors.append(str(e))
    
    if count:
        modeladmin.message_user(
            request,
            _(f'تم رفض {count} طلب استرداد'),
            level=messages.WARNING
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل رفض بعض الطلبات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


# =============================================================================
# RefundRequest Admin Configuration
# =============================================================================
@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    """Enhanced admin configuration for RefundRequest model."""
    
    # List display
    list_display = (
        'get_enrollment_link', 'get_requester_display', 'get_refund_amount',
        'get_status_badge', 'get_reason_preview', 'get_created_date',
        'get_processed_info'
    )
    
    # Filters
    list_filter = (
        RefundStatusFilter, RequesterTypeFilter,
        'enrollment__course', 'created_at'
    )
    
    # Search
    search_fields = (
        'enrollment__course__name', 'reason', 'processed_note',
        'requested_by_parent__user__first_name', 'requested_by_parent__user__last_name',
        'requested_by_student__user__first_name', 'requested_by_student__user__last_name',
        'id'
    )
    
    # Date navigation
    date_hierarchy = 'created_at'
    
    # Autocomplete
    autocomplete_fields = ['enrollment', 'requested_by_parent', 'requested_by_student', 'processed_by']
    
    # Pagination
    list_per_page = 25
    
    # Ordering
    ordering = ('-created_at',)
    
    # Save on top
    save_on_top = True
    
    # Actions
    actions = [approve_and_process_refunds, reject_refunds]
    
    # =========================================================================
    # Dynamic Fieldsets
    # =========================================================================
    def get_fieldsets(self, request, obj=None):
        """Return different fieldsets for add vs edit."""
        if obj is None:
            return (
                (_('معلومات الإلتحاق'), {
                    'fields': ('enrollment',),
                }),
                (_('مقدم الطلب'), {
                    'fields': ('requested_by_parent', 'requested_by_student'),
                    'description': _('اختر إما ولي أمر أو طالب')
                }),
                (_('سبب الاسترداد'), {
                    'fields': ('reason',),
                }),
            )
        else:
            return (
                (_('معلومات الإلتحاق'), {
                    'fields': ('enrollment', 'get_enrollment_details'),
                }),
                (_('مقدم الطلب'), {
                    'fields': ('get_requester_info',),
                }),
                (_('سبب الاسترداد'), {
                    'fields': ('reason',),
                }),
                (_('حالة الطلب'), {
                    'fields': ('status', 'processed_note'),
                }),
                (_('معلومات المعالجة'), {
                    'fields': ('processed_by', 'processed_at'),
                    'classes': ('collapse',),
                }),
                (_('معلومات النظام'), {
                    'fields': ('id', 'created_at'),
                    'classes': ('collapse',),
                }),
            )
    
    def get_readonly_fields(self, request, obj=None):
        """Return readonly fields."""
        if obj is None:
            return ()
        else:
            readonly = [
                'id', 'created_at', 'processed_at',
                'get_enrollment_details', 'get_requester_info',
                'enrollment', 'requested_by_parent', 'requested_by_student'
            ]
            # Lock status if already processed
            if obj.status in [RefundRequest.RefundStatus.PROCESSED, RefundRequest.RefundStatus.REJECTED]:
                readonly.append('status')
            return readonly
    
    # =========================================================================
    # Query Optimization
    # =========================================================================
    def get_queryset(self, request):
        """Optimize queryset."""
        qs = super().get_queryset(request)
        return qs.select_related(
            'enrollment',
            'enrollment__course',
            'enrollment__student',
            'enrollment__student__user',
            'enrollment__child',
            'requested_by_parent',
            'requested_by_parent__user',
            'requested_by_student',
            'requested_by_student__user',
            'processed_by'
        ).prefetch_related('enrollment__payments')
    
    # =========================================================================
    # Display Methods
    # =========================================================================
    @admin.display(description=_('الإلتحاق'))
    def get_enrollment_link(self, obj):
        """Display enrollment as clickable link."""
        if obj.enrollment:
            url = reverse('admin:enrollments_payments_enrollment_change', args=[obj.enrollment.pk])
            participant = obj.enrollment.get_participant()
            course = obj.enrollment.course.name if obj.enrollment.course else '-'
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '📚 <strong>{}</strong><br>'
                '<small style="color: #7f8c8d;">{}</small></a>',
                url, course[:25], participant
            )
        return '-'
    
    @admin.display(description=_('مقدم الطلب'))
    def get_requester_display(self, obj):
        """Display requester with type indicator."""
        if obj.requested_by_parent and obj.requested_by_parent.user:
            name = obj.requested_by_parent.user.get_full_name()
            return format_html(
                '<span style="color: #9b59b6;">👨‍👩‍👧 {}</span>',
                name
            )
        elif obj.requested_by_student and obj.requested_by_student.user:
            name = obj.requested_by_student.user.get_full_name()
            return format_html(
                '<span style="color: #2980b9;">🧑‍🎓 {}</span>',
                name
            )
        return format_html('<span style="color: #95a5a6;">غير محدد</span>')
    
    @admin.display(description=_('المبلغ المسترد'))
    def get_refund_amount(self, obj):
        """Display total refundable amount."""
        if obj.enrollment:
            paid = obj.enrollment.amount_paid()
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">'
                '💸 {} ج.م</span>',
                paid
            )
        return '-'
    
    @admin.display(description=_('الحالة'), ordering='status')
    def get_status_badge(self, obj):
        """Display status as colored badge."""
        status_config = {
            'requested': ('📝', '#f39c12', 'مطلوب'),
            'approved': ('✅', '#3498db', 'موافق عليه'),
            'rejected': ('❌', '#e74c3c', 'مرفوض'),
            'processed': ('💸', '#27ae60', 'تم المعالجة'),
        }
        
        icon, color, label = status_config.get(
            obj.status, ('❓', '#95a5a6', obj.get_status_display())
        )
        
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 0.85em; white-space: nowrap;">'
            '{} {}</span>',
            color, icon, label
        )
    
    @admin.display(description=_('السبب'))
    def get_reason_preview(self, obj):
        """Display reason preview."""
        if obj.reason:
            preview = obj.reason[:50] + '...' if len(obj.reason) > 50 else obj.reason
            return format_html(
                '<span title="{}" style="color: #7f8c8d;">{}</span>',
                obj.reason, preview
            )
        return format_html('<small style="color: #bdc3c7;">-</small>')
    
    @admin.display(description=_('تاريخ الطلب'), ordering='created_at')
    def get_created_date(self, obj):
        """Display created date with relative time."""
        if obj.created_at:
            now = timezone.now()
            diff = now - obj.created_at
            
            if diff.days == 0:
                hours = diff.seconds // 3600
                if hours == 0:
                    minutes = diff.seconds // 60
                    relative = f'منذ {minutes} دقيقة'
                else:
                    relative = f'منذ {hours} ساعة'
            elif diff.days == 1:
                relative = 'أمس'
            elif diff.days < 7:
                relative = f'منذ {diff.days} أيام'
            else:
                relative = obj.created_at.strftime('%Y/%m/%d')
            
            return format_html(
                '<span title="{}">{}</span>',
                obj.created_at.strftime('%Y/%m/%d %H:%M'),
                relative
            )
        return '-'
    
    @admin.display(description=_('المعالجة'))
    def get_processed_info(self, obj):
        """Display processing info."""
        if obj.processed_by:
            name = obj.processed_by.get_full_name() or obj.processed_by.username
            date = obj.processed_at.strftime('%m/%d %H:%M') if obj.processed_at else ''
            return format_html(
                '<small style="color: #7f8c8d;">👤 {}<br>{}</small>',
                name, date
            )
        return format_html('<small style="color: #f39c12;">⏳ في الانتظار</small>')
    
    # =========================================================================
    # Readonly Display Fields
    # =========================================================================
    @admin.display(description=_('تفاصيل الإلتحاق'))
    def get_enrollment_details(self, obj):
        """Display detailed enrollment info."""
        if obj.enrollment:
            participant = obj.enrollment.get_participant()
            course = obj.enrollment.course
            paid = obj.enrollment.amount_paid()
            
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👤 المشترك:</strong> {}<br>'
                '<strong>📚 الدورة:</strong> {}<br>'
                '<strong>💰 المدفوع:</strong> <span style="color: #e74c3c;">{} ج.م</span><br>'
                '<strong>📊 الحالة:</strong> {}'
                '</div>',
                participant,
                course.name if course else '-',
                paid,
                obj.enrollment.get_status_display()
            )
        return '-'
    
    @admin.display(description=_('معلومات مقدم الطلب'))
    def get_requester_info(self, obj):
        """Display detailed requester info."""
        if obj.requested_by_parent and obj.requested_by_parent.user:
            user = obj.requested_by_parent.user
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👨‍👩‍👧 ولي الأمر:</strong> {}<br>'
                '<strong>📧 البريد:</strong> {}<br>'
                '<strong>📱 الهاتف:</strong> {}'
                '</div>',
                user.get_full_name(),
                user.email or '-',
                getattr(user, 'phone_number1', '-')
            )
        elif obj.requested_by_student and obj.requested_by_student.user:
            user = obj.requested_by_student.user
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>🧑‍🎓 الطالب:</strong> {}<br>'
                '<strong>📧 البريد:</strong> {}<br>'
                '<strong>📱 الهاتف:</strong> {}'
                '</div>',
                user.get_full_name(),
                user.email or '-',
                getattr(user, 'phone_number1', '-')
            )
        return '-'
    
    # =========================================================================
    # Form Customization
    # =========================================================================
    def get_form(self, request, obj=None, **kwargs):
        """Apply Arabic labels."""
        form = super().get_form(request, obj, **kwargs)
        
        labels = {
            'enrollment': 'الإلتحاق',
            'requested_by_parent': 'ولي الأمر مقدم الطلب',
            'requested_by_student': 'الطالب مقدم الطلب',
            'reason': 'السبب',
            'status': 'الحالة',
            'processed_note': 'ملاحظة المعالجة',
            'processed_by': 'تمت المعالجة بواسطة',
            'processed_at': 'تاريخ المعالجة',
            'created_at': 'تاريخ الإنشاء',
        }
        
        for field_name, label in labels.items():
            if field_name in form.base_fields:
                form.base_fields[field_name].label = label
        
        return form
    
    def add_view(self, request, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = _('إضافة طلب استرداد جديد')
        return super().add_view(request, form_url, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = _('تفاصيل طلب الاسترداد')
        return super().change_view(request, object_id, form_url, extra_context)
    
    # =========================================================================
    # Permissions
    # =========================================================================
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of processed refunds."""
        if obj and obj.status == RefundRequest.RefundStatus.PROCESSED:
            return False
        return super().has_delete_permission(request, obj)
