import CourseImage from "@/assets/course-img.jpg";
import { getCourseById } from "@/actions/courses";
import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import Button from "@/components/ui/Button";
import ProgressBarWithLabel from "@/components/ui/ProgressBarWithLabel";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  cn,
  formatDate,
  formatTime,
  getArabicPlural,
  toHindiDigits,
} from "@/lib/utils";
import { parseISO } from "date-fns";
import Image from "next/image";
import { ComponentType, SVGProps } from "react";

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="relative flex items-center rounded-[1rem_0] bg-gray-100 p-6 font-bold text-gray-500 shadow-inner">
      <Icon className="text-olive-300 me-4 h-10 w-auto" />
      <span className="me-auto">{label}</span>
      <div className="absolute inset-y-6 left-6 grid aspect-square w-auto place-items-center rounded-[0.5rem_0] bg-gray-50 px-3 shadow-[1px_2px_2.1px_0px_rgba(0,0,0,0.17)]">
        {value}
      </div>
    </div>
  );
}

const dataPointWrapperStyles = cn(
  "text-olive-300 grid grid-cols-[auto_1fr] grid-rows-2 gap-x-5 gap-y-2 text-2xl font-bold",
);

const dataPointIconStyles = cn(
  "drop-shadow-soft row-span-full h-10 w-auto self-center",
);

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 text-4xl font-bold text-gray-600">
        <span>تعذر العثور على بيانات الدورة.</span>
        <Button size="small" href="/dashboard/courses">
          الرجوع إلى جميع الدورات
        </Button>
      </div>
    );
  }

  const startDate = parseISO(course.start_date);
  const endDate = course.end_date ? parseISO(course.end_date) : null;
  const seatsTaken = course.enrolled_count;
  const seatsTotal = course.capacity;
  const occupancy = seatsTotal
    ? Math.min(100, Math.round((seatsTaken / seatsTotal) * 100))
    : 0;
  const scheduleLabel = course.schedules?.length
    ? "مواعيد الأسبوع"
    : "مواعيد لم تحدد بعد";

  const formatApiTime = (time: string) => formatTime(time.slice(0, 5));
  const ageRangeLabel = course.for_adults ? "للبالغين" : "للأطفال";
  const ageRangeValue =
    course.min_age || course.max_age
      ? `${course.min_age ? toHindiDigits(course.min_age) : "؟"} - ${
          course.max_age ? toHindiDigits(course.max_age) : "؟"
        } سنة`
      : "غير محدد";

  return (
    <div className="flex h-full flex-col gap-12 overflow-y-auto px-16 pt-16 pb-10">
      <div className="tablet:grid-cols-1 grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-12">
        <div className="shadow-soft rounded-[2rem_0] bg-gray-50 p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <h2 className="text-olive-500 text-[4rem] font-bold">
                {course.name}
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <StatusBadge color={course.is_active ? "green" : "gray"}>
                  {course.is_active ? "نشطة" : "غير نشطة"}
                </StatusBadge>
                <StatusBadge color={course.is_full ? "gray" : "green"}>
                  {course.is_full ? "مكتملة" : "متاحة"}
                </StatusBadge>
              </div>
            </div>

            <Button variant="secondary" size="small" href="/dashboard/courses">
              الرجوع
            </Button>
          </div>

          <p className="mt-6 text-[2.2rem] leading-relaxed text-gray-600">
            {course.description || "لا يوجد وصف متاح حالياً لهذه الدورة."}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {course.tags?.length ? (
              course.tags.map((tag, index) => (
                <span
                  key={tag.id}
                  className={cn(
                    "inline-block bg-gray-100 px-4 py-2 text-center text-xl",
                    index % 2 === 0 ? "rounded-[1rem_0]" : "rounded-[0_1rem]",
                  )}
                >
                  {tag.name}
                </span>
              ))
            ) : (
              <span className="text-xl text-gray-500">لا توجد فئات.</span>
            )}
          </div>

          <div className="tablet:grid-cols-1 mt-10 grid grid-cols-2 gap-8">
            <div className={dataPointWrapperStyles}>
              <InstructorIcon className={dataPointIconStyles} />
              <span className="self-end">المعلم</span>
              <span className="text-olive-500">
                {course.instructor?.name || "غير محدد"}
              </span>
            </div>

            <div className={dataPointWrapperStyles}>
              <CalendarIcon className={dataPointIconStyles} />
              <span className="self-end">الفترة</span>
              <span className="text-olive-500">
                {formatDate(startDate)}
                {endDate ? ` - ${formatDate(endDate)}` : " - مفتوحة"}
              </span>
            </div>

            <div className={dataPointWrapperStyles}>
              <BookIcon className={dataPointIconStyles} />
              <span className="self-end">عدد المحاضرات</span>
              <span className="text-olive-500">
                {course.num_lectures
                  ? `${toHindiDigits(course.num_lectures)} ${getArabicPlural(
                      course.num_lectures,
                      {
                        singular: "محاضرة",
                        twofer: "محاضرتان",
                        plural: "محاضرات",
                      },
                    )}`
                  : "غير محدد"}
              </span>
            </div>

            <div className={dataPointWrapperStyles}>
              <PeopleIcon className={dataPointIconStyles} />
              <span className="self-end">السعة</span>
              <span className="text-olive-500">
                {toHindiDigits(seatsTaken)} من {toHindiDigits(seatsTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="shadow-soft relative overflow-hidden rounded-[2rem_0] bg-gray-50">
          <Image
            src={course.image || CourseImage}
            alt={course.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_20%,rgba(0,0,0,0.6)_100%)]"></div>
          <div className="absolute inset-x-0 bottom-0 p-10 text-gray-50">
            <div className="text-6xl font-bold">
              {toHindiDigits(course.price)} جنيه
            </div>
            <div className="mt-4 text-2xl">
              الموسم: {course.season?.name || "غير محدد"}
            </div>
            <div className="mt-2 text-2xl">
              الفئة العمرية: {ageRangeLabel} ({ageRangeValue})
            </div>
          </div>
        </div>
      </div>

      <div className="tablet:grid-cols-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12">
        <div className="shadow-soft rounded-[2rem_0] bg-gray-50 p-10">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-olive-700 text-4xl font-bold">
              {scheduleLabel}
            </h3>
            <Button size="small" variant="light">
              إضافة للتقويم
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {course.schedules?.length ? (
              course.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-wrap items-center justify-between gap-6 rounded-[1.5rem_0] bg-gray-100 px-8 py-6 text-2xl font-bold text-gray-600 shadow-inner"
                >
                  <div className="flex items-center gap-4">
                    <CalendarIcon className="text-olive-300 h-8 w-auto" />
                    <span className="text-olive-500">
                      {schedule.weekday_display}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="text-olive-300 h-8 w-auto" />
                    <span>
                      من {formatApiTime(schedule.start_time)} إلى{" "}
                      {formatApiTime(schedule.end_time)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem_0] bg-gray-100 px-8 py-10 text-center text-2xl font-bold text-gray-500 shadow-inner">
                سيتم إعلان المواعيد قريباً.
              </div>
            )}
          </div>
        </div>

        <div className="shadow-soft rounded-[2rem_0] bg-gray-50 p-10">
          <h3 className="text-olive-700 mb-8 text-4xl font-bold">
            ملخص التسجيل
          </h3>

          <div className="flex flex-col gap-8">
            <InfoCard
              icon={PeopleIcon}
              label="المقاعد المتاحة"
              value={toHindiDigits(course.available_spots)}
            />

            <InfoCard
              icon={MoneyIcon}
              label="قيمة الاشتراك"
              value={`${toHindiDigits(course.price)} جنيه`}
            />

            <ProgressBarWithLabel
              icon={PeopleIcon}
              label="نسبة امتلاء المقاعد"
              progress={occupancy}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Button size="small">طلب الاشتراك</Button>
            <Button size="small" variant="secondary">
              مشاركة الدورة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
