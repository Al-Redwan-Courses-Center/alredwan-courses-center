from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, StudentUser, Instructor, InstructorAttendance, SupervisorSchedule, Parent, Child, ChildParents, ParentLinkRequest


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('get_phone_number1', 'get_first_name', 'get_last_name', 'get_email', 'get_role', 'get_is_verified', 'get_is_active')
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

    def get_phone_number1(self, obj):
        return obj.phone_number1
    get_phone_number1.short_description = 'رقم الهاتف'
    get_phone_number1.admin_order_field = 'phone_number1'

    def get_first_name(self, obj):
        return obj.first_name
    get_first_name.short_description = 'الاسم الأول'
    get_first_name.admin_order_field = 'first_name'

    def get_last_name(self, obj):
        return obj.last_name
    get_last_name.short_description = 'اسم العائلة'
    get_last_name.admin_order_field = 'last_name'

    def get_email(self, obj):
        return obj.email
    get_email.short_description = 'البريد الإلكتروني'
    get_email.admin_order_field = 'email'

    def get_role(self, obj):
        return obj.get_role_display()
    get_role.short_description = 'الدور'
    get_role.admin_order_field = 'role'

    def get_is_verified(self, obj):
        return obj.is_verified
    get_is_verified.short_description = 'تم التحقق'
    get_is_verified.admin_order_field = 'is_verified'
    get_is_verified.boolean = True

    def get_is_active(self, obj):
        return obj.is_active
    get_is_active.short_description = 'نشط'
    get_is_active.admin_order_field = 'is_active'
    get_is_active.boolean = True

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['phone_number1'].label = 'رقم الهاتف (واتساب)'
        form.base_fields['phone_number2'].label = 'رقم هاتف بديل'
        if 'email' in form.base_fields:
            form.base_fields['email'].label = 'البريد الإلكتروني'
        if 'first_name' in form.base_fields:
            form.base_fields['first_name'].label = 'الاسم الأول والثاني'
        if 'last_name' in form.base_fields:
            form.base_fields['last_name'].label = 'الاسم الثالث والرابع'
        if 'dob' in form.base_fields:
            form.base_fields['dob'].label = 'تاريخ الميلاد'
        if 'gender' in form.base_fields:
            form.base_fields['gender'].label = 'النوع'
        if 'identity_number' in form.base_fields:
            form.base_fields['identity_number'].label = 'رقم الهوية / الجواز'
        if 'identity_type' in form.base_fields:
            form.base_fields['identity_type'].label = 'نوع الهوية'
        if 'address' in form.base_fields:
            form.base_fields['address'].label = 'العنوان'
        if 'location' in form.base_fields:
            form.base_fields['location'].label = 'الموقع'
        if 'role' in form.base_fields:
            form.base_fields['role'].label = 'الدور'
        if 'is_verified' in form.base_fields:
            form.base_fields['is_verified'].label = 'تم التحقق'
        if 'is_active' in form.base_fields:
            form.base_fields['is_active'].label = 'نشط'
        if 'is_staff' in form.base_fields:
            form.base_fields['is_staff'].label = 'موظف'
        if 'is_superuser' in form.base_fields:
            form.base_fields['is_superuser'].label = 'مدير عام'
        if 'groups' in form.base_fields:
            form.base_fields['groups'].label = 'المجموعات'
        if 'user_permissions' in form.base_fields:
            form.base_fields['user_permissions'].label = 'الصلاحيات'
        if 'date_joined' in form.base_fields:
            form.base_fields['date_joined'].label = 'تاريخ الانضمام'
        if 'last_login' in form.base_fields:
            form.base_fields['last_login'].label = 'آخر تسجيل دخول'
        if 'password' in form.base_fields:
            form.base_fields['password'].label = 'كلمة المرور'
        return form


