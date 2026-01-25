from django.apps import AppConfig


class EnrollmentsPaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'enrollments_payments'
    verbose_name = 'الإلتحاقات والمدفوعات'

    def ready(self):
        """Import signals when the app is ready."""
        import enrollments_payments.signals
