from django.apps import AppConfig


class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'courses'
    verbose_name = "الدورات التعليمية"

    def ready(self):
        """Import signals when the app is ready."""
        import courses.signals  # noqa: F401
