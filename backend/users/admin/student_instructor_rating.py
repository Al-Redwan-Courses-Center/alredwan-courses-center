from django.contrib import admin
from users.models.student_instructor_rating import StudentInstructorRating, ParentInstructorRating


@admin.register(StudentInstructorRating)
class StudentInstructorRatingAdmin(admin.ModelAdmin):
    list_display = ('get_student', 'get_instructor',
                    'get_course', 'get_rating', 'get_created_at')
    list_filter = ('rating', 'course', 'instructor', 'created_at')
    search_fields = ('student__user__first_name',
                     'instructor__user__first_name', 'feedback')
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
    list_display = ('get_parent', 'get_instructor',
                    'get_course', 'get_rating', 'get_created_at')
    list_filter = ('rating', 'course', 'instructor', 'created_at')
    search_fields = ('parent__user__first_name',
                     'instructor__user__first_name', 'feedback')
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
