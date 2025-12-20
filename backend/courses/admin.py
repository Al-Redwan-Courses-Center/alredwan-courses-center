from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Season, Tag, Course, CourseSchedule, Lecture, Exam, ExamResult


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'season_type', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('season_type', 'is_active', 'start_date')
    search_fields = ('name', 'description')
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('معلومات الموسم', {'fields': ('name', 'season_type', 'description')}),
        ('التواريخ', {'fields': ('start_date', 'end_date', 'is_active')}),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'name' in form.base_fields:
            form.base_fields['name'].label = 'الاسم'
        if 'season_type' in form.base_fields:
            form.base_fields['season_type'].label = 'نوع الموسم'
        if 'description' in form.base_fields:
            form.base_fields['description'].label = 'الوصف'
        if 'start_date' in form.base_fields:
            form.base_fields['start_date'].label = 'تاريخ البداية'
        if 'end_date' in form.base_fields:
            form.base_fields['end_date'].label = 'تاريخ النهاية'
        if 'is_active' in form.base_fields:
            form.base_fields['is_active'].label = 'نشط'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    class Meta:
        verbose_name = 'موسم'
        verbose_name_plural = 'المواسم'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'name' in form.base_fields:
            form.base_fields['name'].label = 'الاسم'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        return form

    class Meta:
        verbose_name = 'وسم'
        verbose_name_plural = 'الوسوم'


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'get_instructor', 'get_season', 'get_start_date', 'get_end_date', 'get_capacity', 'get_enrolled_count', 'get_price', 'get_is_active')
    list_filter = ('is_active', 'season', 'instructor', 'for_adults', 'start_date')
    search_fields = ('name', 'description', 'slug')
    date_hierarchy = 'start_date'
    filter_horizontal = ('tags',)
    
    fieldsets = (
        ('معلومات الدورة', {'fields': ('name', 'description', 'instructor', 'season')}),
        ('التواريخ والمحاضرات', {'fields': ('start_date', 'end_date', 'num_lectures')}),
        ('السعة والسعر', {'fields': ('capacity', 'enrolled_count', 'price')}),
        ('الفئة العمرية', {'fields': ('for_adults', 'min_age', 'max_age')}),
        ('إعدادات إضافية', {'fields': ('tags', 'slug', 'is_active')}),
    )

    def get_name(self, obj):
        return obj.name
    get_name.short_description = 'الاسم'
    get_name.admin_order_field = 'name'

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_season(self, obj):
        return obj.season
    get_season.short_description = 'الموسم'
    get_season.admin_order_field = 'season'

    def get_start_date(self, obj):
        return obj.start_date
    get_start_date.short_description = 'تاريخ البداية'
    get_start_date.admin_order_field = 'start_date'

    def get_end_date(self, obj):
        return obj.end_date
    get_end_date.short_description = 'تاريخ النهاية'
    get_end_date.admin_order_field = 'end_date'

    def get_capacity(self, obj):
        return obj.capacity
    get_capacity.short_description = 'السعة'
    get_capacity.admin_order_field = 'capacity'

    def get_enrolled_count(self, obj):
        return obj.enrolled_count
    get_enrolled_count.short_description = 'عدد المسجلين'
    get_enrolled_count.admin_order_field = 'enrolled_count'

    def get_price(self, obj):
        return obj.price
    get_price.short_description = 'السعر'
    get_price.admin_order_field = 'price'

    def get_is_active(self, obj):
        return obj.is_active
    get_is_active.short_description = 'نشط'
    get_is_active.admin_order_field = 'is_active'
    get_is_active.boolean = True

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'name' in form.base_fields:
            form.base_fields['name'].label = 'الاسم'
        if 'description' in form.base_fields:
            form.base_fields['description'].label = 'الوصف'
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'season' in form.base_fields:
            form.base_fields['season'].label = 'الموسم'
        if 'start_date' in form.base_fields:
            form.base_fields['start_date'].label = 'تاريخ البداية'
        if 'end_date' in form.base_fields:
            form.base_fields['end_date'].label = 'تاريخ النهاية'
        if 'num_lectures' in form.base_fields:
            form.base_fields['num_lectures'].label = 'عدد المحاضرات'
        if 'capacity' in form.base_fields:
            form.base_fields['capacity'].label = 'السعة'
        if 'enrolled_count' in form.base_fields:
            form.base_fields['enrolled_count'].label = 'عدد المسجلين'
        if 'price' in form.base_fields:
            form.base_fields['price'].label = 'السعر'
        if 'for_adults' in form.base_fields:
            form.base_fields['for_adults'].label = 'للبالغين'
        if 'min_age' in form.base_fields:
            form.base_fields['min_age'].label = 'الحد الأدنى للعمر'
        if 'max_age' in form.base_fields:
            form.base_fields['max_age'].label = 'الحد الأقصى للعمر'
        if 'tags' in form.base_fields:
            form.base_fields['tags'].label = 'الوسوم'
        if 'slug' in form.base_fields:
            form.base_fields['slug'].label = 'الرابط المختصر'
        if 'is_active' in form.base_fields:
            form.base_fields['is_active'].label = 'نشط'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    class Meta:
        verbose_name = 'دورة'
        verbose_name_plural = 'الدورات'


