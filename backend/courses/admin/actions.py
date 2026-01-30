#!/usr/bin/env python3
"""
Admin actions for courses app.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from datetime import timedelta


@admin.action(description=_('✅ تفعيل العناصر المحددة'))
def activate_selected(modeladmin, request, queryset):
    """Activate selected items."""
    updated = queryset.update(is_active=True)
    modeladmin.message_user(
        request,
        _(f'تم تفعيل {updated} عنصر بنجاح'),
        level='SUCCESS'
    )


@admin.action(description=_('❌ إلغاء تفعيل العناصر المحددة'))
def deactivate_selected(modeladmin, request, queryset):
    """Deactivate selected items."""
    updated = queryset.update(is_active=False)
    modeladmin.message_user(
        request,
        _(f'تم إلغاء تفعيل {updated} عنصر بنجاح'),
        level='WARNING'
    )


@admin.action(description=_('📋 نسخ العناصر المحددة'))
def duplicate_selected(modeladmin, request, queryset):
    """Duplicate selected items."""
    for obj in queryset:
        obj.pk = None
        obj.name = f'{obj.name} (نسخة)'
        if hasattr(obj, 'slug'):
            obj.slug = f'{obj.slug}-copy'
        obj.save()
    modeladmin.message_user(
        request,
        _(f'تم نسخ {queryset.count()} عنصر بنجاح'),
        level='SUCCESS'
    )


@admin.action(description=_('✅ تحديد كمكتملة'))
def mark_lectures_completed(modeladmin, request, queryset):
    """Mark selected lectures as completed."""
    updated = queryset.update(status='completed')
    modeladmin.message_user(
        request,
        _(f'تم تحديد {updated} محاضرة كمكتملة'),
        level='SUCCESS'
    )


@admin.action(description=_('❌ تحديد كملغاة'))
def mark_lectures_cancelled(modeladmin, request, queryset):
    """Mark selected lectures as cancelled."""
    updated = queryset.update(status='cancelled')
    modeladmin.message_user(
        request,
        _(f'تم تحديد {updated} محاضرة كملغاة'),
        level='WARNING'
    )


@admin.action(description=_('📋 إعادة جدولة للأسبوع القادم'))
def reschedule_next_week(modeladmin, request, queryset):
    """Reschedule selected lectures to next week."""
    for lecture in queryset:
        lecture.pk = None
        lecture.day = lecture.day + timedelta(days=7)
        lecture.status = 'scheduled'
        lecture.attendance_taken = False
        lecture.save()
    modeladmin.message_user(
        request,
        _(f'تم إعادة جدولة {queryset.count()} محاضرة للأسبوع القادم'),
        level='SUCCESS'
    )
