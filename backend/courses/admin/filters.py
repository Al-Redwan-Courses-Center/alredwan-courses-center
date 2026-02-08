#!/usr/bin/env python3
"""
Custom filters for courses admin.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.db import models
from django.utils import timezone
from datetime import timedelta


class ActiveStatusFilter(admin.SimpleListFilter):
    """Filter for active/inactive status with visual indicators."""
    title = _('حالة النشاط')
    parameter_name = 'active_status'

    def lookups(self, request, model_admin):
        return (
            ('active', _('🟢 نشط')),
            ('inactive', _('🔴 غير نشط')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(is_active=True)
        if self.value() == 'inactive':
            return queryset.filter(is_active=False)
        return queryset


class CapacityStatusFilter(admin.SimpleListFilter):
    """Filter courses by capacity utilization."""
    title = _('حالة السعة')
    parameter_name = 'capacity_status'

    def lookups(self, request, model_admin):
        return (
            ('full', _('🔴 ممتلئ')),
            ('almost_full', _('🟡 شبه ممتلئ (>80%)')),
            ('available', _('🟢 متاح')),
            ('empty', _('⚪ فارغ')),
        )

    def queryset(self, request, queryset):
        # Use _enrolled_count annotation
        if self.value() == 'full':
            return queryset.filter(_enrolled_count__gte=models.F('capacity'))
        if self.value() == 'almost_full':
            return queryset.filter(
                _enrolled_count__gte=models.F('capacity') * 0.8,
                _enrolled_count__lt=models.F('capacity')
            )
        if self.value() == 'available':
            return queryset.filter(
                _enrolled_count__lt=models.F('capacity') * 0.8,
                _enrolled_count__gt=0
            )
        if self.value() == 'empty':
            return queryset.filter(_enrolled_count=0)
        return queryset


class DateRangeFilter(admin.SimpleListFilter):
    """Filter by date range with common presets."""
    title = _('الفترة الزمنية')
    parameter_name = 'date_range'
    date_field = 'start_date'

    def lookups(self, request, model_admin):
        return (
            ('today', _('اليوم')),
            ('this_week', _('هذا الأسبوع')),
            ('this_month', _('هذا الشهر')),
            ('next_week', _('الأسبوع القادم')),
            ('past', _('منتهي')),
            ('upcoming', _('قادم')),
        )

    def queryset(self, request, queryset):
        today = timezone.now().date()

        if self.value() == 'today':
            return queryset.filter(**{self.date_field: today})
        if self.value() == 'this_week':
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            return queryset.filter(**{
                f'{self.date_field}__gte': start_of_week,
                f'{self.date_field}__lte': end_of_week
            })
        if self.value() == 'this_month':
            return queryset.filter(**{
                f'{self.date_field}__year': today.year,
                f'{self.date_field}__month': today.month
            })
        if self.value() == 'next_week':
            start_of_next_week = today + timedelta(days=(7 - today.weekday()))
            end_of_next_week = start_of_next_week + timedelta(days=6)
            return queryset.filter(**{
                f'{self.date_field}__gte': start_of_next_week,
                f'{self.date_field}__lte': end_of_next_week
            })
        if self.value() == 'past':
            return queryset.filter(**{f'{self.date_field}__lt': today})
        if self.value() == 'upcoming':
            return queryset.filter(**{f'{self.date_field}__gte': today})
        return queryset


class LectureDateRangeFilter(DateRangeFilter):
    """Date range filter for lectures using 'day' field."""
    date_field = 'day'


class PassedFilter(admin.SimpleListFilter):
    """Filter for passed/failed exam results."""
    title = _('نتيجة الامتحان')
    parameter_name = 'result_status'

    def lookups(self, request, model_admin):
        return (
            ('passed', _('✅ ناجح')),
            ('failed', _('❌ راسب')),
            ('excellent', _('🌟 ممتاز (90%+)')),
            ('good', _('👍 جيد (70-89%)')),
            ('acceptable', _('👌 مقبول (50-69%)')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'passed':
            return queryset.filter(passed=True)
        if self.value() == 'failed':
            return queryset.filter(passed=False)
        if self.value() == 'excellent':
            return queryset.filter(percentage__gte=90)
        if self.value() == 'good':
            return queryset.filter(percentage__gte=70, percentage__lt=90)
        if self.value() == 'acceptable':
            return queryset.filter(percentage__gte=50, percentage__lt=70)
        return queryset
