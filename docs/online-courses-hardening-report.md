# تقرير تقوية الدورات الإلكترونية وإصلاحات المراجعة

- **الفرع**: `feat/online-courses-hardening` (مبني فوق `feat/reimplement-online-courses`)
- **الـPR**: Al-Redwan-Courses-Center/alredwan-courses-center#63
- **التاريخ**: 23 سبتمبر 2026
- **حالة الدمج**: لا يوجد أي conflict مع `upstream/dev` ولا مع الفرع الأساسي (تم التحقق بـ `git merge-tree`).

## 1. قائمة التحقق: كل ما طُلب وحالته

| # | المشكلة / الطلب | الحالة | أين |
|---|---|---|---|
| 1 | الفرونت لا يُبنى (3 أخطاء TypeScript) | ✅ أُصلحت | `PublicCourseCatalog`, `PublicCourseCard`, `DashboardAllCoursesView` |
| 2 | طلب الطالب لكورس أونلاين يرجّع 500 | ✅ أُصلحت | `enrollments_payments/serializers/enrollment_request.py` |
| 3 | اسم الكورس يرجع null في طلبات الاشتراك الأونلاين | ✅ أُصلحت | `serializers/course_info.py` (mixin) |
| 4 | صفحات الكورسات تعرض أول 8 فقط بدون pagination | ✅ أُصلحت | `PublicCourseCatalog` |
| 5 | تستات `courses_online` لا تُكتشف | ✅ أُصلحت | `courses_online/tests/__init__.py` |
| 6 | زر الشراء يظهر للأدمن/المعلم | ✅ أُصلحت | `lib/course-enrollment.ts`, `CourseDetailLayout` |
| 7 | ولي الأمر لا يستطيع تسجيل طفل ثانٍ | ✅ أُصلحت | `lib/course-enrollment.ts` |
| 8 | مدة الصلاحية `access_validity_days` غير مطبّقة | ✅ أُصلحت | `courses_online/participants.py` |
| 9 | مشغّل الفيديو يقبل أي رابط في iframe | ✅ أُصلحت | `VideoPlayer.tsx` (YouTube/Vimeo/Bunny فقط + sandbox) |
| 10 | N+1 في صفحة الكورس الأونلاين | ✅ أُصلحت | `views/online_course.py` + تست لعدد الاستعلامات |
| 11 | migrations متضاربة (0005 مكرر، merge، Django 6) | ✅ دُمجت | ملف واحد لكل app + data migration لطرق الدفع |
| 12 | تكرار وكود ميت وتغييرات خارج النطاق | ✅ أُزيلت/أُرجعت | proxy في next.config، ترتيب اللاندنج، صلاحيات الذكريات |
| 13 | القفل التسلسلي للمحاضرات | ✅ أُضيف | `courses_online/locking.py` + الفرونت |
| 14 | قسم البث المباشر يظهر فقط عند وجوده | ✅ أُضيف | `StudentOnlineCourseViewer` |
| 15 | إخفاء الفيديو/الملفات/الوصف الفاضي | ✅ أُضيف | `StudentOnlineCourseViewer`, `VideoPlayer` |
| 16 | لوحة السوبر أدمن: الدورة بمحتواها في صفحة واحدة | ✅ أُضيف | `django-nested-admin`, `admin/online_course.py` |
| 17 | فورم تفاصيل الدورة للمعلم لا يحفظ + Invalid Date | ✅ أُصلحت | `CourseDetailsForm.tsx`, `actions/courses.ts` |
| 18 | أيقونتا "محاضرات اليوم" لا تعملان | ✅ أُصلحت | `TodaysLecturesTable`, `LectureEditModal`, `LectureDetailPageView` |
| 19 | داشبورد المعلم: الأونلاين لا تظهر + فلتر حضوري/إلكتروني | ✅ أُضيف | `InstructorMyCoursesCatalog` (تبويبان) |
| 20 | صورة الكورس تتقص على الموبايل + بوب أب | ✅ أُصلحت | `PublicCourseHero`, `ImageLightbox` |
| 21 | صور اللاندنج تفتح في بوب أب | ✅ أُضيف | `PictureGrid` |
| 22 | تفاصيل أكثر في صفحة الكورس العامة (خطة الدورة) | ✅ أُضيف | `courses/[id]/page.tsx` + حقل `lectures` في الـAPI |
| 23 | "سجل الآن" لأولياء الأمور والطلاب فقط | ✅ أُصلحت | الصفحتان العامتان |
| 24 | "سجل" يفتح تسجيل الدخول رغم تسجيل الدخول | ✅ أُصلحت | نفس القاعدة أعلاه |
| 25 | نموذج التقييم يطلب تسجيل الدخول رغم تسجيل الدخول | ✅ أُصلحت | صفحة الأونلاين العامة |
| 26 | أين يقيّم الطالب المعلم؟ (القسم كان فارغاً) | ✅ أُصلحت | `InstructorRatingsView` صار عاماً |
| 27 | كارت الطفل عند ولي الأمر على الموبايل | ✅ أُصلحت | `ChildCard.tsx` |
| 28 | لا سكرول أفقي في الجداول على الموبايل | ✅ أُصلحت | `DataView*` (بطاقات مرصوصة تحت 600px) |
| 29 | أخطاء "Failed to load enrollments" + TypeError عند المعلم | ✅ أُصلحت | `lib/course-enrollment.ts`, `actions/enrollments.ts` |
| 30 | الأدمن ينقل تقدم المشاهدة لطالب غير مشترك (ملاحظة إياد) | ✅ أُصلحت | `VideoWatchProgress.clean()` + تستات |
| 31 | خطأ hydration على الموبايل (زر الدخول، سلايدر الآراء) | ✅ أُصلحت | `AuthModal`, `TestimonialsSlider` |

