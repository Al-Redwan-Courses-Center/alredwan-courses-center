
from django.contrib import admin
from ..models.student import StudentUser
@admin.register(StudentUser)
class StudentUserAdmin(admin.ModelAdmin):
    list_display = ('unique_code', 'get_full_name', 'get_phone', 'get_gender', 'image')
    list_filter = ('user__gender', 'user__is_verified')
    search_fields = ('unique_code', 'user__first_name', 'user__last_name', 'user__phone_number1')
    readonly_fields = ('unique_code',)
    
    fieldsets = (
        ('معلومات الطالب', {'fields': ('user', 'unique_code', 'image')}),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'unique_code' in form.base_fields:
            form.base_fields['unique_code'].label = 'الكود الفريد'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        return form
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'
    
    def get_gender(self, obj):
        return obj.user.get_gender_display()
    get_gender.short_description = 'النوع'
