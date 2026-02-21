from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Sum, Q
from django.urls import reverse
from django.contrib import messages
from django.http import HttpResponse
from core.utils import ExcelExportMixin

from ..models import Parent, Child, ChildParents, ParentLinkRequest
from ..utils.card_generator import generate_children_pdf


# =============================================================================
# Inline Classes
# =============================================================================

class ChildInline(admin.TabularInline):
    """Inline to show primary children of a parent."""
    model = Child
    fk_name = 'primary_parent'
    extra = 0
    max_num = 10
    fields = ('unique_code', 'first_name', 'last_name', 'gender',
              'dob', 'get_age', 'get_enrollments_count')
    readonly_fields = ('unique_code', 'get_age', 'get_enrollments_count')
    show_change_link = True
    verbose_name = "طفل"
    verbose_name_plural = "الأطفال (أساسي)"

    def get_age(self, obj):
        if obj and obj.pk:
            age = obj.get_age_on_date()
            return f"{age} سنة" if age else "-"
        return "-"
    get_age.short_description = "العمر"

    def get_enrollments_count(self, obj):
        if obj and obj.pk:
            count = obj.enrollments.count()
            if count > 0:
                return format_html('<span style="color: green; font-weight: bold;">{}</span>', count)
            return count
        return 0
    get_enrollments_count.short_description = "الإلتحاقات"


class ExtraChildrenInline(admin.TabularInline):
    """Inline to show extra children linked to parent."""
    model = ChildParents
    fk_name = 'parent'
    extra = 0
    max_num = 5
    autocomplete_fields = ('child',)
    verbose_name = "طفل إضافي"
    verbose_name_plural = "أطفال إضافيين (روابط ثانوية)"


class PaymentInline(admin.TabularInline):
    """Inline to show payments made by parent."""
    model = None  # Set dynamically
    fk_name = 'payer_parent'
    extra = 0
    max_num = 20
    fields = ('get_enrollment_info', 'amount', 'method',
              'status', 'get_status_badge', 'created_at')
    readonly_fields = ('get_enrollment_info', 'get_status_badge', 'created_at')
    show_change_link = True
    verbose_name = "دفعة"
    verbose_name_plural = "المدفوعات"
    ordering = ['-created_at']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('enrollment', 'enrollment__course')

    def get_enrollment_info(self, obj):
        if obj.enrollment:
            return f"{obj.enrollment.course.name}"
        return "-"
    get_enrollment_info.short_description = "الدورة"

    def get_status_badge(self, obj):
        colors = {
            'pending': '#f0ad4e',
            'paid': '#5cb85c',
            'refunded': '#5bc0de',
            'void': '#d9534f',
        }
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    get_status_badge.short_description = "الحالة"

    def has_add_permission(self, request, obj=None):
        return False


class EnrollmentInline(admin.TabularInline):
    """Inline to show enrollments for a child."""
    model = None  # Set dynamically
    fk_name = 'child'
    extra = 0
    max_num = 20
    fields = ('get_course_name', 'status', 'get_status_badge',
              'enrolled_at', 'get_remaining')
    readonly_fields = ('get_course_name', 'get_status_badge',
                       'enrolled_at', 'get_remaining')
    show_change_link = True
    verbose_name = "إلتحاق"
    verbose_name_plural = "الإلتحاقات"
    ordering = ['-enrolled_at']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('course')

    def get_course_name(self, obj):
        return obj.course.name if obj.course else "-"
    get_course_name.short_description = "الدورة"

    def get_status_badge(self, obj):
        colors = {
            'active': '#5cb85c',
            'completed': '#5bc0de',
            'suspended': '#f0ad4e',
            'dropped': '#d9534f',
            'refunded': '#777',
        }
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    get_status_badge.short_description = "الحالة"

    def get_remaining(self, obj):
        remaining = obj.remaining_amount()
        if remaining > 0:
            return format_html('<span style="color: #d9534f; font-weight: bold;">{:,.0f} ج.م</span>', remaining)
        return format_html('<span style="color: #5cb85c;">✓ مدفوع بالكامل</span>')
    get_remaining.short_description = "المتبقي"


class ExtraParentsInline(admin.TabularInline):
    """Inline to show extra parents linked to child."""
    model = ChildParents
    fk_name = 'child'
    extra = 0
    max_num = 2
    autocomplete_fields = ('parent',)
    verbose_name = "ولي أمر إضافي"
    verbose_name_plural = "أولياء أمور إضافيين"


