from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import AttendanceDevice, LectureAttendance, StudentInstructorRating, ParentInstructorRating


@admin.register(AttendanceDevice)
class AttendanceDeviceAdmin(admin.ModelAdmin):
    list_display = ('get_device_id', 'get_name', 'get_location', 'get_is_active')
    list_filter = ('is_active',)
    search_fields = ('device_id', 'name', 'location')
    
    fieldsets = (
        ('معلومات الجهاز', {'fields': ('device_id', 'name', 'location', 'is_active')}),
    )

    def get_device_id(self, obj):
        return obj.device_id
    get_device_id.short_description = 'معرف الجهاز'
    get_device_id.admin_order_field = 'device_id'

    def get_name(self, obj):
        return obj.name
    get_name.short_description = 'الاسم'
    get_name.admin_order_field = 'name'

    def get_location(self, obj):
        return obj.location
    get_location.short_description = 'الموقع'
    get_location.admin_order_field = 'location'

    def get_is_active(self, obj):
        return obj.is_active
    get_is_active.short_description = 'نشط'
    get_is_active.admin_order_field = 'is_active'
    get_is_active.boolean = True

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'device_id' in form.base_fields:
            form.base_fields['device_id'].label = 'معرف الجهاز'
        if 'name' in form.base_fields:
            form.base_fields['name'].label = 'الاسم'
        if 'location' in form.base_fields:
            form.base_fields['location'].label = 'الموقع'
        if 'is_active' in form.base_fields:
            form.base_fields['is_active'].label = 'نشط'
        return form

    class Meta:
        verbose_name = 'جهاز حضور'
        verbose_name_plural = 'أجهزة الحضور'


@admin.register(LectureAttendance)
class LectureAttendanceAdmin(admin.ModelAdmin):
    list_display = ('get_lecture', 'get_participant', 'get_present', 'get_rating', 'get_marked_by', 'get_marked_at')
    list_filter = ('present', 'lecture__course', 'marked_at')
    search_fields = ('lecture__title', 'student__user__first_name', 'child__first_name', 'notes')
    date_hierarchy = 'marked_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات الحضور', {'fields': ('lecture', 'student', 'child')}),
        ('الحالة والتقييم', {'fields': ('present', 'rating', 'notes')}),
        ('معلومات التسجيل', {'fields': ('marked_by', 'marked_at')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_lecture(self, obj):
        return obj.lecture
    get_lecture.short_description = 'المحاضرة'
    get_lecture.admin_order_field = 'lecture'

    def get_present(self, obj):
        return obj.present
    get_present.short_description = 'حاضر'
    get_present.admin_order_field = 'present'
    get_present.boolean = True

    def get_rating(self, obj):
        return obj.rating
    get_rating.short_description = 'التقييم'
    get_rating.admin_order_field = 'rating'

    def get_marked_by(self, obj):
        return obj.marked_by
    get_marked_by.short_description = 'تم التسجيل بواسطة'
    get_marked_by.admin_order_field = 'marked_by'

    def get_marked_at(self, obj):
        return obj.marked_at
    get_marked_at.short_description = 'تاريخ التسجيل'
    get_marked_at.admin_order_field = 'marked_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'lecture' in form.base_fields:
            form.base_fields['lecture'].label = 'المحاضرة'
        if 'student' in form.base_fields:
            form.base_fields['student'].label = 'الطالب'
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'present' in form.base_fields:
            form.base_fields['present'].label = 'حاضر'
        if 'rating' in form.base_fields:
            form.base_fields['rating'].label = 'التقييم'
        if 'notes' in form.base_fields:
            form.base_fields['notes'].label = 'ملاحظات'
        if 'marked_by' in form.base_fields:
            form.base_fields['marked_by'].label = 'تم التسجيل بواسطة'
        if 'marked_at' in form.base_fields:
            form.base_fields['marked_at'].label = 'تاريخ التسجيل'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form
    
    def get_participant(self, obj):
        if obj.child:
            return f"{obj.child.first_name} {obj.child.last_name}"
        elif obj.student:
            return obj.student.user.get_full_name()
        return 'غير محدد'
    get_participant.short_description = 'الطالب/الطفل'

    class Meta:
        verbose_name = 'حضور محاضرة'
        verbose_name_plural = 'حضور المحاضرات'


@admin.register(StudentInstructorRating)
class StudentInstructorRatingAdmin(admin.ModelAdmin):
    list_display = ('get_student', 'get_instructor', 'get_course', 'get_rating', 'get_created_at')
    list_filter = ('rating', 'course', 'instructor', 'created_at')
    search_fields = ('student__user__first_name', 'instructor__user__first_name', 'feedback')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات التقييم', {'fields': ('student', 'instructor', 'course')}),
        ('التقييم', {'fields': ('rating', 'feedback')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )

    def get_student(self, obj):
        return obj.student
    get_student.short_description = 'الطالب'
    get_student.admin_order_field = 'student'

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_rating(self, obj):
        return obj.rating
    get_rating.short_description = 'التقييم'
    get_rating.admin_order_field = 'rating'

    def get_created_at(self, obj):
        return obj.created_at
    get_created_at.short_description = 'تاريخ الإنشاء'
    get_created_at.admin_order_field = 'created_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'student' in form.base_fields:
            form.base_fields['student'].label = 'الطالب'
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'rating' in form.base_fields:
            form.base_fields['rating'].label = 'التقييم'
        if 'feedback' in form.base_fields:
            form.base_fields['feedback'].label = 'الملاحظات'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    class Meta:
        verbose_name = 'تقييم طالب لمدرس'
        verbose_name_plural = 'تقييمات الطلاب للمدرسين'


@admin.register(ParentInstructorRating)
class ParentInstructorRatingAdmin(admin.ModelAdmin):
    list_display = ('get_parent', 'get_instructor', 'get_course', 'get_rating', 'get_created_at')
    list_filter = ('rating', 'course', 'instructor', 'created_at')
    search_fields = ('parent__user__first_name', 'instructor__user__first_name', 'feedback')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات التقييم', {'fields': ('parent', 'instructor', 'course')}),
        ('التقييم', {'fields': ('rating', 'feedback')}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )

    def get_parent(self, obj):
        return obj.parent
    get_parent.short_description = 'ولي الأمر'
    get_parent.admin_order_field = 'parent'

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_course(self, obj):
        return obj.course
    get_course.short_description = 'الدورة'
    get_course.admin_order_field = 'course'

    def get_rating(self, obj):
        return obj.rating
    get_rating.short_description = 'التقييم'
    get_rating.admin_order_field = 'rating'

    def get_created_at(self, obj):
        return obj.created_at
    get_created_at.short_description = 'تاريخ الإنشاء'
    get_created_at.admin_order_field = 'created_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'parent' in form.base_fields:
            form.base_fields['parent'].label = 'ولي الأمر'
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'course' in form.base_fields:
            form.base_fields['course'].label = 'الدورة'
        if 'rating' in form.base_fields:
            form.base_fields['rating'].label = 'التقييم'
        if 'feedback' in form.base_fields:
            form.base_fields['feedback'].label = 'الملاحظات'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form

    class Meta:
        verbose_name = 'تقييم ولي أمر لمدرس'
        verbose_name_plural = 'تقييمات أولياء الأمور للمدرسين'
