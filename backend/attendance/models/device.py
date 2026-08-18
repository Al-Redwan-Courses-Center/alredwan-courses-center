#!/usr/bin/env python3
'''Attendance Devices related Models'''
from django.db import models
from django.utils.translation import gettext_lazy as _


class AttendanceDeviceTypes(models.TextChoices):
    '''Enumeration for Attendance Device Types'''
    RFID = 'rfid', 'RFID'
    BIOMETRIC = 'biometric', 'جهاز بيومتري'
    QR_CODE = 'qr_code', 'رمز الاستجابة السريعة'
    MOBILE_APP = 'mobile_app', 'تطبيق الهاتف المحمول'
    FINGER_PRINT = 'finger_print', 'جهاز بصمة الإصبع'


class AttendanceDevice(models.Model):
    device_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name or self.device_id

    class Meta:
        verbose_name = 'جهاز حضور'
        verbose_name_plural = 'أجهزة الحضور'
