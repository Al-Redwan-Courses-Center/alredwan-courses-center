from django.contrib import admin
from ..models.instructor import Instructor


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_type',
                    'get_monthly_salary', 'get_phone', 'get_joined_date')
    list_filter = ('type', 'joined_date')
    search_fields = ('user__first_name', 'user__last_name',
                     'user__phone_number1')

    fieldsets = (
        ('معلومات المدرس', {
         'fields': ('user', 'type', 'bio', 'monthly_salary')}),
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
