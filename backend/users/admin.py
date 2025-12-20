from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, StudentUser, Instructor, InstructorAttendance, SupervisorSchedule, Parent, Child, ChildParents, ParentLinkRequest


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('phone_number1', 'first_name', 'last_name', 'email', 'role', 'is_verified', 'is_active')
    list_filter = ('role', 'is_verified', 'is_active', 'gender', 'identity_type')
    search_fields = ('phone_number1', 'phone_number2', 'first_name', 'last_name', 'email', 'identity_number')
    ordering = ('-date_joined',)
    
    fieldsets = (
        ('معلومات أساسية', {'fields': ('phone_number1', 'phone_number2', 'email', 'password')}),
        ('المعلومات الشخصية', {'fields': ('first_name', 'last_name', 'dob', 'gender')}),
        ('معلومات الهوية', {'fields': ('identity_number', 'identity_type')}),
        ('العنوان والموقع', {'fields': ('address', 'location')}),
        ('الأذونات', {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('تواريخ مهمة', {'fields': ('date_joined', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number1', 'password1', 'password2', 'first_name', 'last_name', 'dob', 'role'),
        }),
    )


@admin.register(StudentUser)
class StudentUserAdmin(admin.ModelAdmin):
    list_display = ('unique_code', 'get_full_name', 'get_phone', 'get_gender', 'image')
    list_filter = ('user__gender', 'user__is_verified')
    search_fields = ('unique_code', 'user__first_name', 'user__last_name', 'user__phone_number1')
    readonly_fields = ('unique_code',)
    
    fieldsets = (
        ('معلومات الطالب', {'fields': ('user', 'unique_code', 'image')}),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'
    
    def get_gender(self, obj):
        return obj.user.get_gender_display()
    get_gender.short_description = 'النوع'


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'type', 'monthly_salary', 'get_phone', 'joined_date')
    list_filter = ('type', 'joined_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__phone_number1')
    
    fieldsets = (
        ('معلومات المدرس', {'fields': ('user', 'type', 'bio', 'monthly_salary')}),
        ('الصور', {'fields': ('image', 'nid_front', 'nid_back')}),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'


@admin.register(SupervisorSchedule)
class SupervisorScheduleAdmin(admin.ModelAdmin):
    list_display = ('instructor', 'get_day', 'start_time', 'end_time', 'grace_period_minutes', 'auto_absent_after_minutes')
    list_filter = ('day_of_week', 'instructor')
    search_fields = ('instructor__user__first_name', 'instructor__user__last_name')
    
    def get_day(self, obj):
        return obj.get_day_of_week_display()
    get_day.short_description = 'اليوم'


@admin.register(InstructorAttendance)
class InstructorAttendanceAdmin(admin.ModelAdmin):
    list_display = ('instructor', 'date', 'status', 'check_in_time', 'check_out_time', 'rating', 'rated_by')
    list_filter = ('status', 'date', 'season', 'check_in_method')
    search_fields = ('instructor__user__first_name', 'instructor__user__last_name')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('معلومات الحضور', {'fields': ('instructor', 'date', 'season', 'status')}),
        ('التوقيت', {'fields': ('check_in_time', 'check_out_time', 'check_in_method', 'check_in_device')}),
        ('المحاضرة والجدول', {'fields': ('lecture', 'schedule')}),
        ('التقييم', {'fields': ('rating', 'rated_by', 'notes')}),
    )


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_phone', 'get_email', 'image')
    search_fields = ('user__first_name', 'user__last_name', 'user__phone_number1', 'user__email')
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'البريد الإلكتروني'


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ('unique_code', 'first_name', 'last_name', 'gender', 'dob', 'primary_parent', 'phone')
    list_filter = ('gender', 'created_at')
    search_fields = ('unique_code', 'first_name', 'last_name', 'phone')
    readonly_fields = ('unique_code', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات الطفل', {'fields': ('primary_parent', 'first_name', 'last_name', 'gender', 'dob')}),
        ('معلومات التواصل', {'fields': ('phone', 'unique_code')}),
        ('الصورة', {'fields': ('image',)}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(ChildParents)
class ChildParentsAdmin(admin.ModelAdmin):
    list_display = ('child', 'parent')
    search_fields = ('child__first_name', 'child__last_name', 'parent__user__first_name')


@admin.register(ParentLinkRequest)
class ParentLinkRequestAdmin(admin.ModelAdmin):
    list_display = ('child', 'requester', 'primary_parent', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('child__first_name', 'requester__user__first_name', 'primary_parent__user__first_name')
    readonly_fields = ('created_at', 'updated_at')