@admin.register(StudentUser)
class StudentUserAdmin(admin.ModelAdmin):
    list_display = ('unique_code', 'get_full_name', 'get_phone', 'get_gender', 'image')
    list_filter = ('user__gender', 'user__is_verified')
    search_fields = ('unique_code', 'user__first_name', 'user__last_name', 'user__phone_number1')
    readonly_fields = ('unique_code',)
    
    fieldsets = (
        ('معلومات الطالب', {'fields': ('user', 'unique_code', 'image')}),
    )
    
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


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_type', 'get_monthly_salary', 'get_phone', 'get_joined_date')
    list_filter = ('type', 'joined_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__phone_number1')
    
    fieldsets = (
        ('معلومات المدرس', {'fields': ('user', 'type', 'bio', 'monthly_salary')}),
        ('الصور', {'fields': ('image', 'nid_front', 'nid_back')}),
    )
    
    def get_type(self, obj):
        return obj.get_type_display()
    get_type.short_description = 'النوع'
    get_type.admin_order_field = 'type'

    def get_monthly_salary(self, obj):
        return obj.monthly_salary
    get_monthly_salary.short_description = 'الراتب الشهري'
    get_monthly_salary.admin_order_field = 'monthly_salary'

    def get_joined_date(self, obj):
        return obj.joined_date
    get_joined_date.short_description = 'تاريخ الانضمام'
    get_joined_date.admin_order_field = 'joined_date'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'type' in form.base_fields:
            form.base_fields['type'].label = 'النوع'
        if 'bio' in form.base_fields:
            form.base_fields['bio'].label = 'السيرة الذاتية'
        if 'monthly_salary' in form.base_fields:
            form.base_fields['monthly_salary'].label = 'الراتب الشهري'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        if 'nid_front' in form.base_fields:
            form.base_fields['nid_front'].label = 'صورة الهوية (أمامي)'
        if 'nid_back' in form.base_fields:
            form.base_fields['nid_back'].label = 'صورة الهوية (خلفي)'
        if 'joined_date' in form.base_fields:
            form.base_fields['joined_date'].label = 'تاريخ الانضمام'
        return form
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'الاسم الكامل'
    
    def get_phone(self, obj):
        return obj.user.phone_number1
    get_phone.short_description = 'رقم الهاتف'


@admin.register(SupervisorSchedule)
class SupervisorScheduleAdmin(admin.ModelAdmin):
    list_display = ('get_instructor', 'get_day', 'get_start_time', 'get_end_time', 'get_grace_period', 'get_auto_absent')
    list_filter = ('day_of_week', 'instructor')
    search_fields = ('instructor__user__first_name', 'instructor__user__last_name')
    
    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_start_time(self, obj):
        return obj.start_time
    get_start_time.short_description = 'وقت البداية'
    get_start_time.admin_order_field = 'start_time'

    def get_end_time(self, obj):
        return obj.end_time
    get_end_time.short_description = 'وقت النهاية'
    get_end_time.admin_order_field = 'end_time'

    def get_grace_period(self, obj):
        return obj.grace_period_minutes
    get_grace_period.short_description = 'فترة السماح (دقائق)'
    get_grace_period.admin_order_field = 'grace_period_minutes'

    def get_auto_absent(self, obj):
        return obj.auto_absent_after_minutes
    get_auto_absent.short_description = 'غياب تلقائي بعد (دقائق)'
    get_auto_absent.admin_order_field = 'auto_absent_after_minutes'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'day_of_week' in form.base_fields:
            form.base_fields['day_of_week'].label = 'اليوم'
        if 'start_time' in form.base_fields:
            form.base_fields['start_time'].label = 'وقت البداية'
        if 'end_time' in form.base_fields:
            form.base_fields['end_time'].label = 'وقت النهاية'
        if 'grace_period_minutes' in form.base_fields:
            form.base_fields['grace_period_minutes'].label = 'فترة السماح (دقائق)'
        if 'auto_absent_after_minutes' in form.base_fields:
            form.base_fields['auto_absent_after_minutes'].label = 'تسجيل غياب تلقائي بعد (دقائق)'
        return form
    
    def get_day(self, obj):
        return obj.get_day_of_week_display()
    get_day.short_description = 'اليوم'


