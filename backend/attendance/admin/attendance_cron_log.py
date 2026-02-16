from django.contrib import admin
from core.utils import ExcelExportMixin
from attendance.models.attendance_cron_log import AttendanceCronLog


@admin.register(AttendanceCronLog)
class AttendanceCronLogAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ["job_name", "timestamp", "details"]
    list_filter = ["job_name", "timestamp"]
    search_fields = ["job_name", "details"]
    date_hierarchy = "timestamp"
    readonly_fields = ["job_name", "timestamp", "details"]
    
    # Excel export configuration
    excel_filename = 'attendance_cron_logs'
