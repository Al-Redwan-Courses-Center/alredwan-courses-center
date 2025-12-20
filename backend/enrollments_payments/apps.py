from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class EnrollmentsPaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'enrollments_payments'
    verbose_name = _('التسجيل والمدفوعات')
