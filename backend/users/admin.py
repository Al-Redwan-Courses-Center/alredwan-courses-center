from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models.user import CustomUser

@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    list_display = ('get_full_name_display', 'get_phone_number1', 'get_role', 'get_gender', 'get_date_joined', 'get_is_verified', 'get_is_active')
    list_filter = ('role', 'is_verified', 'is_active', 'gender', 'identity_type', 'date_joined')
    search_fields = ('phone_number1', 'phone_number2', 'first_name', 'last_name', 'email', 'identity_number')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('phone_number1', 'password')}),
        ('المعلومات الشخصية', {'fields': ('first_name', 'last_name', 'email', 'phone_number2', 'dob', 'gender', 'identity_number', 'identity_type', 'address', 'location')}),
        ('الصلاحيات', {'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser', 'role', 'groups', 'user_permissions')}),
        ('التواريخ المهمة', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number1', 'password1', 'password2', 'first_name', 'last_name', 'dob', 'gender'),
        }),
    )
    
    def get_full_name_display(self, obj):
        return obj.get_full_name() or obj.phone_number1
    get_full_name_display.short_description = 'الاسم الكامل'
    get_full_name_display.admin_order_field = 'first_name'

    def get_date_joined(self, obj):
        return obj.date_joined
    get_date_joined.short_description = 'تاريخ الانضمام'
    get_date_joined.admin_order_field = 'date_joined'
    def get_phone_number1(self, obj):
        return obj.phone_number1
    get_phone_number1.short_description = 'رقم الهاتف'
    get_phone_number1.admin_order_field = 'phone_number1'

    def get_role(self, obj):
        return obj.get_role_display()
    get_role.short_description = 'الدور'
    get_role.admin_order_field = 'role'

    def get_gender(self, obj):
        return obj.get_gender_display()
    get_gender.short_description = 'النوع'
    get_gender.admin_order_field = 'gender'

    def get_is_verified(self, obj):
        return obj.is_verified
    get_is_verified.short_description = 'تم التحقق'
    get_is_verified.admin_order_field = 'is_verified'
    get_is_verified.boolean = True

    def get_is_active(self, obj):
        return obj.is_active
    get_is_active.short_description = 'نشط'
    get_is_active.admin_order_field = 'is_active'
    get_is_active.boolean = True

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['phone_number1'].label = 'رقم الهاتف (واتساب)'
        form.base_fields['phone_number2'].label = 'رقم هاتف بديل'
        if 'email' in form.base_fields:
            form.base_fields['email'].label = 'البريد الإلكتروني'
        if 'first_name' in form.base_fields:
            form.base_fields['first_name'].label = 'الاسم الأول والثاني'
        if 'last_name' in form.base_fields:
            form.base_fields['last_name'].label = 'الاسم الثالث والرابع'
        if 'dob' in form.base_fields:
            form.base_fields['dob'].label = 'تاريخ الميلاد'
        if 'gender' in form.base_fields:
            form.base_fields['gender'].label = 'النوع'
        if 'identity_number' in form.base_fields:
            form.base_fields['identity_number'].label = 'رقم الهوية / الجواز'
        if 'identity_type' in form.base_fields:
            form.base_fields['identity_type'].label = 'نوع الهوية'
        if 'address' in form.base_fields:
            form.base_fields['address'].label = 'العنوان'
        if 'location' in form.base_fields:
            form.base_fields['location'].label = 'الموقع'
        if 'role' in form.base_fields:
            form.base_fields['role'].label = 'الدور'
        if 'is_verified' in form.base_fields:
            form.base_fields['is_verified'].label = 'تم التحقق'
        if 'is_active' in form.base_fields:
            form.base_fields['is_active'].label = 'نشط'
        if 'is_staff' in form.base_fields:
            form.base_fields['is_staff'].label = 'موظف'
        if 'is_superuser' in form.base_fields:
            form.base_fields['is_superuser'].label = 'مدير عام'
        if 'groups' in form.base_fields:
            form.base_fields['groups'].label = 'المجموعات'
        if 'user_permissions' in form.base_fields:
            form.base_fields['user_permissions'].label = 'الصلاحيات'
        if 'date_joined' in form.base_fields:
            form.base_fields['date_joined'].label = 'تاريخ الانضمام'
        if 'last_login' in form.base_fields:
            form.base_fields['last_login'].label = 'آخر تسجيل دخول'
        if 'password' in form.base_fields:
            form.base_fields['password'].label = 'كلمة المرور'
        return form
