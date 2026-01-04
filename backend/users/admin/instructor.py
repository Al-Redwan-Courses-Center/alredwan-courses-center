from django.contrib import admin
from ..models.instructor import Instructor, InstructorAttendance
@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_type', 'get_monthly_salary', 'get_phone', 'get_joined_date')
    list_filter = ('type', 'joined_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__phone_number1')
    
    fieldsets = (
        ('معلومات المدرس', {'fields': ('user', 'type', 'bio', 'monthly_salary')}),
        ('الصور', {'fields': ('image', 'nid_front', 'nid_back')}),
    )
    
    def get_type(self, obj):
        return obj.get_type_display()
    get_type.short_description = 'النوع'
    get_type.admin_order_field = 'type'

    def get_monthly_salary(self, obj):
        return obj.monthly_salary
    get_monthly_salary.short_description = 'الراتب الشهري'
    get_monthly_salary.admin_order_field = 'monthly_salary'

    def get_joined_date(self, obj):
        return obj.joined_date
    get_joined_date.short_description = 'تاريخ الانضمام'
    get_joined_date.admin_order_field = 'joined_date'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'type' in form.base_fields:
            form.base_fields['type'].label = 'النوع'
        if 'bio' in form.base_fields:
            form.base_fields['bio'].label = 'السيرة الذاتية'
        if 'monthly_salary' in form.base_fields:
            form.base_fields['monthly_salary'].label = 'الراتب الشهري'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        if 'nid_front' in form.base_fields:
            form.base_fields['nid_front'].label = 'صورة الهوية (أمامي)'
        if 'nid_back' in form.base_fields:
            form.base_fields['nid_back'].label = 'صورة الهوية (خلفي)'
        if 'joined_date' in form.base_fields:
            form.base_fields['joined_date'].label = 'تاريخ الانضمام'
        return form
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'



@admin.register(InstructorAttendance)
class InstructorAttendanceAdmin(admin.ModelAdmin):
    list_display = ('get_instructor', 'get_date', 'get_status', 'get_check_in_time', 'get_check_out_time', 'get_rating', 'get_rated_by')
    list_filter = ('status', 'date', 'season', 'check_in_method')
    search_fields = ('instructor__user__first_name', 'instructor__user__last_name')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('معلومات الحضور', {'fields': ('instructor', 'date', 'season', 'status')}),
        ('التوقيت', {'fields': ('check_in_time', 'check_out_time', 'check_in_method', 'check_in_device')}),
        ('المحاضرة والجدول', {'fields': ('lecture', 'schedule')}),
        ('التقييم', {'fields': ('rating', 'rated_by', 'notes')}),
    )

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_date(self, obj):
        return obj.date
    get_date.short_description = 'التاريخ'
    get_date.admin_order_field = 'date'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_check_in_time(self, obj):
        return obj.check_in_time
    get_check_in_time.short_description = 'وقت الحضور'
    get_check_in_time.admin_order_field = 'check_in_time'

    def get_check_out_time(self, obj):
        return obj.check_out_time
    get_check_out_time.short_description = 'وقت المغادرة'
    get_check_out_time.admin_order_field = 'check_out_time'

    def get_rating(self, obj):
        return obj.rating
    get_rating.short_description = 'التقييم'
    get_rating.admin_order_field = 'rating'

    def get_rated_by(self, obj):
        return obj.rated_by
    get_rated_by.short_description = 'تم التقييم بواسطة'
    get_rated_by.admin_order_field = 'rated_by'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'date' in form.base_fields:
            form.base_fields['date'].label = 'التاريخ'
        if 'season' in form.base_fields:
            form.base_fields['season'].label = 'الموسم'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'check_in_time' in form.base_fields:
            form.base_fields['check_in_time'].label = 'وقت الحضور'
        if 'check_out_time' in form.base_fields:
            form.base_fields['check_out_time'].label = 'وقت المغادرة'
        if 'check_in_method' in form.base_fields:
            form.base_fields['check_in_method'].label = 'طريقة التسجيل'
        if 'check_in_device' in form.base_fields:
            form.base_fields['check_in_device'].label = 'جهاز التسجيل'
        if 'lecture' in form.base_fields:
            form.base_fields['lecture'].label = 'المحاضرة'
        if 'schedule' in form.base_fields:
            form.base_fields['schedule'].label = 'الجدول'
        if 'rating' in form.base_fields:
            form.base_fields['rating'].label = 'التقييم'
        if 'rated_by' in form.base_fields:
            form.base_fields['rated_by'].label = 'تم التقييم بواسطة'
        if 'notes' in form.base_fields:
            form.base_fields['notes'].label = 'ملاحظات'
        return form