## 2. الـcommits

| Commit | المحتوى |
|---|---|
| `25e95c2` | fix(backend): تقوية الاشتراك والوصول ودمج الـmigrations |
| `7ada828` | fix(frontend): البناء، تأمين المشغّل، توحيد صفحات الكورس |
| `2314b1b` | style(frontend): Prettier |
| `78ba4f4` | feat(online-courses): القفل التسلسلي، البث المباشر، إخفاء الفيديو الفاضي |
| `54250ee` | feat(admin): الدورة بمحتواها في صفحة واحدة |
| `5f5a04b` | feat(backend): خطة الدورة العامة، تقييمات المعلم العامة، فلتر المعلم |
| `4eb62cf` | fix(frontend): حفظ تفاصيل الدورة، الموبايل، البوب أب، تفاصيل الكورس |
| `541cce6` | fix: الأدوار الإدارية بلا طلبات اشتراك، منع نقل التقدم في الأدمن |

## 3. التحقق

| الفحص | النتيجة |
|---|---|
| تستات الباك إند (courses, users, courses_online, enrollments_payments, parents) | ناجحة بالكامل (~250 تست) |
| `makemigrations --check` | لا تغييرات |
| `tsc --noEmit` | 0 أخطاء |
| ESLint | 0 أخطاء |
| معاينة في المتصفح (375px وديسكتوب) | صفحة الدورة الحضورية والإلكترونية، البوب أب، معرض اللاندنج، بدون hydration errors |
| صفحات الداشبورد (المعلم / ولي الأمر) | فحص بالكود والـtypes فقط (تحتاج تسجيل دخول) |

## 4. قرارات تحتاج مراجعة الفريق

1. **مواعيد الدورة للمعلم للقراءة فقط**: الباك إند يقصر تعديل الجداول على الإدارة (`_require_schedule_admin`). لو المطلوب السماح للمعلم فالتعديل هناك.
2. **أرقام التواصل** في `frontend/src/lib/contact.ts` ما زالت placeholder (منقولة من الفوتر).
3. **التقييم يتطلب اشتراكاً غير منتهي الصلاحية**؛ لو المطلوب السماح للمنتهين فالتعديل سطر في `courses_online/serializers/ratings.py`.
4. **صلاحيات الذكريات للمدربين** أُرجعت لنسخة dev لتُقدَّم في PR مستقل.

## 5. ملاحظات النشر

- مكتبة جديدة: `django-nested-admin` (في `requirements.txt`)، فلازم `pip install -r requirements.txt` عند النشر (الـDockerfile وbuild.sh يفعلان ذلك).
- migrations جديدة: `courses_online/0001_initial`, `users/0007`, `enrollments_payments/0006` (تحوّل طرق الدفع القديمة `card`/`bank_transfer` إلى `other`).

## 6. كيفية الاختبار محلياً

```bash
cd backend
DJANGO_SECRET_KEY=x DEBUG=True DATABASE_ENGINE=sqlite3 python manage.py test courses users courses_online enrollments_payments parents
```

```bash
cd frontend
pnpm tsc --noEmit
pnpm eslint src
```
