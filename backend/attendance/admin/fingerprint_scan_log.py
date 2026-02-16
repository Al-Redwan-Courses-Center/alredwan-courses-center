#!/usr/bin/env python3
"""Admin configuration for FingerprintScanLog model."""

from django.contrib import admin
from django.utils.html import format_html
from core.utils import ExcelExportMixin
from ..models.fingerprint_scan_log import FingerprintScanLog, ScanAction


@admin.register(FingerprintScanLog)
class FingerprintScanLogAdmin(ExcelExportMixin, admin.ModelAdmin):
    """Admin interface for viewing fingerprint scan logs."""
    
    list_display = (
        'get_instructor_name',
        'scan_time',
        'get_action_display',
        'get_device_name',
        'is_processed',
        'notes_preview',
    )
    list_filter = ('action', 'is_processed', 'device', 'scan_time')
    search_fields = (
        'instructor__user__first_name',
        'instructor__user__last_name',
        'instructor__user__phone_number1',
        'notes',
    )
    date_hierarchy = 'scan_time'
    ordering = ['-scan_time']
    readonly_fields = (
        'instructor',
        'attendance',
        'scan_time',
        'received_time',
        'device',
        'action',
        'is_processed',
        'device_sequence',
    )
    
    fieldsets = (
        ('معلومات البصمة', {
            'fields': ('instructor', 'attendance', 'device')
        }),
        ('التوقيت', {
            'fields': ('scan_time', 'received_time')
        }),
        ('الإجراء', {
            'fields': ('action', 'is_processed', 'notes')
        }),
        ('معلومات المزامنة', {
            'fields': ('device_sequence',),
            'classes': ('collapse',),
        }),
    )
    
    def has_add_permission(self, request):
        """Disable adding records manually - they're created by the system."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow changing notes only."""
        return True
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup purposes."""
        return request.user.is_superuser
    
    def get_instructor_name(self, obj):
        """Get the full name of the instructor."""
        return obj.instructor.user.get_full_name()
    get_instructor_name.short_description = 'المعلم'
    get_instructor_name.admin_order_field = 'instructor__user__first_name'
    
    def get_action_display(self, obj):
        """Display action with color coding."""
        colors = {
            ScanAction.CHECK_IN: '#4CAF50',      # Green
            ScanAction.CHECK_OUT: '#2196F3',     # Blue
            ScanAction.RE_ENTRY: '#FF9800',      # Orange
            ScanAction.IGNORED: '#9E9E9E',       # Gray
            ScanAction.AUTO_CREATED: '#9C27B0',  # Purple
        }
        color = colors.get(obj.action, '#000000')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_action_display()
        )
    get_action_display.short_description = 'الإجراء'
    get_action_display.admin_order_field = 'action'
    
    def get_device_name(self, obj):
        """Get the device name."""
        return obj.device.name if obj.device else '-'
    get_device_name.short_description = 'الجهاز'
    get_device_name.admin_order_field = 'device__name'
    
    def notes_preview(self, obj):
        """Show a preview of notes."""
        if obj.notes:
            return obj.notes[:50] + '...' if len(obj.notes) > 50 else obj.notes
        return '-'
    notes_preview.short_description = 'ملاحظات'
    
    # Excel export configuration
    excel_filename = 'fingerprint_scan_logs'
