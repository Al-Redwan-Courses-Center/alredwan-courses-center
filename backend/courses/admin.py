from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Season, Tag, Course, CourseSchedule, Lecture, Exam, ExamResult


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
    'enrolled_count': 'عدد المسجلين',
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


def apply_arabic_labels(form):
    """Apply Arabic labels to form fields."""
    for field_name, label in ARABIC_FIELD_LABELS.items():
        if field_name in form.base_fields:
            form.base_fields[field_name].label = label
    return form


@admin.action(description=_('تفعيل العناصر المحددة'))
def activate_selected(modeladmin, request, queryset):
    queryset.update(is_active=True)


@admin.action(description=_('إلغاء تفعيل العناصر المحددة'))
def deactivate_selected(modeladmin, request, queryset):
    queryset.update(is_active=False)


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'season_type', 'start_date',
                    'end_date', 'is_active', 'created_at')
    list_filter = ('season_type', 'is_active', 'start_date')
    search_fields = ('name', 'description')
    date_hierarchy = 'start_date'
    list_editable = ('is_active',)
    list_per_page = 25
    actions = [activate_selected, deactivate_selected]

    fieldsets = (
        ('معلومات الموسم', {'fields': ('name', 'season_type', 'description')}),
        ('التواريخ', {'fields': ('start_date', 'end_date', 'is_active')}),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    list_per_page = 50

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'instructor', 'season', 'start_date',
                    'end_date', 'capacity', 'enrolled_count', 'price', 'is_active')
    list_filter = ('is_active', 'season', 'instructor',
                   'for_adults', 'start_date')
    search_fields = ('name', 'description', 'slug',
                     'instructor__user__first_name', 'instructor__user__last_name')
    date_hierarchy = 'start_date'
    filter_horizontal = ('tags',)
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['instructor', 'season']
    list_editable = ('is_active',)
    list_per_page = 25
    actions = [activate_selected, deactivate_selected]

    fieldsets = (
        ('معلومات الدورة', {
         'fields': ('name', 'description', 'instructor', 'season')}),
        ('التواريخ والمحاضرات', {
         'fields': ('start_date', 'end_date', 'num_lectures')}),
        ('السعة والسعر', {'fields': ('capacity', 'enrolled_count', 'price')}),
        ('الفئة العمرية', {'fields': ('for_adults', 'min_age', 'max_age')}),
        ('إعدادات إضافية', {'fields': ('tags', 'slug', 'is_active')}),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


@admin.register(CourseSchedule)
class CourseScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'get_weekday', 'start_time', 'end_time')
    list_filter = ('weekday', 'course')
    search_fields = ('course__name',)
    autocomplete_fields = ['course']
    list_per_page = 50

    @admin.display(description='اليوم', ordering='weekday')
    def get_weekday(self, obj):
        return obj.get_weekday_display()

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


@admin.action(description=_('تحديد كمكتملة'))
def mark_lectures_completed(modeladmin, request, queryset):
    queryset.update(status='completed')


@admin.action(description=_('تحديد كملغاة'))
def mark_lectures_cancelled(modeladmin, request, queryset):
    queryset.update(status='cancelled')


@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'lecture_number', 'day', 'start_time',
                    'end_time', 'instructor', 'get_status', 'attendance_taken')
    list_filter = ('status', 'attendance_taken', 'day', 'course', 'instructor')
    search_fields = ('title', 'course__name',
                     'instructor__user__first_name', 'instructor__user__last_name')
    date_hierarchy = 'day'
    autocomplete_fields = ['course', 'instructor']
    list_editable = ('attendance_taken',)
    list_per_page = 25
    actions = [mark_lectures_completed, mark_lectures_cancelled]

    fieldsets = (
        ('معلومات المحاضرة', {
         'fields': ('title', 'course', 'lecture_number', 'instructor')}),
        ('التوقيت', {'fields': ('day', 'start_time', 'end_time')}),
        ('الحالة', {'fields': ('status', 'attendance_taken')}),
    )

    @admin.display(description='الحالة', ordering='status')
    def get_status(self, obj):
        return obj.get_status_display()

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_exam_type', 'course',
                    'instructor', 'scheduled_at', 'total_marks')
    list_filter = ('exam_type', 'course', 'instructor', 'scheduled_at')
    search_fields = ('name', 'description', 'course__name',
                     'instructor__user__first_name')
    date_hierarchy = 'scheduled_at'
    autocomplete_fields = ['course', 'instructor']
    list_per_page = 25

    fieldsets = (
        ('معلومات الامتحان', {'fields': ('name', 'exam_type', 'description')}),
        ('الدورة والمدرس', {'fields': ('course', 'instructor')}),
        ('التوقيت والدرجات', {'fields': ('scheduled_at', 'total_marks')}),
    )

    @admin.display(description='نوع الامتحان', ordering='exam_type')
    def get_exam_type(self, obj):
        return obj.get_exam_type_display()

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('exam', 'get_participant', 'marks_obtained',
                    'percentage', 'passed', 'entered_by', 'entered_at')
    list_filter = ('passed', 'exam', 'exam__course', 'entered_at')
    search_fields = ('exam__name', 'exam__course__name',
                     'student__user__first_name', 'child__first_name', 'notes')
    date_hierarchy = 'entered_at'
    readonly_fields = ('percentage', 'passed', 'created_at', 'updated_at')
    autocomplete_fields = ['exam', 'student', 'entered_by']
    # Use raw_id_fields instead of autocomplete for string-referenced model
    raw_id_fields = ['child']
    list_per_page = 25

    fieldsets = (
        ('معلومات النتيجة', {'fields': ('exam', 'student', 'child')}),
        ('الدرجات', {'fields': ('marks_obtained', 'percentage', 'passed')}),
        ('ملاحظات', {'fields': ('notes', 'entered_by', 'entered_at')}),
        ('التواريخ', {'fields': ('created_at',
         'updated_at'), 'classes': ('collapse',)}),
    )

    @admin.display(description='الطالب/الطفل')
    def get_participant(self, obj):
        return obj.student or obj.child

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        return apply_arabic_labels(form)

    def save_model(self, request, obj, form, change):
        """Auto-set entered_by to current user if not set."""
        if not obj.entered_by:
            obj.entered_by = request.user
        super().save_model(request, obj, form, change)
