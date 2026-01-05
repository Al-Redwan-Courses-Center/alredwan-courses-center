#!/usr/bin/env python3
'''Models for logging Attendance related cron jobs'''
from django.db import models


class AttendanceCronLog(models.Model):
    job_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.job_name} at {self.timestamp}"

    class Meta:
        verbose_name = 'سجل إنشاء مهام حضور'
        verbose_name_plural = 'سجلات مهام إنشاء الحضور الأوتوماتيكية'
        ordering = ['-timestamp']
