from django.contrib import admin
from ..models.parent import Parent, Child, ChildParents, ParentLinkRequest
@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_phone', 'get_email', 'image')
    search_fields = ('user__first_name', 'user__last_name', 'user__phone_number1', 'user__email')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        return form
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'البريد الإلكتروني'


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ('get_unique_code', 'get_first_name', 'get_last_name', 'get_gender', 'get_dob', 'get_primary_parent', 'get_phone')
    list_filter = ('gender', 'created_at')
    search_fields = ('unique_code', 'first_name', 'last_name', 'phone')
    readonly_fields = ('unique_code', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات الطفل', {'fields': ('primary_parent', 'first_name', 'last_name', 'gender', 'dob')}),
        ('معلومات التواصل', {'fields': ('phone', 'unique_code')}),
        ('الصورة', {'fields': ('image',)}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )

    def get_unique_code(self, obj):
        return obj.unique_code
    get_unique_code.short_description = 'الكود الفريد'
    get_unique_code.admin_order_field = 'unique_code'

    def get_first_name(self, obj):
        return obj.first_name
    get_first_name.short_description = 'الاسم الأول'
    get_first_name.admin_order_field = 'first_name'

    def get_last_name(self, obj):
        return obj.last_name
    get_last_name.short_description = 'اسم العائلة'
    get_last_name.admin_order_field = 'last_name'

    def get_gender(self, obj):
        return obj.get_gender_display()
    get_gender.short_description = 'النوع'
    get_gender.admin_order_field = 'gender'

    def get_dob(self, obj):
        return obj.dob
    get_dob.short_description = 'تاريخ الميلاد'
    get_dob.admin_order_field = 'dob'

    def get_primary_parent(self, obj):
        return obj.primary_parent
    get_primary_parent.short_description = 'ولي الأمر الرئيسي'
    get_primary_parent.admin_order_field = 'primary_parent'

    def get_phone(self, obj):
        return obj.phone
    get_phone.short_description = 'رقم الهاتف'
    get_phone.admin_order_field = 'phone'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'primary_parent' in form.base_fields:
            form.base_fields['primary_parent'].label = 'ولي الأمر الرئيسي'
        if 'first_name' in form.base_fields:
            form.base_fields['first_name'].label = 'الاسم الأول'
        if 'last_name' in form.base_fields:
            form.base_fields['last_name'].label = 'اسم العائلة'
        if 'gender' in form.base_fields:
            form.base_fields['gender'].label = 'النوع'
        if 'dob' in form.base_fields:
            form.base_fields['dob'].label = 'تاريخ الميلاد'
        if 'phone' in form.base_fields:
            form.base_fields['phone'].label = 'رقم الهاتف'
        if 'unique_code' in form.base_fields:
            form.base_fields['unique_code'].label = 'الكود الفريد'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form


@admin.register(ChildParents)
class ChildParentsAdmin(admin.ModelAdmin):
    list_display = ('get_child', 'get_parent')
    search_fields = ('child__first_name', 'child__last_name', 'parent__user__first_name')

    def get_child(self, obj):
        return obj.child
    get_child.short_description = 'الطفل'
    get_child.admin_order_field = 'child'

    def get_parent(self, obj):
        return obj.parent
    get_parent.short_description = 'ولي الأمر'
    get_parent.admin_order_field = 'parent'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'parent' in form.base_fields:
            form.base_fields['parent'].label = 'ولي الأمر'
        return form


@admin.register(ParentLinkRequest)
class ParentLinkRequestAdmin(admin.ModelAdmin):
    list_display = ('get_child', 'get_requester', 'get_primary_parent', 'get_status', 'get_created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('child__first_name', 'requester__user__first_name', 'primary_parent__user__first_name')
    readonly_fields = ('created_at', 'updated_at')

    def get_child(self, obj):
        return obj.child
    get_child.short_description = 'الطفل'
    get_child.admin_order_field = 'child'

    def get_requester(self, obj):
        return obj.requester
    get_requester.short_description = 'مقدم الطلب'
    get_requester.admin_order_field = 'requester'

    def get_primary_parent(self, obj):
        return obj.primary_parent
    get_primary_parent.short_description = 'ولي الأمر الرئيسي'
    get_primary_parent.admin_order_field = 'primary_parent'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_created_at(self, obj):
        return obj.created_at
    get_created_at.short_description = 'تاريخ الإنشاء'
    get_created_at.admin_order_field = 'created_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'requester' in form.base_fields:
            form.base_fields['requester'].label = 'مقدم الطلب'
        if 'primary_parent' in form.base_fields:
            form.base_fields['primary_parent'].label = 'ولي الأمر الرئيسي'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form
