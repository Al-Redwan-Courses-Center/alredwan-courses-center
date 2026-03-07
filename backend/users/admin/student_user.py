from django.contrib import admin
from .models import StudentUser
from .mixins import ExcelExportMixin

@admin.register(StudentUser)
class StudentUserAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('action_checkbox', 'unique_code', 'get_full_name',
                    'get_phone', 'get_gender', 'image')
    # ...existing code...