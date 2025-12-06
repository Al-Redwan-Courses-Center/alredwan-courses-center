#!/usr/bin/env python3
'''Attendance Devices related Models'''
from django.db import models


class AttendanceDeviceTypes(models.TextChoices):
    '''Enumeration for Attendance Device Types'''
    RFID = 'rfid', 'RFID'
    BIOMETRIC = 'biometric', 'Biometric'
    QR_CODE = 'qr_code', 'QR Code'
    MOBILE_APP = 'mobile_app', 'Mobile App'
    FINGER_PRINT = 'finger_print', 'Finger Print'


class AttendanceDevice(models.Model):
    device_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name or self.device_id
