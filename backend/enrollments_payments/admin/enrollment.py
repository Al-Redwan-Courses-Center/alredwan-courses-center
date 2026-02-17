from django.contrib import admin
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse
from django.db.models import Sum, Count

from core.utils import ExcelExportMixin
from enrollments_payments.models.enrollment import Enrollment, EnrollmentStatus
from enrollments_payments.models.payment import Payment


# =============================================================================
# Custom Filters
# =============================================================================
class StatusFilter(admin.SimpleListFilter):
    """Filter enrollments by status with visual indicators."""
    title = _('حالة الإلتحاق')
    parameter_name = 'enrollment_status'

    def lookups(self, request, model_admin):
        return (
            ('active', _('✅ نشط')),
            ('suspended', _('⏸️ معلق')),
            ('completed', _('🎓 مكتمل')),
            ('dropped', _('❌ ملغى')),
            ('refunded', _('💸 مسترد')),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset


class PaymentStatusFilter(admin.SimpleListFilter):
    """Filter by payment completion status."""
    title = _('حالة الدفع')
    parameter_name = 'payment_status'

    def lookups(self, request, model_admin):
        return (
            ('fully_paid', _('💚 مدفوع بالكامل')),
            ('partial', _('🟡 دفعة جزئية')),
            ('unpaid', _('🔴 غير مدفوع')),
            ('overpaid', _('🔵 دفع زائد')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'fully_paid':
            # Get enrollments where paid >= course price
            result_ids = []
            for enrollment in queryset.select_related('course'):
                if enrollment.remaining_amount() == 0:
                    result_ids.append(enrollment.pk)
            return queryset.filter(pk__in=result_ids)

        elif self.value() == 'partial':
            result_ids = []
            for enrollment in queryset.select_related('course'):
                remaining = enrollment.remaining_amount()
                paid = enrollment.amount_paid()
                if paid > 0 and remaining > 0:
                    result_ids.append(enrollment.pk)
            return queryset.filter(pk__in=result_ids)

        elif self.value() == 'unpaid':
            result_ids = []
            for enrollment in queryset.select_related('course'):
                if enrollment.amount_paid() == 0:
                    result_ids.append(enrollment.pk)
            return queryset.filter(pk__in=result_ids)

        elif self.value() == 'overpaid':
            result_ids = []
            for enrollment in queryset.select_related('course'):
                if enrollment.remaining_amount() < 0:
                    result_ids.append(enrollment.pk)
            return queryset.filter(pk__in=result_ids)

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


class EnrolledPeriodFilter(admin.SimpleListFilter):
    """Filter by enrollment date period."""
    title = _('فترة التسجيل')
    parameter_name = 'enrolled_period'

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
            return queryset.filter(enrolled_at__date=now.date())
        elif self.value() == 'week':
            week_ago = now - timezone.timedelta(days=7)
            return queryset.filter(enrolled_at__gte=week_ago)
        elif self.value() == 'month':
            month_ago = now - timezone.timedelta(days=30)
            return queryset.filter(enrolled_at__gte=month_ago)
        elif self.value() == 'older':
            month_ago = now - timezone.timedelta(days=30)
            return queryset.filter(enrolled_at__lt=month_ago)
        return queryset


# =============================================================================
# Admin Actions
# =============================================================================
@admin.action(description=_('⏸️ تعليق الإلتحاقات المحددة'))
def suspend_enrollments(modeladmin, request, queryset):
    """Suspend selected active enrollments."""
    active = queryset.filter(status=EnrollmentStatus.ACTIVE)
    count = 0
    errors = []

    for enrollment in active:
        try:
            enrollment.update_status(EnrollmentStatus.SUSPENDED)
            count += 1
        except Exception as e:
            errors.append(f"{enrollment.get_participant()}: {str(e)}")

    if count:
        modeladmin.message_user(
            request,
            _(f'تم تعليق {count} إلتحاق بنجاح'),
            level=messages.WARNING
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل تعليق بعض الإلتحاقات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('✅ إعادة تنشيط الإلتحاقات المحددة'))
def reactivate_enrollments(modeladmin, request, queryset):
    """Reactivate selected suspended enrollments."""
    suspended = queryset.filter(status=EnrollmentStatus.SUSPENDED)
    count = 0
    errors = []

    for enrollment in suspended:
        try:
            enrollment.update_status(EnrollmentStatus.ACTIVE)
            count += 1
        except Exception as e:
            errors.append(f"{enrollment.get_participant()}: {str(e)}")

    if count:
        modeladmin.message_user(
            request,
            _(f'تم إعادة تنشيط {count} إلتحاق بنجاح'),
            level=messages.SUCCESS
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل إعادة تنشيط بعض الإلتحاقات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('🎓 تحديد كمكتمل'))
def mark_completed(modeladmin, request, queryset):
    """Mark selected active enrollments as completed."""
    active = queryset.filter(status=EnrollmentStatus.ACTIVE)
    count = 0
    errors = []

    for enrollment in active:
        try:
            enrollment.update_status(EnrollmentStatus.COMPLETED)
            count += 1
        except Exception as e:
            errors.append(f"{enrollment.get_participant()}: {str(e)}")

    if count:
        modeladmin.message_user(
            request,
            _(f'تم تحديد {count} إلتحاق كمكتمل'),
            level=messages.SUCCESS
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل في بعض الإلتحاقات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('❌ إلغاء الإلتحاقات المحددة'))
def drop_enrollments(modeladmin, request, queryset):
    """Drop selected enrollments."""
    droppable = queryset.filter(
        status__in=[EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED])
    count = 0
    errors = []

    for enrollment in droppable:
        try:
            enrollment.update_status(EnrollmentStatus.DROPPED)
            count += 1
        except Exception as e:
            errors.append(f"{enrollment.get_participant()}: {str(e)}")

    if count:
        modeladmin.message_user(
            request,
            _(f'تم إلغاء {count} إلتحاق'),
            level=messages.WARNING
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'فشل إلغاء بعض الإلتحاقات: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


@admin.action(description=_('🔄 فحص وإكمال الإلتحاقات تلقائياً'))
def auto_complete_enrollments(modeladmin, request, queryset):
    """
    Check selected enrollments and mark as completed if criteria are met.

    Criteria:
    - Course end_date has passed, OR
    - All lectures in the course are completed
    """
    active = queryset.filter(status=EnrollmentStatus.ACTIVE)
    completed_count = 0
    checked_count = 0
    errors = []

    for enrollment in active:
        checked_count += 1
        try:
            if enrollment.should_be_completed():
                enrollment.update_status(EnrollmentStatus.COMPLETED)
                completed_count += 1
        except Exception as e:
            errors.append(f"{enrollment.get_participant()}: {str(e)}")

    if completed_count:
        modeladmin.message_user(
            request,
            _(f'تم فحص {checked_count} إلتحاق وإكمال {completed_count} منها تلقائياً'),
            level=messages.SUCCESS
        )
    else:
        modeladmin.message_user(
            request,
            _(f'تم فحص {checked_count} إلتحاق - لا يوجد إلتحاقات جاهزة للإكمال'),
            level=messages.INFO
        )
    if errors:
        modeladmin.message_user(
            request,
            _(f'حدثت أخطاء: {"; ".join(errors[:3])}'),
            level=messages.ERROR
        )


# =============================================================================
# Inline Admin for Payments
# =============================================================================
class PaymentInline(admin.TabularInline):
    """Inline admin for viewing/adding payments to an enrollment."""
    model = Payment
    extra = 0
    max_num = 10
    fields = ('amount', 'method', 'status',
              'processed_at', 'processed_by', 'notes')
    readonly_fields = ('processed_at',)
    autocomplete_fields = ['processed_by']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('processed_by')

    verbose_name = _('دفعة')
    verbose_name_plural = _('سجل المدفوعات')


# =============================================================================
# Admin Configuration
# =============================================================================
@admin.register(Enrollment)
class EnrollmentAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Enhanced admin configuration for Enrollment model."""

    # List display configuration
    list_display = (
        'get_participant_display', 'get_course_link', 'get_status_badge',
        'get_course_progress', 'get_payment_status', 'get_payment_progress',
        'get_enrolled_date', 'get_created_by_display'
    )

    # Filters
    list_filter = (
        StatusFilter, PaymentStatusFilter, ParticipantTypeFilter,
        EnrolledPeriodFilter, 'course__season', 'course'
    )

    # Search
    search_fields = (
        'student__user__first_name', 'student__user__last_name',
        'child__first_name', 'child__last_name',
        'course__name', 'id'
    )

    # Date navigation
    date_hierarchy = 'enrolled_at'

    # Autocomplete for faster selection
    autocomplete_fields = ['course', 'student', 'child', 'created_by']

    # Pagination
    list_per_page = 25

    # Ordering
    ordering = ('-enrolled_at',)

    # Save button on top
    save_on_top = True

    # Actions
    actions = [suspend_enrollments, reactivate_enrollments,
               mark_completed, drop_enrollments, auto_complete_enrollments]
    
    # Excel export configuration
    excel_filename = 'enrollments'

    # Inlines
    inlines = [PaymentInline]

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
                    'description': _('اختر إما طالب أو طفل (ليس كلاهما)')
                }),
                (_('معلومات إضافية'), {
                    'fields': ('created_by',),
                    'classes': ('collapse',),
                }),
            )
        else:
            # EDIT PAGE - Full details with payment info
            return (
                (_('معلومات المشترك'), {
                    'fields': ('get_participant_info',),
                }),
                (_('معلومات الدورة'), {
                    'fields': ('course', 'get_course_info'),
                }),
                (_('حالة الإلتحاق'), {
                    'fields': ('status', 'enrolled_at'),
                }),
                (_('ملخص المدفوعات'), {
                    'fields': ('get_payment_summary',),
                    'description': _('لإضافة دفعة جديدة، استخدم قسم "سجل المدفوعات" أدناه')
                }),
                (_('معلومات النظام'), {
                    'fields': ('id', 'created_by', 'updated_at', 'completed_at', 'dropped_at'),
                    'classes': ('collapse',),
                }),
            )

    def get_readonly_fields(self, request, obj=None):
        """Return different readonly fields for add vs edit."""
        if obj is None:
            return ()
        else:
            return (
                'id', 'enrolled_at', 'updated_at', 'completed_at', 'dropped_at',
                'get_participant_info', 'get_course_info', 'get_payment_summary',
                'course', 'student', 'child'  # Lock after creation
            )

    # =========================================================================
    # Query Optimization - Avoid N+1 queries
    # =========================================================================
    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related."""
        qs = super().get_queryset(request)
        return qs.select_related(
            'course',
            'course__season',
            'course__instructor',
            'student',
            'student__user',
            'child',
            'child__primary_parent',
            'child__primary_parent__user',
            'created_by'
        ).prefetch_related('payments')

    # =========================================================================
    # Display Methods with Visual Enhancements
    # =========================================================================
    @admin.display(description=_('المشترك'))
    def get_participant_display(self, obj):
        """Display participant with type indicator and link."""
        if obj.student:
            name = obj.student.user.get_full_name() if obj.student.user else str(obj.student)
            return format_html(
                '<span style="color: #2980b9;" title="طالب">'
                '🧑‍🎓 <strong>{}</strong></span>',
                name
            )
        elif obj.child:
            parent_info = ""
            if obj.child.primary_parent and obj.child.primary_parent.user:
                parent_info = obj.child.primary_parent.user.get_full_name()
            return format_html(
                '<span style="color: #9b59b6;" title="طفل - ولي الأمر: {}">'
                '👦 <strong>{}</strong></span>',
                parent_info, obj.child
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

    @admin.display(description=_('الحالة'), ordering='status')
    def get_status_badge(self, obj):
        """Display status as colored badge."""
        status_config = {
            'active': ('✅', '#27ae60', 'نشط'),
            'suspended': ('⏸️', '#f39c12', 'معلق'),
            'completed': ('🎓', '#3498db', 'مكتمل'),
            'dropped': ('❌', '#e74c3c', 'ملغى'),
            'refunded': ('💸', '#9b59b6', 'مسترد'),
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

    @admin.display(description=_('تقدم الدورة'))
    def get_course_progress(self, obj):
        """Display course completion progress (lectures completed)."""
        progress = obj.get_completion_progress()

        completed = progress['completed_lectures']
        expected = progress['expected_lectures']
        percentage = progress['percentage']

        # Choose color based on progress
        if percentage >= 100:
            bar_color = '#27ae60'  # Green - complete
            status_icon = '🎓'
        elif percentage >= 50:
            bar_color = '#3498db'  # Blue - good progress
            status_icon = '📈'
        elif percentage > 0:
            bar_color = '#f39c12'  # Orange - in progress
            status_icon = '📊'
        else:
            bar_color = '#95a5a6'  # Gray - not started
            status_icon = '📋'

        # Add indicator if course can be auto-completed
        completable_hint = ''
        if progress['is_completable'] and obj.status == EnrollmentStatus.ACTIVE:
            completable_hint = '<div style="font-size: 0.75em; color: #27ae60; margin-top: 2px;">✅ جاهز للإكمال</div>'
        elif progress['end_date_passed'] and obj.status == EnrollmentStatus.ACTIVE:
            completable_hint = '<div style="font-size: 0.75em; color: #e74c3c; margin-top: 2px;">⏰ انتهت الدورة</div>'

        return format_html(
            '<div style="min-width: 100px;">'
            '<div style="display: flex; justify-content: space-between; font-size: 0.85em; margin-bottom: 2px;">'
            '<span>{} {}/{}</span>'
            '<span style="color: #7f8c8d;">{}%</span>'
            '</div>'
            '<div style="background: #ecf0f1; border-radius: 4px; height: 6px; overflow: hidden;">'
            '<div style="background: {}; width: {}%; height: 100%;"></div>'
            '</div>'
            '{}'
            '</div>',
            status_icon, completed, expected, int(percentage),
            bar_color, min(percentage, 100),
            format_html(completable_hint)
        )

    @admin.display(description=_('حالة الدفع'))
    def get_payment_status(self, obj):
        """Display payment status with visual indicator."""
        paid = float(obj.amount_paid())
        course_price = float(obj.course.price) if obj.course.price else 0
        remaining = float(obj.remaining_amount())

        if course_price == 0:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">🆓 مجاني</span>'
            )

        if remaining <= 0:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">💚 مدفوع بالكامل</span>'
            )
        elif paid > 0:
            percentage = int((paid / course_price) * 100)
            return format_html(
                '<span style="color: #f39c12; font-weight: bold;" title="مدفوع {}%">'
                '🟡 دفعة جزئية ({}%)</span>',
                percentage, percentage
            )
        else:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">🔴 غير مدفوع</span>'
            )

    @admin.display(description=_('المدفوع / الإجمالي'))
    def get_payment_progress(self, obj):
        """Display payment progress with amounts."""
        paid = obj.amount_paid()
        course_price = obj.course.price if obj.course.price else 0
        remaining = obj.remaining_amount()

        if course_price == 0:
            return format_html('<span style="color: #95a5a6;">-</span>')

        # Calculate percentage for progress bar
        percentage = min(
            100, int((float(paid) / float(course_price)) * 100)) if course_price > 0 else 0

        # Choose color based on payment status
        if remaining <= 0:
            bar_color = '#27ae60'  # Green - fully paid
        elif paid > 0:
            bar_color = '#f39c12'  # Orange - partial
        else:
            bar_color = '#e74c3c'  # Red - unpaid

        return format_html(
            '<div style="min-width: 120px;">'
            '<div style="display: flex; justify-content: space-between; font-size: 0.85em; margin-bottom: 2px;">'
            '<span style="color: #27ae60;">{} ج.م</span>'
            '<span style="color: #95a5a6;">/ {} ج.م</span>'
            '</div>'
            '<div style="background: #ecf0f1; border-radius: 4px; height: 6px; overflow: hidden;">'
            '<div style="background: {}; width: {}%; height: 100%;"></div>'
            '</div>'
            '{}'
            '</div>',
            paid, course_price, bar_color, percentage,
            format_html(
                '<div style="font-size: 0.75em; color: #e74c3c; margin-top: 2px;">متبقي: {} ج.م</div>',
                remaining
            ) if remaining > 0 else ''
        )

    @admin.display(description=_('تاريخ التسجيل'), ordering='enrolled_at')
    def get_enrolled_date(self, obj):
        """Display enrollment date with relative time."""
        if obj.enrolled_at:
            now = timezone.now()
            diff = now - obj.enrolled_at

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
                relative = obj.enrolled_at.strftime('%Y/%m/%d')

            return format_html(
                '<span title="{}">{}</span>',
                obj.enrolled_at.strftime('%Y/%m/%d %H:%M'),
                relative
            )
        return '-'

    @admin.display(description=_('تم بواسطة'))
    def get_created_by_display(self, obj):
        """Display who created the enrollment."""
        if obj.created_by:
            name = obj.created_by.get_full_name() or obj.created_by.username
            return format_html(
                '<small style="color: #7f8c8d;">👤 {}</small>',
                name
            )
        return format_html('<small style="color: #bdc3c7;">-</small>')

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
                '<strong>🧑‍🎓 طالب:</strong> {}<br>'
                '<strong>📧 البريد:</strong> {}<br>'
                '<strong>📱 الهاتف:</strong> {}'
                '</div>',
                user.get_full_name() if user else '-',
                user.email if user else '-',
                getattr(user, 'phone_number1', '-') if user else '-'
            )
        elif obj.child:
            parent = obj.child.primary_parent
            parent_user = parent.user if parent else None
            return format_html(
                '<div style="padding: 10px; background: #264b5d; border-radius: 5px;">'
                '<strong>👦 الطفل:</strong> {}<br>'
                '<strong>👨‍👩‍👧 ولي الأمر:</strong> {}<br>'
                '<strong>📱 هاتف ولي الأمر:</strong> {}'
                '</div>',
                obj.child,
                parent_user.get_full_name() if parent_user else '-',
                getattr(parent_user, 'phone_number1',
                        '-') if parent_user else '-'
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
                '<strong>💰 سعر الدورة:</strong> {} ج.م<br>'
                '<strong>👥 المسجلين:</strong> {} / {}'
                '</div>',
                obj.course.name,
                obj.course.instructor or '-',
                obj.course.price or 'مجاني',
                obj.course.enrolled_count,
                obj.course.capacity
            )
        return '-'

    @admin.display(description=_('ملخص المدفوعات'))
    def get_payment_summary(self, obj):
        """Display payment summary with visual progress."""
        paid = obj.amount_paid()
        course_price = obj.course.price if obj.course.price else 0
        remaining = obj.remaining_amount()
        payments_count = obj.payments.count()

        # Payment status color and icon
        if course_price == 0:
            status_html = '<span style="color: #27ae60;">🆓 دورة مجانية</span>'
        elif remaining <= 0:
            status_html = '<span style="color: #27ae60;">✅ مدفوع بالكامل</span>'
        elif paid > 0:
            percentage = int((float(paid) / float(course_price)) * 100)
            status_html = f'<span style="color: #f39c12;">🟡 دفعة جزئية ({percentage}%)</span>'
        else:
            status_html = '<span style="color: #e74c3c;">🔴 غير مدفوع</span>'

        # Calculate percentage for progress bar
        percentage = min(
            100, int((float(paid) / float(course_price)) * 100)) if course_price > 0 else 0

        return format_html(
            '<div style="padding: 15px; background: #264b5d; border-radius: 5px;">'
            '<div style="margin-bottom: 10px;">{}</div>'
            '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center;">'
            '<div style="background: #1a3a4a; padding: 10px; border-radius: 5px;">'
            '<div style="font-size: 1.2em; color: #27ae60; font-weight: bold;">{} ج.م</div>'
            '<div style="font-size: 0.8em; color: #95a5a6;">المدفوع</div>'
            '</div>'
            '<div style="background: #1a3a4ا; padding: 10px; border-radius: 5px;">'
            '<div style="font-size: 1.2em; color: {}; font-weight: bold;">{} ج.م</div>'
            '<div style="font-size: 0.8em; color: #95a5a6;">المتبقي</div>'
            '</div>'
            '<div style="background: #1a3a4a; padding: 10px; border-radius: 5px;">'
            '<div style="font-size: 1.2em; color: #3498db; font-weight: bold;">{}</div>'
            '<div style="font-size: 0.8em; color: #95a5a6;">عدد الدفعات</div>'
            '</div>'
            '</div>'
            '<div style="margin-top: 10px;">'
            '<div style="background: #1a3a4a; border-radius: 4px; height: 8px; overflow: hidden;">'
            '<div style="background: linear-gradient(90deg, #27ae60, #2ecc71); width: {}%; height: 100%;"></div>'
            '</div>'
            '</div>'
            '</div>',
            status_html,
            paid,
            '#e74c3c' if remaining > 0 else '#27ae60', remaining,
            payments_count,
            percentage
        )

    # =========================================================================
    # Form Customization
    # =========================================================================
    def get_form(self, request, obj=None, **kwargs):
        """Apply Arabic labels and customize form."""
        form = super().get_form(request, obj, **kwargs)

        labels = {
            'course': 'الدورة',
            'student': 'الطالب',
            'child': 'الطفل',
            'status': 'الحالة',
            'enrolled_at': 'تاريخ التسجيل',
            'created_by': 'تم الإنشاء بواسطة',
            'updated_at': 'تاريخ التحديث',
            'completed_at': 'تاريخ الإكمال',
            'dropped_at': 'تاريخ الإلغاء',
        }

        help_texts = {
            'student': 'اختر الطالب إذا كان بالغاً',
            'child': 'اختر الطفل إذا كان قاصراً',
        }

        for field_name, label in labels.items():
            if field_name in form.base_fields:
                form.base_fields[field_name].label = label

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
        extra_context['title'] = _('إضافة إلتحاق جديد')
        return super().add_view(request, form_url, extra_context)

    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add extra context for change view."""
        extra_context = extra_context or {}
        extra_context['title'] = _('تفاصيل الإلتحاق')
        return super().change_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        """Auto-set created_by when creating new enrollment."""
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    # =========================================================================
    # Permission Helpers
    # =========================================================================
    def has_delete_permission(self, request, obj=None):
        """Restrict deletion of completed or refunded enrollments."""
        if obj and obj.status in [EnrollmentStatus.COMPLETED, EnrollmentStatus.REFUNDED]:
            return False
        return super().has_delete_permission(request, obj)
