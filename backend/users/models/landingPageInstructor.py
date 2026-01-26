#!/usr/bin/env python3
'''Models for Landing Page featured courses and instructors'''
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class LandingPageInstructor(models.Model):
    """
    Landing Page Featured Instructor model
    Controls which instructors appear on the landing page and their display order
    """
    instructor = models.OneToOneField(
        'users.Instructor',
        on_delete=models.CASCADE,
        related_name='landing_page_feature',
        verbose_name=_("المعلم")
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
        verbose_name = _("معلم مميز في الصفحة الرئيسية")
        verbose_name_plural = _("المعلمون المميزون في الصفحة الرئيسية")
        indexes = [
            models.Index(fields=['-order', '-created_at'], name='landing_instructor_order_idx'),
        ]

    def __str__(self):
        return f"{self.order} - {self.instructor.user.get_full_name()}"
