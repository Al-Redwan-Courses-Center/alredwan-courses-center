from django.contrib import admin
from attendance.models.attendance_cron_log import AttendanceCronLog


@admin.register(AttendanceCronLog)
class AttendanceCronLogAdmin(admin.ModelAdmin):
    list_display = ["job_name", "timestamp", "details"]
    list_filter = ["job_name", "timestamp"]
    search_fields = ["job_name", "details"]
    date_hierarchy = "timestamp"
    readonly_fields = ["job_name", "timestamp", "details"]
