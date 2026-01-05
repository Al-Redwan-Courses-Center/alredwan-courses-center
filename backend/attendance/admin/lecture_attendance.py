from django.contrib import admin
from attendance.models.lecture_attendance import LectureAttendance


@admin.register(LectureAttendance)
class LectureAttendanceAdmin(admin.ModelAdmin):
    list_display = ('get_lecture', 'get_participant', 'get_present',
                    'get_rating', 'get_marked_by', 'get_marked_at')
    list_filter = ('present', 'lecture__course', 'marked_at')
    search_fields = ('lecture__title', 'student__user__first_name',
                     'child__first_name', 'notes')
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
