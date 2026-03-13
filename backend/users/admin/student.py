from django.contrib import admin
from django.contrib import messages
from django.http import HttpResponse

from core.utils import ExcelExportMixin
from ..models.student import StudentUser
from ..utils.card_generator import generate_students_pdf


@admin.register(StudentUser)
class StudentUserAdmin(ExcelExportMixin, admin.ModelAdmin):
    list_display = ('action_checkbox', 'unique_code', 'get_full_name',
                    'get_phone', 'get_gender', 'image')
    list_filter = ('user__gender', 'user__is_verified')
    search_fields = ('unique_code', 'user__first_name',
                     'user__last_name', 'user__phone_number1')
    readonly_fields = ('unique_code',)
    list_select_related = ('user',)
    
    # Excel export configuration
    excel_filename = 'students'
    
    fieldsets = (
        ('معلومات الطالب', {'fields': ('user', 'image')}),
    )
    autocomplete_fields = ('user',)
    list_select_related = ('user',)
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'unique_code' in form.base_fields:
            form.base_fields['unique_code'].label = 'الكود الفريد'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        return form

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'

    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'

    def get_gender(self, obj):
        return obj.user.get_gender_display()
    get_gender.short_description = 'النوع'

    # Actions
    actions = ['export_students_info',
               'download_id_cards_pdf',
               'download_single_card_image']

    @admin.action(description="📋 تصدير معلومات الطلاب المحددين")
    def export_students_info(self, request, queryset):
        """Export basic info about selected students."""
        count = queryset.count()
        self.message_user(
            request,
            f"تم تحديد {count} طالب. (يمكن تنفيذ التصدير لاحقاً)",
            messages.INFO
        )

    @admin.action(description="🖼️ تحميل صورة بطاقة واحدة")
    def download_single_card_image(self, request, queryset):
        """Download card image for a single selected student."""
        if queryset.count() != 1:
            self.message_user(
                request, "يرجى تحديد طالب واحد فقط", messages.WARNING)
            return

        student = queryset.first()

        try:
            # Generate card image buffer
            image_buffer = student.generate_card_image_buffer()

            # Create response
            response = HttpResponse(
                image_buffer.getvalue(),
                content_type='image/png'
            )

            # Set filename
            filename = f"بطاقة_{student.user.first_name}_{student.unique_code}.png"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            self.message_user(
                request,
                f"✓ تم تحميل بطاقة {student.user.first_name} بنجاح",
                messages.SUCCESS
            )

            return response

        except Exception as e:
            self.message_user(
                request,
                f"⚠ حدث خطأ أثناء إنشاء البطاقة: {str(e)}",
                messages.ERROR
            )

    @admin.action(description="🪪 تحميل بطاقات الهوية (PDF)")
    def download_id_cards_pdf(self, request, queryset):
        """Download ID cards for selected students as PDF."""
        students = list(queryset.select_related('user'))

        if not students:
            self.message_user(
                request, "لم يتم تحديد أي طلاب", messages.WARNING)
            return

        try:
            # Generate PDF with all selected students
            pdf_buffer = generate_students_pdf(students)

            # Create response
            response = HttpResponse(
                pdf_buffer.getvalue(),
                content_type='application/pdf'
            )

            # Set filename
            if len(students) == 1:
                filename = f"بطاقة_{students[0].user.first_name}_{students[0].unique_code}.pdf"
            else:
                filename = f"بطاقات_الطلاب_{len(students)}.pdf"

            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            self.message_user(
                request,
                f"✓ تم تحميل بطاقات {len(students)} طالب بنجاح",
                messages.SUCCESS
            )

            return response

        except Exception as e:
            self.message_user(
                request,
                f"⚠ حدث خطأ أثناء إنشاء البطاقات: {str(e)}",
                messages.ERROR
            )