@admin.register(InstructorAttendance)
class InstructorAttendanceAdmin(admin.ModelAdmin):
    list_display = ('get_instructor', 'get_date', 'get_status', 'get_check_in_time', 'get_check_out_time', 'get_rating', 'get_rated_by')
    list_filter = ('status', 'date', 'season', 'check_in_method')
    search_fields = ('instructor__user__first_name', 'instructor__user__last_name')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('معلومات الحضور', {'fields': ('instructor', 'date', 'season', 'status')}),
        ('التوقيت', {'fields': ('check_in_time', 'check_out_time', 'check_in_method', 'check_in_device')}),
        ('المحاضرة والجدول', {'fields': ('lecture', 'schedule')}),
        ('التقييم', {'fields': ('rating', 'rated_by', 'notes')}),
    )

    def get_instructor(self, obj):
        return obj.instructor
    get_instructor.short_description = 'المدرس'
    get_instructor.admin_order_field = 'instructor'

    def get_date(self, obj):
        return obj.date
    get_date.short_description = 'التاريخ'
    get_date.admin_order_field = 'date'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_check_in_time(self, obj):
        return obj.check_in_time
    get_check_in_time.short_description = 'وقت الحضور'
    get_check_in_time.admin_order_field = 'check_in_time'

    def get_check_out_time(self, obj):
        return obj.check_out_time
    get_check_out_time.short_description = 'وقت المغادرة'
    get_check_out_time.admin_order_field = 'check_out_time'

    def get_rating(self, obj):
        return obj.rating
    get_rating.short_description = 'التقييم'
    get_rating.admin_order_field = 'rating'

    def get_rated_by(self, obj):
        return obj.rated_by
    get_rated_by.short_description = 'تم التقييم بواسطة'
    get_rated_by.admin_order_field = 'rated_by'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'instructor' in form.base_fields:
            form.base_fields['instructor'].label = 'المدرس'
        if 'date' in form.base_fields:
            form.base_fields['date'].label = 'التاريخ'
        if 'season' in form.base_fields:
            form.base_fields['season'].label = 'الموسم'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'check_in_time' in form.base_fields:
            form.base_fields['check_in_time'].label = 'وقت الحضور'
        if 'check_out_time' in form.base_fields:
            form.base_fields['check_out_time'].label = 'وقت المغادرة'
        if 'check_in_method' in form.base_fields:
            form.base_fields['check_in_method'].label = 'طريقة التسجيل'
        if 'check_in_device' in form.base_fields:
            form.base_fields['check_in_device'].label = 'جهاز التسجيل'
        if 'lecture' in form.base_fields:
            form.base_fields['lecture'].label = 'المحاضرة'
        if 'schedule' in form.base_fields:
            form.base_fields['schedule'].label = 'الجدول'
        if 'rating' in form.base_fields:
            form.base_fields['rating'].label = 'التقييم'
        if 'rated_by' in form.base_fields:
            form.base_fields['rated_by'].label = 'تم التقييم بواسطة'
        if 'notes' in form.base_fields:
            form.base_fields['notes'].label = 'ملاحظات'
        return form


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_phone', 'get_email', 'image')
    search_fields = ('user__first_name', 'user__last_name', 'user__phone_number1', 'user__email')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'user' in form.base_fields:
            form.base_fields['user'].label = 'المستخدم'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        return form
    
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
    list_display = ('get_unique_code', 'get_first_name', 'get_last_name', 'get_gender', 'get_dob', 'get_primary_parent', 'get_phone')
    list_filter = ('gender', 'created_at')
    search_fields = ('unique_code', 'first_name', 'last_name', 'phone')
    readonly_fields = ('unique_code', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات الطفل', {'fields': ('primary_parent', 'first_name', 'last_name', 'gender', 'dob')}),
        ('معلومات التواصل', {'fields': ('phone', 'unique_code')}),
        ('الصورة', {'fields': ('image',)}),
        ('التواريخ', {'fields': ('created_at', 'updated_at')}),
    )

    def get_unique_code(self, obj):
        return obj.unique_code
    get_unique_code.short_description = 'الكود الفريد'
    get_unique_code.admin_order_field = 'unique_code'

    def get_first_name(self, obj):
        return obj.first_name
    get_first_name.short_description = 'الاسم الأول'
    get_first_name.admin_order_field = 'first_name'

    def get_last_name(self, obj):
        return obj.last_name
    get_last_name.short_description = 'اسم العائلة'
    get_last_name.admin_order_field = 'last_name'

    def get_gender(self, obj):
        return obj.get_gender_display()
    get_gender.short_description = 'النوع'
    get_gender.admin_order_field = 'gender'

    def get_dob(self, obj):
        return obj.dob
    get_dob.short_description = 'تاريخ الميلاد'
    get_dob.admin_order_field = 'dob'

    def get_primary_parent(self, obj):
        return obj.primary_parent
    get_primary_parent.short_description = 'ولي الأمر الرئيسي'
    get_primary_parent.admin_order_field = 'primary_parent'

    def get_phone(self, obj):
        return obj.phone
    get_phone.short_description = 'رقم الهاتف'
    get_phone.admin_order_field = 'phone'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'primary_parent' in form.base_fields:
            form.base_fields['primary_parent'].label = 'ولي الأمر الرئيسي'
        if 'first_name' in form.base_fields:
            form.base_fields['first_name'].label = 'الاسم الأول'
        if 'last_name' in form.base_fields:
            form.base_fields['last_name'].label = 'اسم العائلة'
        if 'gender' in form.base_fields:
            form.base_fields['gender'].label = 'النوع'
        if 'dob' in form.base_fields:
            form.base_fields['dob'].label = 'تاريخ الميلاد'
        if 'phone' in form.base_fields:
            form.base_fields['phone'].label = 'رقم الهاتف'
        if 'unique_code' in form.base_fields:
            form.base_fields['unique_code'].label = 'الكود الفريد'
        if 'image' in form.base_fields:
            form.base_fields['image'].label = 'الصورة'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form


