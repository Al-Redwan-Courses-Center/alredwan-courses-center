from django.contrib import admin
from attendance.models.device import AttendanceDevice


@admin.register(AttendanceDevice)
class AttendanceDeviceAdmin(admin.ModelAdmin):
    list_display = ('get_device_id', 'get_name',
                    'get_location', 'get_is_active')
    list_filter = ('is_active',)
    search_fields = ('device_id', 'name', 'location')

    fieldsets = (
        ('معلومات الجهاز', {
         'fields': ('device_id', 'name', 'location', 'is_active')}),
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
