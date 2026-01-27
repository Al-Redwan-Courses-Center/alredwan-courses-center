#!/usr/bin/env python3
'''Models for Landing Page featured courses and instructors'''
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class LandingPageCourse(models.Model):
    """
    Landing Page Featured Course model
    Controls which courses appear on the landing page and their display order
    """
    course = models.OneToOneField(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='landing_page_feature',
        verbose_name=_("الكورس")
    )
    order = models.IntegerField(
        default=0,
        help_text=_("الترتيب في صفحة الهبوط (الأرقام الأعلى تظهر أولاً)")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("تاريخ الإضافة")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("تاريخ التحديث")
    )

    class Meta:
        ordering = ['-order', '-created_at']
        verbose_name = _("كورس مميز في الصفحة الرئيسية")
        verbose_name_plural = _("الكورسات المميزة في الصفحة الرئيسية")
        indexes = [
            models.Index(fields=['-order', '-created_at'], name='landing_course_order_idx'),
        ]

    def clean(self):
        """Validate the landing page course"""
        if self.course and not self.course.is_active:
            raise ValidationError(
                _("لا يمكن إضافة كورس غير نشط إلى الصفحة الرئيسية")
            )

    def __str__(self):
        return f"{self.order} - {self.course.name}"
