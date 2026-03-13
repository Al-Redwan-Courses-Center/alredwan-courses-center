from django.contrib import admin
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse
from django.db.models import Count
from django import forms

from core.utils import ExcelExportMixin
from enrollments_payments.models.enrollment_request import (
    EnrollmentRequest, 
    EnrollmentRequestStatus,
    PaymentMethod
)


# =============================================================================
# Custom Filters
# =============================================================================
class StatusFilter(admin.SimpleListFilter):
    """Filter enrollment requests by status with visual indicators."""
    title = _('حالة الطلب')
    parameter_name = 'request_status'

    def lookups(self, request, model_admin):
        return (
            ('pending', _('⏳ معلق')),
            ('processing', _('🔄 قيد المعالجة')),
            ('accepted', _('✅ مقبول')),
            ('rejected', _('❌ مرفوض')),
            ('expired', _('⌛ منتهي الصلاحية')),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset


class PaymentMethodFilter(admin.SimpleListFilter):
    """Filter by payment method."""
    title = _('طريقة الدفع')
    parameter_name = 'payment'

    def lookups(self, request, model_admin):
        return (
            ('cash', _('💵 نقدًا')),
            ('card', _('💳 بطاقة')),
            ('bank_transfer', _('🏦 تحويل بنكي')),
            ('instapay', _('📱 إنستاباي')),
            ('vodafone_cash', _('📲 فودافون كاش')),
            ('other', _('📋 طريقة أخرى')),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(payment_method=self.value())
        return queryset


class ExpiryFilter(admin.SimpleListFilter):
    """Filter by expiry status."""
    title = _('حالة الانتهاء')
    parameter_name = 'expiry'

    def lookups(self, request, model_admin):
        return (
            ('expired', _('🔴 منتهي الصلاحية')),
            ('expiring_soon', _('🟡 ينتهي قريباً (خلال 24 ساعة)')),
            ('valid', _('🟢 صالح')),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'expired':
            return queryset.filter(expires_at__lt=now, status=EnrollmentRequestStatus.PENDING)
        if self.value() == 'expiring_soon':
            return queryset.filter(
                expires_at__gte=now,
                expires_at__lt=now + timezone.timedelta(hours=24),
                status=EnrollmentRequestStatus.PENDING
            )
        if self.value() == 'valid':
            return queryset.filter(expires_at__gte=now)
        return queryset


class ParticipantTypeFilter(admin.SimpleListFilter):
    """Filter by participant type (student or child)."""
    title = _('نوع المشترك')
    parameter_name = 'participant_type'

    def lookups(self, request, model_admin):
        return (
            ('student', _('🧑‍🎓 طالب')),
            ('child', _('👦 طفل')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'student':
            return queryset.filter(student__isnull=False)
        if self.value() == 'child':
            return queryset.filter(child__isnull=False)
        return queryset


# =============================================================================
# Admin Actions
# =============================================================================
@admin.action(description=_('✅ قبول الطلبات المحددة'))
def approve_selected(modeladmin, request, queryset):
    """Approve selected pending or processing enrollment requests.
    
    Handles partial payments: if enrollment_request.price < course.price,
    the payment will be recorded as partial with remaining amount tracked.
    """
    approvable = queryset.filter(status__in=[
        EnrollmentRequestStatus.PENDING,
        EnrollmentRequestStatus.PROCESSING
    ])
    approved_count = 0
    partial_count = 0
    errors = []
    
    for enrollment_request in approvable:
        try:
            enrollment_request.approve(processed_by_user=request.user)
            approved_count += 1
            
            # Track if this was a partial payment
            if (enrollment_request.price is not None and 
                enrollment_request.course.price and 
                enrollment_request.price < enrollment_request.course.price):
                partial_count += 1
                
        except Exception as e:
            errors.append(f"{enrollment_request.get_participant()}: {str(e)}")
    
    if approved_count:
        msg = _(f'تم قبول {approved_count} طلب بنجاح')
        if partial_count:
            msg += _(f' ({partial_count} منها دفعات جزئية)')
        modeladmin.message_user(request, msg, level=messages.SUCCESS)
    
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل قبول بعض الطلبات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('❌ رفض الطلبات المحددة'))
def reject_selected(modeladmin, request, queryset):
    """Reject selected pending or processing enrollment requests."""
    rejectable = queryset.filter(status__in=[
        EnrollmentRequestStatus.PENDING,
        EnrollmentRequestStatus.PROCESSING
    ])
    rejected_count = 0
    errors = []
    
    for enrollment_request in rejectable:
        try:
            enrollment_request.reject(processed_by_user=request.user, reason="رفض جماعي من لوحة الإدارة")
            rejected_count += 1
        except Exception as e:
            errors.append(f"{enrollment_request.get_participant()}: {str(e)}")
    
    if rejected_count:
        modeladmin.message_user(
            request,
            _(f'تم رفض {rejected_count} طلب'),
            level=messages.WARNING
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل رفض بعض الطلبات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('🔄 تحديد كقيد المعالجة'))
def mark_processing(modeladmin, request, queryset):
    """Mark selected requests as processing."""
    updated = queryset.filter(status=EnrollmentRequestStatus.PENDING).update(
        status=EnrollmentRequestStatus.PROCESSING
    )
    modeladmin.message_user(
        request,
        _(f'تم تحديد {updated} طلب كقيد المعالجة'),
        level=messages.INFO
    )


@admin.action(description=_('⏳ تمديد صلاحية الطلبات (7 أيام)'))
def extend_expiry(modeladmin, request, queryset):
    """Extend expiry date by 7 days for selected requests."""
    pending = queryset.filter(status__in=[
        EnrollmentRequestStatus.PENDING,
        EnrollmentRequestStatus.PROCESSING
    ])
    count = 0
    for req in pending:
        req.expires_at = timezone.now() + timezone.timedelta(days=7)
        req.save(update_fields=['expires_at'])
        count += 1
    
    modeladmin.message_user(
        request,
        _(f'تم تمديد صلاحية {count} طلب لمدة 7 أيام'),
        level=messages.SUCCESS
    )


# =============================================================================
# Admin Configuration
# =============================================================================
@admin.register(EnrollmentRequest)
class EnrollmentRequestAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Enhanced admin configuration for EnrollmentRequest model."""
    
    # List display configuration
    list_display = (
        'action_checkbox', 'get_participant_display', 'get_course_link', 'get_price_display',
        'get_status_badge', 'get_payment_method_badge', 'get_expiry_status',
        'get_created_at', 'get_processed_info'
    )
    
    # Filters
    list_filter = (
        StatusFilter, PaymentMethodFilter, ParticipantTypeFilter,
        ExpiryFilter, 'course__season', 'course', 'created_at'
    )
    
    # Search
    search_fields = (
        'student__user__first_name', 'student__user__last_name',
        'child__first_name', 'child__last_name',
        'parent__user__first_name', 'parent__user__last_name',
        'course__name', 'notes', 'id'
    )
    
    # Date navigation
    date_hierarchy = 'created_at'
    
    # Autocomplete for faster selection
    autocomplete_fields = ['course', 'student', 'child']
    
    # Pagination
    list_per_page = 25
    
    # Ordering
    ordering = ('-created_at',)
    
    # Save button on top
    save_on_top = True
    
    # Actions
    actions = [approve_selected, reject_selected, mark_processing, extend_expiry]
    
    # Excel export configuration
    excel_filename = 'enrollment_requests'
    
    # =========================================================================
    # Dynamic Fieldsets - Different for Add vs Edit
    # =========================================================================
    def get_fieldsets(self, request, obj=None):
        """Return different fieldsets for add vs edit."""
        if obj is None:
            # ADD PAGE - Simplified
            return (
                (_('معلومات الدورة'), {
                    'fields': ('course',),
                    'description': _('اختر الدورة المراد التسجيل فيها')
                }),
                (_('معلومات المشترك'), {
                    'fields': ('student', 'child'),
                    'description': _('اختر إما طالب أو طفل. عند اختيار طفل سيتم تعيين ولي الأمر تلقائياً.')
                }),
                (_('الدفع (اختياري)'), {
                    'fields': ('price', 'payment_method'),
                    'classes': ('collapse',),
                    'description': _('المبلغ يتم تعيينه تلقائياً من سعر الدورة إذا لم يُحدد')
                }),
                (_('ملاحظات (اختياري)'), {
                    'fields': ('notes',),
                    'classes': ('collapse',),
                }),
            )
        else:
            # EDIT PAGE - Full details
            return (
                (_('معلومات المشترك'), {
                    'fields': ('get_participant_info',),
                }),
                (_('معلومات الدورة'), {
                    'fields': ('course', 'get_course_info'),
                }),
                (_('الدفع'), {
                    'fields': ('price', 'payment_method'),
                }),
                (_('حالة الطلب'), {
                    'fields': ('status', 'notes'),
                    'classes': ('wide',),
                }),
                (_('معلومات المعالجة'), {
                    'fields': ('processed_by', 'processed_at'),
                    'classes': ('collapse',),
                }),
                (_('معلومات النظام'), {
                    'fields': ('id', 'created_at', 'expires_at'),
                    'classes': ('collapse',),
                }),
            )
    
    def get_readonly_fields(self, request, obj=None):
        """Return different readonly fields for add vs edit."""
        if obj is None:
            # ADD PAGE - minimal readonly
            return ()
        else:
            # EDIT PAGE - more readonly fields
            return (
                'id', 'created_at', 'processed_at', 'expires_at',
                'get_participant_info', 'get_course_info',
                'course', 'student', 'child', 'parent'  # Lock participant info after creation
            )
    
    def get_autocomplete_fields(self, request):
        """Return autocomplete fields based on add/edit mode."""
        # Note: We check the URL to determine if we're adding
        if '/add/' in request.path:
            return ['course', 'student', 'child']
        return ['course', 'processed_by']
    
    # =========================================================================
    # Query Optimization - Avoid N+1 queries
    # =========================================================================
    def get_queryset(self, request):
        """Optimize queryset with select_related to avoid N+1 queries."""
        qs = super().get_queryset(request)
        return qs.select_related(
            'course',
            'course__season',
            'course__instructor',
            'parent',
            'parent__user',
            'student',
            'student__user',
            'child',
            'processed_by'
        )
    
    # =========================================================================
    # Display Methods with Visual Enhancements
    # =========================================================================
    @admin.display(description=_('المشترك'))
    def get_participant_display(self, obj):
        """Display participant with type indicator."""
        if obj.student:
            name = obj.student.user.get_full_name() if obj.student.user else str(obj.student)
            return format_html(
                '<span style="color: #2980b9;" title="طالب">'
                '🧑‍🎓 <strong>{}</strong></span>',
                name
            )
        elif obj.child:
            parent_name = obj.parent.user.get_full_name() if obj.parent and obj.parent.user else ''
            return format_html(
                '<span style="color: #9b59b6;" title="طفل - ولي الأمر: {}">'
                '👦 <strong>{}</strong></span>',
                parent_name, obj.child
            )
        return '-'
    
    @admin.display(description=_('الدورة'), ordering='course__name')
    def get_course_link(self, obj):
        """Display course as clickable link."""
        if obj.course:
            url = reverse('admin:courses_course_change', args=[obj.course.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '📚 {}</a>',
                url, obj.course.name
            )
        return '-'
    
    @admin.display(description=_('المبلغ'), ordering='price')
    def get_price_display(self, obj):
        """Display price with currency and comparison to course price."""
        if obj.price is not None:
            course_price = obj.course.price if obj.course else None
            
            if course_price and obj.price < course_price:
                # Discounted price
                return format_html(
                    '<span style="color: #e67e22;" title="سعر مخفض من {}">'
                    '<s style="color: #95a5a6; font-size: 0.8em;">{}</s> '
                    '<strong>{}</strong> ج.م</span>',
                    course_price, course_price, obj.price
                )
            elif obj.price == 0:
                return format_html(
                    '<span style="color: #27ae60; font-weight: bold;">مجاني</span>'
                )
            else:
                return format_html(
                    '<span style="color: #27ae60; font-weight: bold;">{} ج.م</span>',
                    obj.price
                )
        return '-'
    
    @admin.display(description=_('الحالة'), ordering='status')
    def get_status_badge(self, obj):
        """Display status as colored badge."""
        status_config = {
            'pending': ('⏳', '#f39c12', 'معلق'),
            'processing': ('🔄', '#3498db', 'قيد المعالجة'),
            'accepted': ('✅', '#27ae60', 'مقبول'),
            'rejected': ('❌', '#e74c3c', 'مرفوض'),
            'expired': ('⌛', '#95a5a6', 'منتهي الصلاحية'),
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
    
    @admin.display(description=_('طريقة الدفع'), ordering='payment_method')
    def get_payment_method_badge(self, obj):
        """Display payment method with icon."""
        method_config = {
            'cash': ('💵', '#27ae60'),
            'card': ('💳', '#3498db'),
            'bank_transfer': ('🏦', '#9b59b6'),
            'instapay': ('📱', '#e74c3c'),
            'vodafone_cash': ('📲', '#e74c3c'),
            'other': ('📋', '#95a5a6'),
        }
        
        icon, color = method_config.get(obj.payment_method, ('💰', '#95a5a6'))
        
        return format_html(
            '<span style="color: {};">{} {}</span>',
            color, icon, obj.get_payment_method_display()
        )
    
    @admin.display(description=_('الصلاحية'))
    def get_expiry_status(self, obj):
        """Display expiry status with visual indicator."""
        if not obj.expires_at:
            return '-'
        
        now = timezone.now()
        
        if obj.status not in [EnrollmentRequestStatus.PENDING, EnrollmentRequestStatus.PROCESSING]:
            # Already processed, show date only
            return format_html(
                '<small style="color: #95a5a6;">{}</small>',
                obj.expires_at.strftime('%Y/%m/%d')
            )
        
        if obj.expires_at < now:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;" '
                'title="{}">🔴 منتهي</span>',
                obj.expires_at.strftime('%Y/%m/%d %H:%M')
            )
        
        time_left = obj.expires_at - now
        hours_left = time_left.total_seconds() / 3600
        
        if hours_left <= 24:
            return format_html(
                '<span style="color: #e67e22;" title="{}">'
                '🟡 {}س متبقية</span>',
                obj.expires_at.strftime('%Y/%m/%d %H:%M'),
                int(hours_left)
            )
        elif hours_left <= 72:
            days_left = int(hours_left / 24)
            return format_html(
                '<span style="color: #f39c12;" title="{}">'
                '🟡 {}ي متبقية</span>',
                obj.expires_at.strftime('%Y/%m/%d %H:%M'),
                days_left
            )
        else:
            return format_html(
                '<span style="color: #27ae60;" title="{}">'
                '🟢 صالح</span>',
                obj.expires_at.strftime('%Y/%m/%d %H:%M')
            )
    
    @admin.display(description=_('تاريخ الإنشاء'), ordering='created_at')
    def get_created_at(self, obj):
        """Display creation date with relative time."""
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
        return format_html('<small style="color: #bdc3c7;">لم يُعالج بعد</small>')
    
    # =========================================================================
    # Readonly Display Fields for Detail View
    # =========================================================================
    @admin.display(description=_('معلومات المشترك'))
    def get_participant_info(self, obj):
        """Display detailed participant info in edit form."""
        if obj.student:
            user = obj.student.user
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👤 طالب:</strong> {}<br>'
                '<strong>📧 البريد:</strong> {}<br>'
                '<strong>📱 الهاتف:</strong> {}'
                '</div>',
                user.get_full_name() if user else '-',
                user.email if user else '-',
                getattr(user, 'phone_number1', '-') if user else '-'
            )
        elif obj.child and obj.parent:
            parent_user = obj.parent.user
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👦 الطفل:</strong> {}<br>'
                '<strong>👨‍👩‍👧 ولي الأمر:</strong> {}<br>'
                '<strong>📱 هاتف ولي الأمر:</strong> {}'
                '</div>',
                obj.child,
                parent_user.get_full_name() if parent_user else '-',
                getattr(parent_user, 'phone_number1', '-') if parent_user else '-'
            )
        return '-'
    
    @admin.display(description=_('معلومات الدورة'))
    def get_course_info(self, obj):
        """Display detailed course info in edit form."""
        if obj.course:
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>📚 الدورة:</strong> {}<br>'
                '<strong>👨‍🏫 المدرس:</strong> {}<br>'
                '<strong>💰 السعر الأصلي:</strong> {} ج.م<br>'
                '<strong>👥 المسجلين:</strong> {} / {}'
                '</div>',
                obj.course.name,
                obj.course.instructor or '-',
                obj.course.price or 'مجاني',
                obj.course.enrolled_count,
                obj.course.capacity
            )
        return '-'
    
    # =========================================================================
    # Form Customization
    # =========================================================================
    def get_form(self, request, obj=None, **kwargs):
        """Apply Arabic labels and customize form for add vs edit."""
        form = super().get_form(request, obj, **kwargs)
        
        labels = {
            'course': 'الدورة',
            'parent': 'ولي الأمر',
            'student': 'الطالب',
            'child': 'الطفل',
            'price': 'المبلغ',
            'payment_method': 'طريقة الدفع',
            'status': 'الحالة',
            'notes': 'ملاحظات',
            'processed_by': 'تمت المعالجة بواسطة',
            'processed_at': 'تاريخ المعالجة',
            'created_at': 'تاريخ الإنشاء',
            'expires_at': 'تاريخ الانتهاء',
        }
        
        help_texts = {
            'student': 'اختر الطالب إذا كان بالغاً (لا تختر طفل)',
            'child': 'اختر الطفل وسيتم تعيين ولي الأمر تلقائياً',
            'price': 'اتركه فارغاً لاستخدام سعر الدورة الأصلي',
        }
        
        for field_name, label in labels.items():
            if field_name in form.base_fields:
                form.base_fields[field_name].label = label
        
        # Add help texts for add page
        if obj is None:
            for field_name, help_text in help_texts.items():
                if field_name in form.base_fields:
                    form.base_fields[field_name].help_text = help_text
            
            # Make student and child not required (one or the other)
            if 'student' in form.base_fields:
                form.base_fields['student'].required = False
            if 'child' in form.base_fields:
                form.base_fields['child'].required = False
        
        return form
    
    def add_view(self, request, form_url='', extra_context=None):
        """Add extra context for add view."""
        extra_context = extra_context or {}
        extra_context['title'] = _('إضافة طلب التحاق جديد')
        return super().add_view(request, form_url, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add extra context for change view."""
        extra_context = extra_context or {}
        extra_context['title'] = _('تعديل طلب الالتحاق')
        return super().change_view(request, object_id, form_url, extra_context)
    
    def save_model(self, request, obj, form, change):
        """
        Auto-set parent from child's primary_parent when child is selected.
        Auto-set processed_by when status changes to non-pending.
        """
        # Auto-set parent from child's primary_parent
        if obj.child and not obj.parent:
            obj.parent = obj.child.primary_parent
        
        # Clear parent and child if student is set (mutual exclusivity)
        if obj.student:
            obj.parent = None
            obj.child = None
        
        # Auto-set processed_by when status changes
        if change and obj.status != EnrollmentRequestStatus.PENDING:
            if not obj.processed_by:
                obj.processed_by = request.user
            if not obj.processed_at:
                obj.processed_at = timezone.now()
        
        super().save_model(request, obj, form, change)
    
    # =========================================================================
    # Permission Helpers
    # =========================================================================
    def has_delete_permission(self, request, obj=None):
        """Only allow deletion of pending/expired requests."""
        if obj and obj.status == EnrollmentRequestStatus.ACCEPTED:
            return False
        return super().has_delete_permission(request, obj)