@admin.register(ChildParents)
class ChildParentsAdmin(admin.ModelAdmin):
    list_display = ('get_child', 'get_parent')
    search_fields = ('child__first_name', 'child__last_name', 'parent__user__first_name')

    def get_child(self, obj):
        return obj.child
    get_child.short_description = 'الطفل'
    get_child.admin_order_field = 'child'

    def get_parent(self, obj):
        return obj.parent
    get_parent.short_description = 'ولي الأمر'
    get_parent.admin_order_field = 'parent'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'parent' in form.base_fields:
            form.base_fields['parent'].label = 'ولي الأمر'
        return form


@admin.register(ParentLinkRequest)
class ParentLinkRequestAdmin(admin.ModelAdmin):
    list_display = ('get_child', 'get_requester', 'get_primary_parent', 'get_status', 'get_created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('child__first_name', 'requester__user__first_name', 'primary_parent__user__first_name')
    readonly_fields = ('created_at', 'updated_at')

    def get_child(self, obj):
        return obj.child
    get_child.short_description = 'الطفل'
    get_child.admin_order_field = 'child'

    def get_requester(self, obj):
        return obj.requester
    get_requester.short_description = 'مقدم الطلب'
    get_requester.admin_order_field = 'requester'

    def get_primary_parent(self, obj):
        return obj.primary_parent
    get_primary_parent.short_description = 'ولي الأمر الرئيسي'
    get_primary_parent.admin_order_field = 'primary_parent'

    def get_status(self, obj):
        return obj.get_status_display()
    get_status.short_description = 'الحالة'
    get_status.admin_order_field = 'status'

    def get_created_at(self, obj):
        return obj.created_at
    get_created_at.short_description = 'تاريخ الإنشاء'
    get_created_at.admin_order_field = 'created_at'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'child' in form.base_fields:
            form.base_fields['child'].label = 'الطفل'
        if 'requester' in form.base_fields:
            form.base_fields['requester'].label = 'مقدم الطلب'
        if 'primary_parent' in form.base_fields:
            form.base_fields['primary_parent'].label = 'ولي الأمر الرئيسي'
        if 'status' in form.base_fields:
            form.base_fields['status'].label = 'الحالة'
        if 'created_at' in form.base_fields:
            form.base_fields['created_at'].label = 'تاريخ الإنشاء'
        if 'updated_at' in form.base_fields:
            form.base_fields['updated_at'].label = 'تاريخ التحديث'
        return form
