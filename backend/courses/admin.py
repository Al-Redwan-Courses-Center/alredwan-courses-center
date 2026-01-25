from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Avg, Q, F
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import Season, Tag, Course, CourseSchedule, Lecture, Exam, ExamResult


# =============================================================================
# Constants and Configuration
# =============================================================================
ARABIC_FIELD_LABELS = {
    'name': 'الاسم',
    'season_type': 'نوع الموسم',
    'description': 'الوصف',
    'start_date': 'تاريخ البداية',
    'end_date': 'تاريخ النهاية',
    'is_active': 'نشط',
    'created_at': 'تاريخ الإنشاء',
    'updated_at': 'تاريخ التحديث',
    'instructor': 'المدرس',
    'season': 'الموسم',
    'num_lectures': 'عدد المحاضرات',
    'capacity': 'السعة',
    'price': 'السعر',
    'for_adults': 'للبالغين',
    'min_age': 'الحد الأدنى للعمر',
    'max_age': 'الحد الأقصى للعمر',
    'tags': 'الوسوم',
    'slug': 'الرابط المختصر',
    'course': 'الدورة',
    'weekday': 'اليوم',
    'start_time': 'وقت البداية',
    'end_time': 'وقت النهاية',
    'title': 'العنوان',
    'lecture_number': 'رقم المحاضرة',
    'day': 'اليوم',
    'status': 'الحالة',
    'attendance_taken': 'تم أخذ الحضور',
    'exam_type': 'نوع الامتحان',
    'scheduled_at': 'موعد الامتحان',
    'total_marks': 'مجموع الدرجات',
    'exam': 'الامتحان',
    'student': 'الطالب',
    'child': 'الطفل',
    'marks_obtained': 'الدرجة المحصلة',
    'percentage': 'النسبة المئوية',
    'passed': 'نجح',
    'notes': 'ملاحظات',
    'entered_by': 'تم الإدخال بواسطة',
    'entered_at': 'تاريخ الإدخال',
}

# Status colors for visual indicators
STATUS_COLORS = {
    'scheduled': '#3498db',    # Blue
    'in_progress': '#f39c12',  # Orange
    'completed': '#27ae60',    # Green
    'cancelled': '#e74c3c',    # Red
}


# =============================================================================
# Helper Functions and Mixins
# =============================================================================


def apply_arabic_labels(form):
    """Apply Arabic labels to form fields."""
    for field_name, label in ARABIC_FIELD_LABELS.items():
        if field_name in form.base_fields:
            form.base_fields[field_name].label = label
    return form


class ArabicLabelsMixin:
    """Mixin to automatically apply Arabic labels to admin forms."""

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


class OptimizedQuerysetMixin:
    """Mixin to optimize querysets with select_related and prefetch_related."""
    select_related_fields = []
    prefetch_related_fields = []

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self.select_related_fields:
            qs = qs.select_related(*self.select_related_fields)
        if self.prefetch_related_fields:
            qs = qs.prefetch_related(*self.prefetch_related_fields)
        return qs


class ExportMixin:
    """Mixin to add export actions to admin."""

    def get_export_filename(self, file_format):
        """Generate a filename for export."""
        date_str = timezone.now().strftime('%Y-%m-%d')
        return f'{self.model._meta.verbose_name_plural}_{date_str}'