class LinkRequestInline(admin.TabularInline):
    """Inline to show link requests for a child."""
    model = ParentLinkRequest
    fk_name = 'child'
    extra = 0
    fields = ('requester', 'status', 'created_at')
    readonly_fields = ('requester', 'status', 'created_at')
    show_change_link = True
    verbose_name = "طلب ربط"
    verbose_name_plural = "طلبات الربط"


# =============================================================================
# Filters
# =============================================================================

class HasChildrenFilter(admin.SimpleListFilter):
    """Filter parents by whether they have children."""
    title = 'لديه أطفال'
    parameter_name = 'has_children'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'نعم'),
            ('no', 'لا'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(primary_children__isnull=False).distinct()
        if self.value() == 'no':
            return queryset.filter(primary_children__isnull=True)
        return queryset


class HasPaymentsFilter(admin.SimpleListFilter):
    """Filter parents by whether they have payments."""
    title = 'لديه مدفوعات'
    parameter_name = 'has_payments'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'نعم'),
            ('no', 'لا'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(payments__isnull=False).distinct()
        if self.value() == 'no':
            return queryset.filter(payments__isnull=True)
        return queryset


class ChildAgeFilter(admin.SimpleListFilter):
    """Filter children by age group."""
    title = 'الفئة العمرية'
    parameter_name = 'age_group'

    def lookups(self, request, model_admin):
        return [
            ('0-5', '0-5 سنوات'),
            ('6-10', '6-10 سنوات'),
            ('11-15', '11-15 سنة'),
            ('16-18', '16-18 سنة'),
            ('18+', '18+ سنة'),
        ]

    def queryset(self, request, queryset):
        today = timezone.localdate()
        if self.value() == '0-5':
            return queryset.filter(dob__gt=today.replace(year=today.year - 6))
        if self.value() == '6-10':
            return queryset.filter(
                dob__lte=today.replace(year=today.year - 6),
                dob__gt=today.replace(year=today.year - 11)
            )
        if self.value() == '11-15':
            return queryset.filter(
                dob__lte=today.replace(year=today.year - 11),
                dob__gt=today.replace(year=today.year - 16)
            )
        if self.value() == '16-18':
            return queryset.filter(
                dob__lte=today.replace(year=today.year - 16),
                dob__gt=today.replace(year=today.year - 19)
            )
        if self.value() == '18+':
            return queryset.filter(dob__lte=today.replace(year=today.year - 18))
        return queryset


class HasEnrollmentsFilter(admin.SimpleListFilter):
    """Filter children by whether they have enrollments."""
    title = 'ملتحق بدورات'
    parameter_name = 'has_enrollments'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'نعم'),
            ('no', 'لا'),
            ('active', 'إلتحاق نشط'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(enrollments__isnull=False).distinct()
        if self.value() == 'no':
            return queryset.filter(enrollments__isnull=True)
        if self.value() == 'active':
            return queryset.filter(enrollments__status='active').distinct()
        return queryset


# =============================================================================
# Admin Classes
# =============================================================================

@admin.register(Parent)
class ParentAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Enhanced Admin for Parent model."""
    list_display = (
        'get_full_name', 'get_phone', 'get_email',
        'get_children_count', 'get_total_payments', 'get_verified_badge'
    )
    list_filter = (HasChildrenFilter, HasPaymentsFilter,
                   'user__is_verified', 'user__gender')
    search_fields = (
        'user__first_name', 'user__last_name',
        'user__phone_number1', 'user__email',
        'primary_children__first_name', 'primary_children__unique_code'
    )
    autocomplete_fields = ('user',)
    readonly_fields = ('get_summary_card',)

    fieldsets = (
        ('معلومات ولي الأمر', {
            'fields': ('user', 'image')
        }),
        ('ملخص', {
            'fields': ('get_summary_card',),
            'classes': ('collapse',),
        }),
    )

    # Excel export configuration
    excel_filename = 'parents'

    def get_inlines(self, request, obj):
        """Dynamically set inlines with correct model references."""
        from enrollments_payments.models.payment import Payment

        # Create PaymentInline with model
        class DynamicPaymentInline(PaymentInline):
            model = Payment

        inlines = [ChildInline, ExtraChildrenInline, DynamicPaymentInline]
        return inlines

    def get_queryset(self, request):
        """Optimize queryset with annotations."""
        qs = super().get_queryset(request)
        return qs.select_related('user').prefetch_related(
            'primary_children', 'payments'
        ).annotate(
            children_count=Count('primary_children', distinct=True),
            total_payments=Sum('payments__amount',
                               filter=Q(payments__status='paid'))
        )

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    get_full_name.admin_order_field = 'user__first_name'

    def get_phone(self, obj):
        phone = obj.user.phone_number1
        return format_html(
            '<a href="tel:{}" style="text-decoration: none;">'
            '<span style="direction: ltr; unicode-bidi: embed;">{}</span></a>',
            phone, phone
        )
    get_phone.short_description = 'رقم الهاتف'
    get_phone.admin_order_field = 'user__phone_number1'

    def get_email(self, obj):
        email = obj.user.email
        if email:
            return format_html('<a href="mailto:{}">{}</a>', email, email)
        return format_html('<span style="color: #999;">-</span>')
    get_email.short_description = 'البريد الإلكتروني'

    def get_children_count(self, obj):
        count = getattr(obj, 'children_count', obj.primary_children.count())
        if count > 0:
            return format_html(
                '<span style="background-color: #5bc0de; color: white; padding: 3px 10px; '
                'border-radius: 12px; font-weight: bold;">{}</span>', count
            )
        return format_html('<span style="color: #999;">0</span>')
    get_children_count.short_description = 'الأطفال'
    get_children_count.admin_order_field = 'children_count'

    def get_total_payments(self, obj):
        total = getattr(obj, 'total_payments', None) or 0
        if total > 0:
            formatted_total = f"{total:,.0f}"
            return format_html(
                '<span style="color: #5cb85c; font-weight: bold;">{} ج.م</span>',
                formatted_total
            )
        return format_html('<span style="color: #999;">0</span>')
    get_total_payments.short_description = 'إجمالي المدفوعات'
    get_total_payments.admin_order_field = 'total_payments'

    def get_verified_badge(self, obj):
        if obj.user.is_verified:
            return format_html(
                '<span style="color: #5cb85c;" title="تم التحقق">✓ موثق</span>'
            )
        return format_html(
            '<span style="color: #d9534f;" title="لم يتم التحقق">✗ غير موثق</span>'
        )
    get_verified_badge.short_description = 'التحقق'
    get_verified_badge.admin_order_field = 'user__is_verified'

    def get_summary_card(self, obj):
        """Display a summary card with parent statistics."""
        if not obj or not obj.pk:
            return "-"

        children_count = obj.primary_children.count()
        extra_children = obj.extra_children.count()
        total_paid = obj.payments.filter(status='paid').aggregate(
            Sum('amount'))['amount__sum'] or 0
        pending_payments = obj.payments.filter(status='pending').count()
        formatted_total_paid = f"{total_paid:,.0f}"

        return format_html(
            '''
            <div style="display: flex; gap: 20px; flex-wrap: wrap; padding: 10px; 
                        background: #f8f9fa; border-radius: 8px;">
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #5bc0de;">{}</div>
                    <div style="color: #666;">أطفال أساسيين</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #f0ad4e;">{}</div>
                    <div style="color: #666;">أطفال إضافيين</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #5cb85c;">{} ج.م</div>
                    <div style="color: #666;">إجمالي المدفوعات</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: {};">{}</div>
                    <div style="color: #666;">مدفوعات معلقة</div>
                </div>
            </div>
            ''',
            children_count, extra_children, formatted_total_paid,
            '#d9534f' if pending_payments > 0 else '#5cb85c', pending_payments
        )
    get_summary_card.short_description = 'ملخص الحساب'


@admin.register(Child)
class ChildAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Enhanced Admin for Child model."""
    list_display = (
        'get_unique_code_badge', 'get_full_name', 'get_gender_badge',
        'get_age_display', 'get_primary_parent_link', 'get_enrollments_badge',
        'get_phone_display', 'image'
    )
    list_filter = ('gender', ChildAgeFilter,
                   HasEnrollmentsFilter, 'created_at')
    search_fields = ('unique_code', 'first_name', 'last_name',
                     'phone', 'primary_parent__user__phone_number1')
    readonly_fields = ('unique_code', 'created_at',
                       'updated_at', 'get_age_display', 'get_summary_card')
    autocomplete_fields = ('primary_parent',)
    date_hierarchy = 'created_at'
    list_per_page = 25

    # Excel export configuration
    excel_filename = 'children'

    fieldsets = (
        ('معلومات الطفل', {
            'fields': ('primary_parent', ('first_name', 'last_name'), ('gender', 'dob'))
        }),
        ('ملخص', {
            'fields': ('get_summary_card',),
            'classes': ('collapse',),
        }),
        ('معلومات التواصل', {
            'fields': ('phone', 'unique_code')
        }),
        ('الصورة', {
            'fields': ('image',),
            'classes': ('collapse',),
        }),
        ('التواريخ', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_inlines(self, request, obj):
        """Dynamically set inlines with correct model references."""
        from enrollments_payments.models.enrollment import Enrollment

        class DynamicEnrollmentInline(EnrollmentInline):
            model = Enrollment

        return [DynamicEnrollmentInline, ExtraParentsInline, LinkRequestInline]

    def get_queryset(self, request):
        """Optimize queryset with annotations."""
        qs = super().get_queryset(request)
        return qs.select_related('primary_parent', 'primary_parent__user').prefetch_related(
            'enrollments'
        ).annotate(
            enrollments_count=Count('enrollments', distinct=True),
            active_enrollments=Count(
                'enrollments', filter=Q(enrollments__status='active'))
        )

    def get_unique_code_badge(self, obj):
        return format_html(
            '<code style="background-color: #264b5d; padding: 3px 8px; '
            'border-radius: 4px; font-family: monospace; font-weight: bold;">{}</code>',
            obj.unique_code
        )
    get_unique_code_badge.short_description = 'الكود'
    get_unique_code_badge.admin_order_field = 'unique_code'

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    get_full_name.short_description = 'الاسم الكامل'
    get_full_name.admin_order_field = 'first_name'

    def get_gender_badge(self, obj):
        if obj.gender == 'boy':
            return format_html(
                '<span style="background-color: #5bc0de; color: white; padding: 3px 8px; '
                'border-radius: 4px;">👦 ولد</span>'
            )
        elif obj.gender == 'girl':
            return format_html(
                '<span style="background-color: #ff69b4; color: white; padding: 3px 8px; '
                'border-radius: 4px;">👧 بنت</span>'
            )
        return obj.get_gender_display()
    get_gender_badge.short_description = 'النوع'
    get_gender_badge.admin_order_field = 'gender'

    def get_age_display(self, obj):
        age = obj.get_age_on_date()
        if age is not None:
            return format_html(
                '<span style="font-weight: bold;">{}</span> سنة',
                age
            )
        return "-"
    get_age_display.short_description = 'العمر'

    def get_primary_parent_link(self, obj):
        if obj.primary_parent:
            url = reverse('admin:parents_parent_change',
                          args=[obj.primary_parent.pk])
            return format_html(
                '<a href="{}" style="text-decoration: none;">{}</a>',
                url, obj.primary_parent
            )
        return "-"
    get_primary_parent_link.short_description = 'ولي الأمر'
    get_primary_parent_link.admin_order_field = 'primary_parent'

    def get_enrollments_badge(self, obj):
        total = getattr(obj, 'enrollments_count', obj.enrollments.count())
        active = getattr(obj, 'active_enrollments',
                         obj.enrollments.filter(status='active').count())

        if total == 0:
            return format_html('<span style="color: #999;">لا يوجد</span>')

        return format_html(
            '<span style="background-color: #5cb85c; color: white; padding: 2px 8px; '
            'border-radius: 4px; margin-left: 5px;">{} نشط</span> '
            '<span style="color: #666;">/ {} إجمالي</span>',
            active, total
        )
    get_enrollments_badge.short_description = 'الإلتحاقات'

    def get_phone_display(self, obj):
        if obj.phone:
            return format_html(
                '<a href="tel:{}" style="text-decoration: none;">'
                '<span style="direction: ltr; unicode-bidi: embed;">{}</span></a>',
                obj.phone, obj.phone
            )
        return format_html('<span style="color: #999;">-</span>')
    get_phone_display.short_description = 'الهاتف'
    get_phone_display.admin_order_field = 'phone'

    def get_summary_card(self, obj):
        """Display a summary card with child statistics."""
        if not obj or not obj.pk:
            return "-"

        age = obj.get_age_on_date() or 0
        enrollments = obj.enrollments.count()
        active_enrollments = obj.enrollments.filter(status='active').count()
        completed = obj.enrollments.filter(status='completed').count()
        extra_parents = obj.extra_parents.count()

        return format_html(
            '''
            <div style="display: flex; gap: 20px; flex-wrap: wrap; padding: 10px; 
                        background: #f8f9fa; border-radius: 8px;">
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #5bc0de;">{}</div>
                    <div style="color: #666;">العمر (سنوات)</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #5cb85c;">{}</div>
                    <div style="color: #666;">إلتحاقات نشطة</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #777;">{}</div>
                    <div style="color: #666;">إلتحاقات مكتملة</div>
                </div>
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #f0ad4e;">{}</div>
                    <div style="color: #666;">أولياء أمور إضافيين</div>
                </div>
            </div>
            ''',
            age, active_enrollments, completed, extra_parents
        )
    get_summary_card.short_description = 'ملخص'

    # Actions
    actions = ['export_children_info',
               'download_id_cards_pdf',
               'download_single_card_image']

    @admin.action(description="📋 تصدير معلومات الأطفال المحددين")
    def export_children_info(self, request, queryset):
        """Export basic info about selected children."""
        count = queryset.count()
        self.message_user(
            request,
            f"تم تحديد {count} طفل. (يمكن تنفيذ التصدير لاحقاً)",
            messages.INFO
        )

    @admin.action(description="🖼️ تحميل صورة بطاقة واحدة")
    def download_single_card_image(self, request, queryset):
        """Download card image for a single selected child."""
        if queryset.count() != 1:
            self.message_user(
                request, "يرجى تحديد طفل واحد فقط", messages.WARNING)
            return

        child = queryset.first()

        try:
            # Generate card image buffer
            image_buffer = child.generate_card_image_buffer()

            # Create response
            response = HttpResponse(
                image_buffer.getvalue(),
                content_type='image/png'
            )

            # Set filename
            filename = f"بطاقة_{child.first_name}_{child.unique_code}.png"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            self.message_user(
                request,
                f"✓ تم تحميل بطاقة {child.first_name} بنجاح",
                messages.SUCCESS
            )

            return response

        except Exception as e:
            self.message_user(
                request,
                f"⚠ حدث خطأ أثناء إنشاء البطاقة: {str(e)}",
                messages.ERROR
            )

    @admin.action(description="🪪 تحميل بطاقات الهوية (PDF)")
    def download_id_cards_pdf(self, request, queryset):
        """Download ID cards for selected children as PDF."""
        children = list(queryset.select_related(
            'primary_parent', 'primary_parent__user'))

        if not children:
            self.message_user(
                request, "لم يتم تحديد أي أطفال", messages.WARNING)
            return

        try:
            # Generate PDF with all selected children
            pdf_buffer = generate_children_pdf(children)

            # Create response
            response = HttpResponse(
                pdf_buffer.getvalue(),
                content_type='application/pdf'
            )

            # Set filename
            if len(children) == 1:
                filename = f"بطاقة_{children[0].first_name}_{children[0].unique_code}.pdf"
            else:
                filename = f"بطاقات_الأطفال_{len(children)}.pdf"

            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            self.message_user(
                request,
                f"✓ تم تحميل بطاقات {len(children)} طفل بنجاح",
                messages.SUCCESS
            )

            return response

        except Exception as e:
            self.message_user(
                request,
                f"⚠ حدث خطأ أثناء إنشاء البطاقات: {str(e)}",
                messages.ERROR
            )


@admin.register(ChildParents)
class ChildParentsAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Enhanced Admin for ChildParents model."""
    list_display = ('get_child_link', 'get_parent_link',
                    'get_relationship_type')
    list_filter = ('child__gender',)
    search_fields = (
        'child__first_name', 'child__last_name', 'child__unique_code',
        'parent__user__first_name', 'parent__user__phone_number1'
    )
    autocomplete_fields = ('child', 'parent')

    # Excel export configuration
    excel_filename = 'child_parents_links'

    def get_child_link(self, obj):
        url = reverse('admin:parents_child_change', args=[obj.child.pk])
        return format_html(
            '<a href="{}">{}</a>',
            url, obj.child
        )
    get_child_link.short_description = 'الطفل'
    get_child_link.admin_order_field = 'child'

    def get_parent_link(self, obj):
        url = reverse('admin:parents_parent_change', args=[obj.parent.pk])
        return format_html(
            '<a href="{}">{}</a>',
            url, obj.parent
        )
    get_parent_link.short_description = 'ولي الأمر'
    get_parent_link.admin_order_field = 'parent'

    def get_relationship_type(self, obj):
        return format_html(
            '<span style="background-color: #f0ad4e; color: white; padding: 3px 8px; '
            'border-radius: 4px;">ولي أمر ثانوي</span>'
        )
    get_relationship_type.short_description = 'نوع العلاقة'


@admin.register(ParentLinkRequest)
class ParentLinkRequestAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Enhanced Admin for ParentLinkRequest model."""
    list_display = (
        'get_child_link', 'get_requester_link',
        'get_primary_parent_link', 'get_status_badge', 'created_at'
    )
    list_filter = ('status', 'created_at')
    search_fields = (
        'child__first_name', 'child__unique_code',
        'requester__user__first_name', 'requester__user__phone_number1',
        'primary_parent__user__first_name'
    )
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('child', 'requester', 'primary_parent')
    date_hierarchy = 'created_at'
    list_per_page = 25

    # Excel export configuration
    excel_filename = 'parent_link_requests'

    fieldsets = (
        ('معلومات الطلب', {
            'fields': ('child', 'requester', 'primary_parent', 'status')
        }),
        ('التواريخ', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_child_link(self, obj):
        url = reverse('admin:parents_child_change', args=[obj.child.pk])
        return format_html('<a href="{}">{}</a>', url, obj.child)
    get_child_link.short_description = 'الطفل'
    get_child_link.admin_order_field = 'child'

    def get_requester_link(self, obj):
        url = reverse('admin:parents_parent_change', args=[obj.requester.pk])
        return format_html('<a href="{}">{}</a>', url, obj.requester)
    get_requester_link.short_description = 'مقدم الطلب'
    get_requester_link.admin_order_field = 'requester'

    def get_primary_parent_link(self, obj):
        url = reverse('admin:parents_parent_change',
                      args=[obj.primary_parent.pk])
        return format_html('<a href="{}">{}</a>', url, obj.primary_parent)
    get_primary_parent_link.short_description = 'ولي الأمر الرئيسي'
    get_primary_parent_link.admin_order_field = 'primary_parent'

    def get_status_badge(self, obj):
        colors = {
            'pending': ('#f0ad4e', '⏳ معلق'),
            'approved': ('#5cb85c', '✓ موافق عليه'),
            'rejected': ('#d9534f', '✗ مرفوض'),
        }
        color, label = colors.get(
            obj.status, ('#777', obj.get_status_display()))
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 4px; white-space: nowrap;">{}</span>',
            color, label
        )
    get_status_badge.short_description = 'الحالة'
    get_status_badge.admin_order_field = 'status'

    # Actions
    actions = ['approve_requests', 'reject_requests']

    @admin.action(description="✓ الموافقة على الطلبات المحددة")
    def approve_requests(self, request, queryset):
        """Approve selected pending requests."""
        pending = queryset.filter(status='pending')
        approved_count = 0
        errors = []

        for req in pending:
            try:
                req.approve()
                approved_count += 1
            except Exception as e:
                errors.append(f"{req.child}: {str(e)}")

        if approved_count:
            self.message_user(
                request,
                f"✓ تم الموافقة على {approved_count} طلب بنجاح",
                messages.SUCCESS
            )
        if errors:
            self.message_user(
                request,
                f"⚠ فشل في {len(errors)} طلب: {'; '.join(errors[:3])}",
                messages.WARNING
            )

    @admin.action(description="✗ رفض الطلبات المحددة")
    def reject_requests(self, request, queryset):
        """Reject selected pending requests."""
        pending = queryset.filter(status='pending')
        count = 0

        for req in pending:
            req.reject()
            count += 1

        self.message_user(
            request,
            f"تم رفض {count} طلب",
            messages.WARNING if count > 0 else messages.INFO
        )