@admin.register(CourseSchedule)
class CourseScheduleAdmin(admin.ModelAdmin):
    list_display = ('get_course', 'get_weekday', 'get_start_time', 'get_end_time')
    list_filter = ('weekday', 'course')
    search_fields = ('course__name',)
    
    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_start_time(self, obj):
        return obj.start_time
    get_start_time.short_description = 'وقت البداية'
    get_start_time.admin_order_field = 'start_time'

    def get_end_time(self, obj):
        return obj.end_time
    get_end_time.short_description = 'وقت النهاية'
    get_end_time.admin_order_field = 'end_time'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'weekday' in form.base_fields:
            form.base_fields['weekday'].label = 'اليوم'
        if 'start_time' in form.base_fields:
            form.base_fields['start_time'].label = 'وقت البداية'
        if 'end_time' in form.base_fields:
            form.base_fields['end_time'].label = 'وقت النهاية'
        return form
    
    def get_weekday(self, obj):
        return obj.get_weekday_display()
    get_weekday.short_description = 'اليوم'

    class Meta:
        verbose_name = 'جدول دورة'
        verbose_name_plural = 'جداول الدورات'


@admin.register(Lecture)
class LectureAdmin(admin.ModelAdmin):
    list_display = ('get_title', 'get_course', 'get_lecture_number', 'get_day', 'get_start_time', 'get_end_time', 'get_instructor', 'get_status', 'get_attendance_taken')
    list_filter = ('status', 'attendance_taken', 'day', 'course', 'instructor')
    search_fields = ('title', 'course__name', 'instructor__user__first_name')
    date_hierarchy = 'day'
    
    fieldsets = (
        ('معلومات المحاضرة', {'fields': ('title', 'course', 'lecture_number', 'instructor')}),
        ('التوقيت', {'fields': ('day', 'start_time', 'end_time')}),
        ('الحالة', {'fields': ('status', 'attendance_taken')}),
    )

    def get_title(self, obj):
        return obj.title
    get_title.short_description = 'العنوان'
    get_title.admin_order_field = 'title'

    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_lecture_number(self, obj):
        return obj.lecture_number
    get_lecture_number.short_description = 'رقم المحاضرة'
    get_lecture_number.admin_order_field = 'lecture_number'

    def get_day(self, obj):
        return obj.day
    get_day.short_description = 'اليوم'
    get_day.admin_order_field = 'day'

    def get_start_time(self, obj):
        return obj.start_time
    get_start_time.short_description = 'وقت البداية'
    get_start_time.admin_order_field = 'start_time'

    def get_end_time(self, obj):
        return obj.end_time
    get_end_time.short_description = 'وقت النهاية'
    get_end_time.admin_order_field = 'end_time'

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_attendance_taken(self, obj):
        return obj.attendance_taken
    get_attendance_taken.short_description = 'تم أخذ الحضور'
    get_attendance_taken.admin_order_field = 'attendance_taken'
    get_attendance_taken.boolean = True

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'title' in form.base_fields:
            form.base_fields['title'].label = 'العنوان'
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'lecture_number' in form.base_fields:
            form.base_fields['lecture_number'].label = 'رقم المحاضرة'
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'day' in form.base_fields:
            form.base_fields['day'].label = 'اليوم'
        if 'start_time' in form.base_fields:
            form.base_fields['start_time'].label = 'وقت البداية'
        if 'end_time' in form.base_fields:
            form.base_fields['end_time'].label = 'وقت النهاية'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'attendance_taken' in form.base_fields:
            form.base_fields['attendance_taken'].label = 'تم أخذ الحضور'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    class Meta:
        verbose_name = 'محاضرة'
        verbose_name_plural = 'المحاضرات'


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'get_exam_type', 'get_course', 'get_instructor', 'get_scheduled_at', 'get_total_marks')
    list_filter = ('exam_type', 'course', 'instructor', 'scheduled_at')
    search_fields = ('name', 'description', 'course__name')
    date_hierarchy = 'scheduled_at'
    
    fieldsets = (
        ('معلومات الامتحان', {'fields': ('name', 'exam_type', 'description')}),
        ('الدورة والمدرس', {'fields': ('course', 'instructor')}),
        ('التوقيت والدرجات', {'fields': ('scheduled_at', 'total_marks')}),
    )

    def get_name(self, obj):
        return obj.name
    get_name.short_description = 'الاسم'
    get_name.admin_order_field = 'name'

    def get_exam_type(self, obj):
        return obj.get_exam_type_display()
    get_exam_type.short_description = 'نوع الامتحان'
    get_exam_type.admin_order_field = 'exam_type'

    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_scheduled_at(self, obj):
        return obj.scheduled_at
    get_scheduled_at.short_description = 'موعد الامتحان'
    get_scheduled_at.admin_order_field = 'scheduled_at'

    def get_total_marks(self, obj):
        return obj.total_marks
    get_total_marks.short_description = 'مجموع الدرجات'
    get_total_marks.admin_order_field = 'total_marks'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'name' in form.base_fields:
            form.base_fields['name'].label = 'الاسم'
        if 'exam_type' in form.base_fields:
            form.base_fields['exam_type'].label = 'نوع الامتحان'
        if 'description' in form.base_fields:
            form.base_fields['description'].label = 'الوصف'
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'scheduled_at' in form.base_fields:
            form.base_fields['scheduled_at'].label = 'موعد الامتحان'
        if 'total_marks' in form.base_fields:
            form.base_fields['total_marks'].label = 'مجموع الدرجات'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    class Meta:
        verbose_name = 'امتحان'
        verbose_name_plural = 'الامتحانات'


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('get_exam', 'get_participant', 'get_marks_obtained', 'get_percentage', 'get_passed', 'get_entered_by', 'get_entered_at')
    list_filter = ('passed', 'exam', 'entered_at')
    search_fields = ('exam__name', 'student__user__first_name', 'child__first_name', 'notes')
    date_hierarchy = 'entered_at'
    readonly_fields = ('percentage', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات النتيجة', {'fields': ('exam', 'student', 'child')}),
        ('الدرجات', {'fields': ('marks_obtained', 'percentage', 'passed')}),
        ('ملاحظات', {'fields': ('notes', 'entered_by', 'entered_at')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_exam(self, obj):
        return obj.exam
    get_exam.short_description = 'الامتحان'
    get_exam.admin_order_field = 'exam'

    def get_marks_obtained(self, obj):
        return obj.marks_obtained
    get_marks_obtained.short_description = 'الدرجة المحصلة'
    get_marks_obtained.admin_order_field = 'marks_obtained'

    def get_percentage(self, obj):
        return obj.percentage
    get_percentage.short_description = 'النسبة المئوية'
    get_percentage.admin_order_field = 'percentage'

    def get_passed(self, obj):
        return obj.passed
    get_passed.short_description = 'نجح'
    get_passed.admin_order_field = 'passed'
    get_passed.boolean = True

    def get_entered_by(self, obj):
        return obj.entered_by
    get_entered_by.short_description = 'تم الإدخال بواسطة'
    get_entered_by.admin_order_field = 'entered_by'

    def get_entered_at(self, obj):
        return obj.entered_at
    get_entered_at.short_description = 'تاريخ الإدخال'
    get_entered_at.admin_order_field = 'entered_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'exam' in form.base_fields:
            form.base_fields['exam'].label = 'الامتحان'
        if 'student' in form.base_fields:
            form.base_fields['student'].label = 'الطالب'
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'marks_obtained' in form.base_fields:
            form.base_fields['marks_obtained'].label = 'الدرجة المحصلة'
        if 'percentage' in form.base_fields:
            form.base_fields['percentage'].label = 'النسبة المئوية'
        if 'passed' in form.base_fields:
            form.base_fields['passed'].label = 'نجح'
        if 'notes' in form.base_fields:
            form.base_fields['notes'].label = 'ملاحظات'
        if 'entered_by' in form.base_fields:
            form.base_fields['entered_by'].label = 'تم الإدخال بواسطة'
        if 'entered_at' in form.base_fields:
            form.base_fields['entered_at'].label = 'تاريخ الإدخال'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form
    
    def get_participant(self, obj):
        return obj.student or obj.child
    get_participant.short_description = 'الطالب/الطفل'

    class Meta:
        verbose_name = 'نتيجة امتحان'
        verbose_name_plural = 'نتائج الامتحانات'