# =============================================================================
# Custom Filters
# =============================================================================
class ActiveStatusFilter(admin.SimpleListFilter):
    """Filter for active/inactive status with visual indicators."""
    title = _('حالة النشاط')
    parameter_name = 'active_status'

    def lookups(self, request, model_admin):
        return (
            ('active', _('🟢 نشط')),
            ('inactive', _('🔴 غير نشط')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(is_active=True)
        if self.value() == 'inactive':
            return queryset.filter(is_active=False)
        return queryset


class CapacityStatusFilter(admin.SimpleListFilter):
    """Filter courses by capacity utilization."""
    title = _('حالة السعة')
    parameter_name = 'capacity_status'

    def lookups(self, request, model_admin):
        return (
            ('full', _('🔴 ممتلئ')),
            ('almost_full', _('🟡 شبه ممتلئ (>80%)')),
            ('available', _('🟢 متاح')),
            ('empty', _('⚪ فارغ')),
        )

    def queryset(self, request, queryset):
        # Use _enrolled_count annotation
        if self.value() == 'full':
            return queryset.filter(_enrolled_count__gte=models.F('capacity'))
        if self.value() == 'almost_full':
            return queryset.filter(
                _enrolled_count__gte=models.F('capacity') * 0.8,
                _enrolled_count__lt=models.F('capacity')
            )
        if self.value() == 'available':
            return queryset.filter(
                _enrolled_count__lt=models.F('capacity') * 0.8,
                _enrolled_count__gt=0
            )
        if self.value() == 'empty':
            return queryset.filter(_enrolled_count=0)
        return queryset


class DateRangeFilter(admin.SimpleListFilter):
    """Filter by date range with common presets."""
    title = _('الفترة الزمنية')
    parameter_name = 'date_range'
    date_field = 'start_date'

    def lookups(self, request, model_admin):
        return (
            ('today', _('اليوم')),
            ('this_week', _('هذا الأسبوع')),
            ('this_month', _('هذا الشهر')),
            ('next_week', _('الأسبوع القادم')),
            ('past', _('منتهي')),
            ('upcoming', _('قادم')),
        )

    def queryset(self, request, queryset):
        today = timezone.now().date()

        if self.value() == 'today':
            return queryset.filter(**{self.date_field: today})
        if self.value() == 'this_week':
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            return queryset.filter(**{
                f'{self.date_field}__gte': start_of_week,
                f'{self.date_field}__lte': end_of_week
            })
        if self.value() == 'this_month':
            return queryset.filter(**{
                f'{self.date_field}__year': today.year,
                f'{self.date_field}__month': today.month
            })
        if self.value() == 'next_week':
            start_of_next_week = today + timedelta(days=(7 - today.weekday()))
            end_of_next_week = start_of_next_week + timedelta(days=6)
            return queryset.filter(**{
                f'{self.date_field}__gte': start_of_next_week,
                f'{self.date_field}__lte': end_of_next_week
            })
        if self.value() == 'past':
            return queryset.filter(**{f'{self.date_field}__lt': today})
        if self.value() == 'upcoming':
            return queryset.filter(**{f'{self.date_field}__gte': today})
        return queryset


class LectureDateRangeFilter(DateRangeFilter):
    """Date range filter for lectures using 'day' field."""
    date_field = 'day'


# =============================================================================
# Admin Actions
# =============================================================================
@admin.action(description=_('✅ تفعيل العناصر المحددة'))
def activate_selected(modeladmin, request, queryset):
    """Activate selected items."""
    updated = queryset.update(is_active=True)
    modeladmin.message_user(
        request,
        _(f'تم تفعيل {updated} عنصر بنجاح'),
        level='SUCCESS'
    )


@admin.action(description=_('❌ إلغاء تفعيل العناصر المحددة'))
def deactivate_selected(modeladmin, request, queryset):
    """Deactivate selected items."""
    updated = queryset.update(is_active=False)
    modeladmin.message_user(
        request,
        _(f'تم إلغاء تفعيل {updated} عنصر بنجاح'),
        level='WARNING'
    )


@admin.action(description=_('📋 نسخ العناصر المحددة'))
def duplicate_selected(modeladmin, request, queryset):
    """Duplicate selected items."""
    for obj in queryset:
        obj.pk = None
        obj.name = f'{obj.name} (نسخة)'
        if hasattr(obj, 'slug'):
            obj.slug = f'{obj.slug}-copy'
        obj.save()
    modeladmin.message_user(
        request,
        _(f'تم نسخ {queryset.count()} عنصر بنجاح'),
        level='SUCCESS'
    )


# =============================================================================
# Inline Admin Classes
# =============================================================================
class CourseScheduleInline(admin.TabularInline):
    """Inline admin for course schedules."""
    model = CourseSchedule
    extra = 1
    min_num = 0
    max_num = 7
    fields = ('weekday', 'start_time', 'end_time')
    ordering = ('weekday',)

    verbose_name = _('جدول الدورة')
    verbose_name_plural = _('جداول الدورة')


class LectureInline(admin.TabularInline):
    """Inline admin for course lectures - shows recent lectures."""
    model = Lecture
    extra = 0
    max_num = 10
    fields = ('lecture_number', 'title', 'day', 'status', 'attendance_taken')
    readonly_fields = ('attendance_taken',)
    ordering = ('-day', '-lecture_number')
    show_change_link = True

    verbose_name = _('محاضرة')
    verbose_name_plural = _('آخر المحاضرات')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('instructor', 'instructor__user')


class ExamInline(admin.TabularInline):
    """Inline admin for course exams."""
    model = Exam
    extra = 0
    fields = ('name', 'exam_type', 'scheduled_at', 'total_marks')
    readonly_fields = ('scheduled_at',)
    show_change_link = True

    verbose_name = _('امتحان')
    verbose_name_plural = _('امتحانات الدورة')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('instructor', 'instructor__user')


class ExamResultInline(admin.TabularInline):
    """Inline admin for exam results."""
    model = ExamResult
    extra = 1
    fields = ('student', 'child', 'marks_obtained', 'percentage', 'passed')
    readonly_fields = ('percentage', 'passed')
    autocomplete_fields = ['student']
    raw_id_fields = ['child']

    verbose_name = _('نتيجة')
    verbose_name_plural = _('نتائج الامتحان')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student', 'student__user', 'child', 'entered_by'
        )


# =============================================================================
# Model Admin Classes
# =============================================================================
@admin.register(Season)
class SeasonAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for Season model."""

    list_display = (
        'name', 'season_type', 'get_date_range',
        'get_active_status', 'get_courses_count', 'created_at'
    )
    list_filter = ('season_type', ActiveStatusFilter, 'start_date')
    search_fields = ('name', 'description')
    date_hierarchy = 'start_date'
    list_editable = ('is_active',) if False else ()  # Disabled for cleaner UX
    list_per_page = 25
    ordering = ('-start_date',)
    actions = [activate_selected, deactivate_selected, duplicate_selected]
    save_on_top = True

    fieldsets = (
        (_('معلومات الموسم'), {
            'fields': ('name', 'season_type', 'description'),
            'description': _('أدخل المعلومات الأساسية للموسم')
        }),
        (_('التواريخ والحالة'), {
            'fields': ('start_date', 'end_date', 'is_active'),
            'description': _('حدد فترة الموسم وحالته')
        }),
    )

    @admin.display(description=_('الفترة'), ordering='start_date')
    def get_date_range(self, obj):
        """Display date range in a formatted way."""
        if obj.start_date and obj.end_date:
            return format_html(
                '<span style="white-space: nowrap;">{} → {}</span>',
                obj.start_date.strftime('%Y/%m/%d'),
                obj.end_date.strftime('%Y/%m/%d')
            )
        return '-'

    @admin.display(description=_('الحالة'), ordering='is_active')
    def get_active_status(self, obj):
        """Display active status with color indicator."""
        if obj.is_active:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">✅ نشط</span>'
            )
        return format_html(
            '<span style="color: #e74c3c;">🔴 غير نشط</span>'
        )

    @admin.display(description=_('عدد الدورات'))
    def get_courses_count(self, obj):
        """Display the number of courses in this season."""
        count = getattr(obj, 'courses_count', obj.courses.count())
        return format_html(
            '<span style="background: #3498db; color: white; padding: 2px 8px; '
            'border-radius: 10px;">{}</span>',
            count
        )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(courses_count=Count('courses'))


@admin.register(Tag)
class TagAdmin(ArabicLabelsMixin, admin.ModelAdmin):
    """Admin configuration for Tag model."""

    list_display = ('name', 'get_courses_count', 'created_at')
    search_fields = ('name',)
    list_per_page = 50
    ordering = ('name',)

    @admin.display(description=_('عدد الدورات'))
    def get_courses_count(self, obj):
        """Display number of courses using this tag."""
        count = getattr(obj, 'courses_count', obj.courses.count())
        if count > 0:
            return format_html(
                '<span style="background: #9b59b6; color: white; padding: 2px 8px; '
                'border-radius: 10px;">{}</span>',
                count
            )
        return format_html('<span style="color: #95a5a6;">0</span>')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(courses_count=Count('courses'))


@admin.register(Course)
class CourseAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for Course model with enhanced UX."""

    select_related_fields = ['instructor', 'instructor__user', 'season']
    prefetch_related_fields = ['tags']

    list_display = (
        'name', 'get_instructor_link', 'get_season', 'get_date_range',
        'get_capacity_bar', 'get_price_display', 'get_active_status'
    )
    list_filter = (
        ActiveStatusFilter, CapacityStatusFilter, 'season',
        'instructor', 'for_adults', DateRangeFilter, 'tags'
    )
    search_fields = (
        'name', 'description', 'slug',
        'instructor__user__first_name', 'instructor__user__last_name'
    )
    date_hierarchy = 'start_date'
    filter_horizontal = ('tags',)
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['instructor', 'season']
    list_per_page = 25
    ordering = ('-start_date', 'name')
    save_on_top = True
    actions = [activate_selected, deactivate_selected, duplicate_selected]

    # Inlines for related models
    inlines = [CourseScheduleInline, LectureInline, ExamInline]

    fieldsets = (
        (_('معلومات الدورة الأساسية'), {
            'fields': ('name', 'slug', 'description'),
            'description': _('المعلومات الأساسية للدورة')
        }),
        (_('المدرس والموسم'), {
            'fields': ('instructor', 'season'),
        }),
        (_('التواريخ والمحاضرات'), {
            'fields': ('start_date', 'end_date', 'num_lectures'),
            'description': _('حدد فترة الدورة وعدد المحاضرات المخطط لها، من الأفضل إدخال إما تاريخ النهاية أو عدد المحاضرات (أي واحد فقط منهما)  ')
        }),
        (_('السعة والتسجيل'), {
            'fields': ('capacity', 'price'),
            'description': _('السعة الكلية والسعر (عدد المسجلين يُحسب تلقائياً)')
        }),
        (_('الفئة العمرية'), {
            'fields': ('for_adults', 'min_age', 'max_age'),
            'classes': ('collapse',),
            'description': _('حدد الفئة العمرية المستهدفة')
        }),
        (_('إعدادات إضافية'), {
            'fields': ('tags', 'is_active'),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        """Override to annotate enrolled_count from actual enrollments."""
        qs = super().get_queryset(request)
        # Annotate with actual active enrollment count (use different name to avoid property conflict)
        qs = qs.annotate(
            _enrolled_count=Count(
                'enrollments',
                filter=Q(enrollments__status='active')
            )
        )
        return qs

    @admin.display(description=_('المدرس'), ordering='instructor__user__first_name')
    def get_instructor_link(self, obj):
        """Display instructor as a clickable link."""
        if obj.instructor:
            url = reverse('admin:users_instructor_change',
                          args=[obj.instructor.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '👨‍🏫 {}</a>',
                url, obj.instructor
            )
        return '-'

    def get_season(self, obj):
        return obj.season
    get_season.short_description = 'الموسم'
    get_season.admin_order_field = 'season'

    @admin.display(description=_('الفترة'), ordering='start_date')
    def get_date_range(self, obj):
        """Display date range."""
        if obj.start_date and obj.end_date:
            return format_html(
                '<span style="white-space: nowrap; font-size: 0.9em;">'
                '{} → {}</span>',
                obj.start_date.strftime('%m/%d'),
                obj.end_date.strftime('%m/%d')
            )
        return '-'

    @admin.display(description=_('السعة'))
    def get_capacity_bar(self, obj):
        """Display capacity as a visual progress bar."""
        if obj.capacity and obj.capacity > 0:
            # Use annotated value if available, otherwise fall back to property
            enrolled = getattr(obj, '_enrolled_count', None)
            if enrolled is None:
                enrolled = obj.enrolled_count
            percentage = min((enrolled / obj.capacity) * 100, 100)

            if percentage >= 100:
                color = '#e74c3c'
                status = 'ممتلئ'
            elif percentage >= 80:
                color = '#f39c12'
                status = 'شبه ممتلئ'
            else:
                color = '#27ae60'
                status = 'متاح'

            return format_html(
                '<div style="width: 100px; background: #ecf0f1; border-radius: 4px; '
                'overflow: hidden; font-weight: 700;" title="{}"; >'
                '<div style="width: {}%; background: {}; padding: 2px 0; '
                'text-align: center; color: black; font-size: 0.75em;">'
                '{}/{}</div></div>',
                status, percentage, color, enrolled, obj.capacity
            )
        return '-'

    @admin.display(description=_('السعر'), ordering='price')
    def get_price_display(self, obj):
        """Display price with currency."""
        if obj.price:
            return format_html(
                '<span style="color: #27ae60; font-weight: bold;">{} ج.م</span>',
                obj.price
            )
        return format_html('<span style="color: #27ae60;">مجاني</span>')

    @admin.display(description=_('الحالة'), ordering='is_active')
    def get_active_status(self, obj):
        """Display active status with color indicator."""
        if obj.is_active:
            return format_html(
                '<span style="color: #27ae60;">🟢</span>'
            )
        return format_html('<span style="color: #e74c3c;">🔴</span>')


@admin.register(CourseSchedule)
class CourseScheduleAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for CourseSchedule model."""

    select_related_fields = ['course', 'course__instructor']

    list_display = (
        'course', 'get_weekday_badge', 'get_time_range', 'get_duration'
    )
    list_filter = ('weekday', 'course__season', 'course')
    search_fields = ('course__name',)
    autocomplete_fields = ['course']
    list_per_page = 50
    ordering = ('weekday', 'start_time')

    @admin.display(description=_('اليوم'), ordering='weekday')
    def get_weekday_badge(self, obj):
        """Display weekday as a colored badge."""
        colors = {
            0: '#e74c3c',  # Saturday
            1: '#e67e22',  # Sunday
            2: '#f1c40f',  # Monday
            3: '#2ecc71',  # Tuesday
            4: '#3498db',  # Wednesday
            5: '#9b59b6',  # Thursday
            6: '#1abc9c',  # Friday
        }
        color = colors.get(obj.weekday, '#95a5a6')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; '
            'border-radius: 12px; font-size: 0.85em;">{}</span>',
            color, obj.get_weekday_display()
        )

    @admin.display(description=_('التوقيت'))
    def get_time_range(self, obj):
        """Display time range."""
        return format_html(
            '<span style="font-family: monospace;">{} - {}</span>',
            obj.start_time.strftime('%H:%M') if obj.start_time else '-',
            obj.end_time.strftime('%H:%M') if obj.end_time else '-'
        )

    @admin.display(description=_('المدة'))
    def get_duration(self, obj):
        """Calculate and display duration."""
        if obj.start_time and obj.end_time:
            from datetime import datetime, timedelta
            start = datetime.combine(datetime.today(), obj.start_time)
            end = datetime.combine(datetime.today(), obj.end_time)
            duration = end - start
            hours, remainder = divmod(duration.seconds, 3600)
            minutes = remainder // 60

            if hours > 0:
                return format_html(
                    '<span style="color: #7f8c8d;">{}س {}د</span>',
                    hours, minutes
                )
            return format_html(
                '<span style="color: #7f8c8d;">{}د</span>',
                minutes
            )
        return '-'


@admin.action(description=_('✅ تحديد كمكتملة'))
def mark_lectures_completed(modeladmin, request, queryset):
    """Mark selected lectures as completed."""
    updated = queryset.update(status='completed')
    modeladmin.message_user(
        request,
        _(f'تم تحديد {updated} محاضرة كمكتملة'),
        level='SUCCESS'
    )


@admin.action(description=_('❌ تحديد كملغاة'))
def mark_lectures_cancelled(modeladmin, request, queryset):
    """Mark selected lectures as cancelled."""
    updated = queryset.update(status='cancelled')
    modeladmin.message_user(
        request,
        _(f'تم تحديد {updated} محاضرة كملغاة'),
        level='WARNING'
    )


@admin.action(description=_('📋 إعادة جدولة للأسبوع القادم'))
def reschedule_next_week(modeladmin, request, queryset):
    """Reschedule selected lectures to next week."""
    for lecture in queryset:
        lecture.pk = None
        lecture.day = lecture.day + timedelta(days=7)
        lecture.status = 'scheduled'
        lecture.attendance_taken = False
        lecture.save()
    modeladmin.message_user(
        request,
        _(f'تم إعادة جدولة {queryset.count()} محاضرة للأسبوع القادم'),
        level='SUCCESS'
    )


@admin.register(Lecture)
class LectureAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for Lecture model with enhanced UX."""

    select_related_fields = [
        'course', 'course__season', 'instructor', 'instructor__user', 'course__instructor__user', 'course__instructor']

    list_display = (
        'get_lecture_title', 'get_course_link', 'get_lecture_number', 'get_day_display',
        'get_time_range', 'get_instructor_name', 'get_status_badge',
        'get_attendance_status'
    )
    list_filter = (
        'status', 'attendance_taken', LectureDateRangeFilter,
        'course__season', 'course', 'instructor'
    )
    search_fields = (
        'title', 'course__name',
        'instructor__user__first_name', 'instructor__user__last_name'
    )
    date_hierarchy = 'day'
    autocomplete_fields = ['course', 'instructor']
    list_per_page = 25
    ordering = ('-day', 'course', 'lecture_number')
    save_on_top = True
    actions = [mark_lectures_completed,
               mark_lectures_cancelled, reschedule_next_week]

    fieldsets = (
        (_('معلومات المحاضرة'), {
            'fields': ('title', 'course', 'lecture_number'),
            'description': _('المعلومات الأساسية للمحاضرة')
        }),
        (_('المدرس'), {
            'fields': ('instructor',),
            'description': _('يمكن ترك هذا الحقل فارغاً ليتم استخدام مدرس الدورة')
        }),
        (_('التوقيت'), {
            'fields': ('day', 'start_time', 'end_time'),
        }),
        (_('الحالة والحضور'), {
            'fields': ('status', 'attendance_taken'),
        }),
    )

    @admin.display(description=_('المحاضرة'))
    def get_lecture_title(self, obj):
        """Display lecture title with number."""
        return format_html(
            '<strong>#{}</strong> {}',
            obj.lecture_number, obj.title or '-'
        )

    def get_lecture_number(self, obj):
        """Display lecture number."""
        return obj.lecture_number
    get_lecture_number.short_description = _('رقم المحاضرة')
    get_lecture_number.admin_order_field = 'lecture_number'

    @admin.display(description=_('الدورة'), ordering='course__name')
    def get_course_link(self, obj):
        """Display course as a clickable link."""
        if obj.course:
            url = reverse('admin:courses_course_change', args=[obj.course.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '📚 {}</a>',
                url, obj.course.name
            )
        return '-'

    @admin.display(description=_('التاريخ'), ordering='day')
    def get_day_display(self, obj):
        """Display day with relative indicator."""
        today = timezone.now().date()
        day_diff = (obj.day - today).days

        date_str = obj.day.strftime('%Y/%m/%d (%A)')

        if day_diff == 0:
            return format_html(
                '<span style="color: #e67e22; font-weight: bold;">📍 اليوم</span><br>'
                '<small>{}</small>',
                date_str
            )
        elif day_diff == 1:
            return format_html(
                '<span style="color: #3498db;">غداً</span><br>'
                '<small>{}</small>',
                date_str
            )
        elif day_diff == -1:
            return format_html(
                '<span style="color: #95a5a6;">أمس</span><br>'
                '<small>{}</small>',
                date_str
            )
        elif day_diff < 0:
            return format_html(
                '<span style="color: #95a5a6;">{}</span>',
                date_str
            )
        else:
            return format_html(
                '<span style="color: #2ecc71;">{}</span>',
                date_str
            )

    @admin.display(description=_('التوقيت'))
    def get_time_range(self, obj):
        """Display time range."""
        if obj.start_time and obj.end_time:
            return format_html(
                '<span style="font-family: monospace; font-size: 0.9em;">'
                '{} - {}</span>',
                obj.start_time.strftime('%H:%M'),
                obj.end_time.strftime('%H:%M')
            )
        return '-'

    @admin.display(description=_('المدرس'), ordering='instructor__user__first_name')
    def get_instructor_name(self, obj):
        """Display instructor name."""
        instructor = obj.instructor or (
            obj.course.instructor if obj.course else None)
        if instructor:
            return format_html('👨‍🏫 {}', instructor)
        return '-'

    @admin.display(description=_('الحالة'), ordering='status')
    def get_status_badge(self, obj):
        """Display status as colored badge."""
        status_config = {
            'scheduled': ('📅', '#3498db', 'مجدولة'),
            'in_progress': ('▶️', '#f39c12', 'جارية'),
            'completed': ('✅', '#27ae60', 'مكتملة'),
            'cancelled': ('❌', '#e74c3c', 'ملغاة'),
        }

        icon, color, label = status_config.get(
            obj.status, ('❓', '#95a5a6', obj.get_status_display())
        )

        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; '
            'border-radius: 10px; font-size: 0.85em;">{} {}</span>',
            color, icon, label
        )

    @admin.display(description=_('الحضور'), boolean=True)
    def get_attendance_status(self, obj):
        """Display attendance status."""
        return obj.attendance_taken


@admin.register(Exam)
class ExamAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for Exam model."""

    select_related_fields = [
        'course', 'course__season', 'instructor', 'instructor__user']

    list_display = (
        'name', 'get_exam_type_badge', 'get_course_link',
        'get_instructor_name', 'get_scheduled_at', 'total_marks',
        'get_results_summary'
    )
    list_filter = ('exam_type', 'course__season',
                   'course', 'instructor', 'scheduled_at')
    search_fields = ('name', 'description', 'course__name',
                     'instructor__user__first_name')
    date_hierarchy = 'scheduled_at'
    autocomplete_fields = ['course', 'instructor']
    list_per_page = 25
    ordering = ('-scheduled_at',)
    save_on_top = True

    # Inline for exam results
    inlines = [ExamResultInline]

    fieldsets = (
        (_('معلومات الامتحان'), {
            'fields': ('name', 'exam_type', 'description'),
            'description': _('أدخل المعلومات الأساسية للامتحان')
        }),
        (_('الدورة والمدرس'), {
            'fields': ('course', 'instructor'),
        }),
        (_('التوقيت والدرجات'), {
            'fields': ('scheduled_at', 'total_marks'),
        }),
    )

    @admin.display(description=_('نوع الامتحان'), ordering='exam_type')
    def get_exam_type_badge(self, obj):
        """Display exam type as colored badge."""
        type_config = {
            'quiz': ('📝', '#9b59b6', 'اختبار قصير'),
            'midterm': ('📋', '#3498db', 'نصفي'),
            'final': ('📚', '#e74c3c', 'نهائي'),
            'practical': ('🔧', '#27ae60', 'عملي'),
        }

        icon, color, label = type_config.get(
            obj.exam_type, ('📄', '#95a5a6', obj.get_exam_type_display())
        )

        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; '
            'border-radius: 10px; font-size: 0.85em;">{} {}</span>',
            color, icon, label
        )

    @admin.display(description=_('الدورة'), ordering='course__name')
    def get_course_link(self, obj):
        """Display course as clickable link."""
        if obj.course:
            url = reverse('admin:courses_course_change', args=[obj.course.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9;">{}</a>',
                url, obj.course.name
            )
        return '-'

    @admin.display(description=_('المدرس'))
    def get_instructor_name(self, obj):
        """Display instructor name."""
        if obj.instructor:
            return format_html('👨‍🏫 {}', obj.instructor)
        return '-'

    @admin.display(description=_('الموعد'), ordering='scheduled_at')
    def get_scheduled_at(self, obj):
        """Display scheduled date with relative indicator."""
        if not obj.scheduled_at:
            return '-'

        today = timezone.now().date()
        exam_date = obj.scheduled_at.date() if hasattr(
            obj.scheduled_at, 'date') else obj.scheduled_at
        day_diff = (exam_date - today).days

        date_str = obj.scheduled_at.strftime('%Y/%m/%d %H:%M')

        if day_diff < 0:
            return format_html(
                '<span style="color: #95a5a6;">✓ {}</span>',
                date_str
            )
        elif day_diff == 0:
            return format_html(
                '<span style="color: #e67e22; font-weight: bold;">📍 اليوم - {}</span>',
                obj.scheduled_at.strftime('%H:%M')
            )
        elif day_diff <= 7:
            return format_html(
                '<span style="color: #e74c3c; font-weight: bold;">⏰ {}</span>',
                date_str
            )
        else:
            return format_html('<span>{}</span>', date_str)

    @admin.display(description=_('النتائج'))
    def get_results_summary(self, obj):
        """Display results summary."""
        results_count = getattr(obj, 'results_count', 0)
        if results_count > 0:
            avg = getattr(obj, 'results_avg', 0) or 0

            return format_html(
                '<span title="عدد النتائج: {}">'
                '<span style="background: #3498db; color: white; padding: 2px 6px; '
                'border-radius: 10px; margin-left: 5px;">{}</span>'
                '<span style="color: #27ae60; font-size: 0.9em;"> ~{:.0f}%</span>'
                '</span>',
                results_count, results_count, avg
            )
        return format_html('<span style="color: #bdc3c7;">لا توجد نتائج</span>')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            results_count=Count('results'),
            results_avg=Avg('results__percentage')
        )


class PassedFilter(admin.SimpleListFilter):
    """Filter for passed/failed exam results."""
    title = _('نتيجة الامتحان')
    parameter_name = 'result_status'

    def lookups(self, request, model_admin):
        return (
            ('passed', _('✅ ناجح')),
            ('failed', _('❌ راسب')),
            ('excellent', _('🌟 ممتاز (90%+)')),
            ('good', _('👍 جيد (70-89%)')),
            ('acceptable', _('👌 مقبول (50-69%)')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'passed':
            return queryset.filter(passed=True)
        if self.value() == 'failed':
            return queryset.filter(passed=False)
        if self.value() == 'excellent':
            return queryset.filter(percentage__gte=90)
        if self.value() == 'good':
            return queryset.filter(percentage__gte=70, percentage__lt=90)
        if self.value() == 'acceptable':
            return queryset.filter(percentage__gte=50, percentage__lt=70)
        return queryset


@admin.register(ExamResult)
class ExamResultAdmin(ArabicLabelsMixin, OptimizedQuerysetMixin, admin.ModelAdmin):
    """Admin configuration for ExamResult model with enhanced UX."""

    select_related_fields = [
        'exam', 'exam__course', 'student', 'student__user',
        'child', 'entered_by'
    ]

    list_display = (
        'get_exam_info', 'get_participant_display', 'get_marks_display',
        'get_percentage_bar', 'get_passed_status', 'get_entered_info'
    )
    list_filter = (
        PassedFilter, 'exam__course__season', 'exam__course',
        'exam', 'entered_at'
    )
    search_fields = (
        'exam__name', 'exam__course__name',
        'student__user__first_name', 'student__user__last_name',
        'child__first_name', 'child__last_name', 'notes'
    )
    date_hierarchy = 'entered_at'
    readonly_fields = ('percentage', 'passed', 'created_at', 'updated_at')
    autocomplete_fields = ['exam', 'student', 'entered_by']
    raw_id_fields = ['child']
    list_per_page = 25
    ordering = ('-entered_at',)
    save_on_top = True

    fieldsets = (
        (_('معلومات النتيجة'), {
            'fields': ('exam', 'student', 'child'),
            'description': _('حدد الامتحان والطالب أو الطفل')
        }),
        (_('الدرجات'), {
            'fields': ('marks_obtained', 'percentage', 'passed'),
            'description': _('أدخل الدرجة المحصلة وسيتم حساب النسبة تلقائياً')
        }),
        (_('ملاحظات وتسجيل'), {
            'fields': ('notes', 'entered_by', 'entered_at'),
        }),
        (_('معلومات النظام'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description=_('الامتحان'))
    def get_exam_info(self, obj):
        """Display exam info with course."""
        if obj.exam:
            url = reverse('admin:courses_exam_change', args=[obj.exam.pk])
            return format_html(
                '<a href="{}" style="color: #2980b9; text-decoration: none;">'
                '<strong>{}</strong></a><br>'
                '<small style="color: #7f8c8d;">{}</small>',
                url, obj.exam.name,
                obj.exam.course.name if obj.exam.course else '-'
            )
        return '-'

    @admin.display(description=_('الطالب/الطفل'))
    def get_participant_display(self, obj):
        """Display participant with type indicator."""
        if obj.student:
            return format_html(
                '<span style="color: #2980b9;">👤 {}</span>',
                obj.student
            )
        elif obj.child:
            return format_html(
                '<span style="color: #9b59b6;">👶 {}</span>',
                obj.child
            )
        return '-'

    @admin.display(description=_('الدرجة'), ordering='marks_obtained')
    def get_marks_display(self, obj):
        """Display marks obtained vs total."""
        if obj.marks_obtained is not None and obj.exam:
            return format_html(
                '<span style="font-family: monospace; font-size: 1.1em;">'
                '<strong>{}</strong> / {}</span>',
                obj.marks_obtained, obj.exam.total_marks
            )
        return '-'

    @admin.display(description=_('النسبة'), ordering='percentage')
    def get_percentage_bar(self, obj):
        """Display percentage as visual bar."""
        if obj.percentage is not None:
            # Determine color based on percentage
            if obj.percentage >= 90:
                color = '#27ae60'  # Green - Excellent
                grade = 'ممتاز'
            elif obj.percentage >= 80:
                color = '#2ecc71'  # Light green - Very good
                grade = 'جيد جداً'
            elif obj.percentage >= 70:
                color = '#3498db'  # Blue - Good
                grade = 'جيد'
            elif obj.percentage >= 60:
                color = '#f39c12'  # Orange - Acceptable
                grade = 'مقبول'
            elif obj.percentage >= 50:
                color = '#e67e22'  # Dark orange - Pass
                grade = 'نجاح'
            else:
                color = '#e74c3c'  # Red - Fail
                grade = 'رسوب'

            return format_html(
                '<div style="width: 80px; background: #ecf0f1; border-radius: 4px; '
                'overflow: hidden;" title="{}">'
                '<div style="width: {}%; background: {}; padding: 2px 0; '
                'text-align: center; color: white; font-size: 0.8em; font-weight: bold;">'
                '{:.0f}%</div></div>',
                grade, min(obj.percentage, 100), color, obj.percentage
            )
        return '-'

    @admin.display(description=_('النتيجة'), boolean=True, ordering='passed')
    def get_passed_status(self, obj):
        """Display pass/fail status."""
        return obj.passed

    @admin.display(description=_('تم الإدخال'))
    def get_entered_info(self, obj):
        """Display who entered and when."""
        entered_by = obj.entered_by.get_full_name() if obj.entered_by else '-'
        entered_at = obj.entered_at.strftime(
            '%m/%d %H:%M') if obj.entered_at else '-'

        return format_html(
            '<small style="color: #7f8c8d;">{}<br>{}</small>',
            entered_by, entered_at
        )

    def save_model(self, request, obj, form, change):
        """Auto-set entered_by to current user if not set."""
        if not obj.entered_by:
            obj.entered_by = request.user
        super().save_model(request, obj, form, change)

    def get_readonly_fields(self, request, obj=None):
        """Make some fields readonly after creation."""
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['exam', 'student', 'child'])
        return readonly


# =============================================================================
# Admin Dashboard Customization
# =============================================================================
class CoursesAdminSite(admin.AdminSite):
    """
    Custom admin site for Courses management.
    Can be used for a dedicated courses admin interface.
    """
    site_header = _('إدارة الدورات - مركز الرضوان')
    site_title = _('إدارة الدورات')
    index_title = _('لوحة إدارة الدورات')

    def index(self, request, extra_context=None):
        """Add custom statistics to the admin index."""
        from enrollments_payments.models.enrollment import Enrollment
        extra_context = extra_context or {}

        # Add quick statistics
        extra_context['active_courses'] = Course.objects.filter(
            is_active=True).count()
        extra_context['total_students'] = Enrollment.objects.filter(
            status='active'
        ).count()
        extra_context['upcoming_lectures'] = Lecture.objects.filter(
            day__gte=timezone.now().date(),
            status='scheduled'
        ).count()

        return super().index(request, extra_context=extra_context)


# =============================================================================
# Register additional admin customizations
# =============================================================================

# Quick search across all models
admin.site.enable_nav_sidebar = True

# Ensure proper ordering in admin sidebar
Season._meta.verbose_name = _('موسم')
Season._meta.verbose_name_plural = _('المواسم')
Tag._meta.verbose_name = _('وسم')
Tag._meta.verbose_name_plural = _('الوسوم')
Course._meta.verbose_name = _('دورة')
Course._meta.verbose_name_plural = _('الدورات')
CourseSchedule._meta.verbose_name = _('جدول دورة')
CourseSchedule._meta.verbose_name_plural = _('جداول الدورات')
Lecture._meta.verbose_name = _('محاضرة')
Lecture._meta.verbose_name_plural = _('المحاضرات')
Exam._meta.verbose_name = _('امتحان')
Exam._meta.verbose_name_plural = _('الامتحانات')
ExamResult._meta.verbose_name = _('نتيجة امتحان')
ExamResult._meta.verbose_name_plural = _('نتائج الامتحانات')
