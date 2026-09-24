"use client";

import { format, isValid, parse, parseISO } from "date-fns";
import { CalendarDays, Clock, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { type CourseUpdatePayload, updateCourse } from "@/actions/courses";
import DatePicker from "@/components/courses/DatePicker";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn, formatTime, getWeekDay } from "@/lib/utils";
import type { CourseDetail, CourseScheduleDetail } from "@/types/entities";

export interface CourseDetailsInputs {
  course_title: string;
  description: string;
  date_range: DateRange;
}

const labelStyles = cn(
  "mb-2 flex items-center gap-2 text-[2rem] font-bold text-gray-500",
);

const cardStyles = cn(
  "shadow-soft tablet-sm:p-5 min-w-0 rounded-[2rem] border border-white/60 bg-white/40 p-8 backdrop-blur-md",
);

const TIME_FORMATS = ["HH:mm:ss", "HH:mm"];

/** The API sends `HH:mm:ss`, older records may hold `HH:mm`; try both. */
function formatScheduleTime(time: string | null | undefined) {
  if (!time) return "غير محدد";

  const parsed = TIME_FORMATS.map((pattern) =>
    parse(time, pattern, new Date()),
  ).find(isValid);

  return parsed ? formatTime(parsed) : time;
}

function toApiDate(date: Date | undefined) {
  return date && isValid(date) ? format(date, "yyyy-MM-dd") : undefined;
}

// Weeks run Saturday → Friday, matching the rest of the dashboard.
function byWeekOrder(a: CourseScheduleDetail, b: CourseScheduleDetail) {
  return ((a.weekday + 1) % 7) - ((b.weekday + 1) % 7);
}

export default function CourseDetailsForm({
  course,
}: {
  course: CourseDetail | null;
}) {
  const router = useRouter();

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<CourseDetailsInputs>({
    defaultValues: {
      course_title: course?.name ?? "",
      description: course?.description ?? "",
      date_range: {
        from: course?.start_date ? parseISO(course.start_date) : undefined,
        to: course?.end_date ? parseISO(course.end_date) : undefined,
      },
    },
  });

  const dateRange = watch("date_range");
  const schedules = [...(course?.schedules ?? [])].sort(byWeekOrder);

  async function onSubmit(values: CourseDetailsInputs) {
    if (!course) return;

    const payload: CourseUpdatePayload = {};

    const name = values.course_title.trim();
    if (name && name !== course.name) payload.name = name;

    const description = values.description.trim();
    if (description !== (course.description ?? "").trim()) {
      payload.description = description;
    }

    const startDate = toApiDate(values.date_range?.from);
    if (startDate && startDate !== course.start_date) {
      payload.start_date = startDate;
    }

    const endDate = toApiDate(values.date_range?.to);
    if (endDate && endDate !== course.end_date) {
      payload.end_date = endDate;
    }

    if (Object.keys(payload).length === 0) {
      toast("لم تقم بأي تغيير.");
      return;
    }

    try {
      const result = await updateCourse(course.id, payload);

      if (result.success) {
        toast.success("تم حفظ التغييرات بنجاح");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full min-w-0 grow flex-col gap-10"
    >
      <div className="tablet:grid-cols-1 tablet:gap-y-8 grid h-full min-w-0 grid-cols-[1.2fr_2fr_1.5fr] gap-x-12">
        {/*
        //
        // MARK: Weekly schedule, read-only (Column 1)
        //
        */}
        <div className={cn(cardStyles, "flex flex-col")}>
          <h3 className={labelStyles}>
            <Clock size={20} className="text-olive-400" />
            مواعيد الدورة
          </h3>

          {schedules.length > 0 ? (
            <>
              <div className="mb-6 flex flex-wrap gap-3">
                {schedules.map((s) => (
                  <span
                    key={s.id}
                    className="bg-olive-400 rounded-lg px-4 py-2 text-lg font-bold text-white"
                  >
                    {(s.weekday_display || getWeekDay(s.weekday)).substring(
                      0,
                      3,
                    )}
                  </span>
                ))}
              </div>

              <ul className="flex flex-col gap-3">
                {schedules.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-white px-5 py-3 shadow-sm"
                  >
                    <span className="text-xl font-bold text-gray-600">
                      {s.weekday_display || getWeekDay(s.weekday)}
                    </span>
                    <span className="text-olive-700 text-xl font-bold whitespace-nowrap">
                      {formatScheduleTime(s.start_time)}
                      <span className="mx-2 text-gray-400">-</span>
                      {formatScheduleTime(s.end_time)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-2xl bg-white px-5 py-4 text-xl text-gray-500">
              لم تُحدد مواعيد لهذه الدورة بعد.
            </p>
          )}

          <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white/60 px-4 py-3 text-lg text-gray-500">
            لتعديل مواعيد الدورة تواصل مع الإدارة
          </p>
        </div>

        {/*
        //
        // MARK: Date range (Column 2)
        //
        */}
        <div className={cn(cardStyles, "flex min-w-0 flex-col")}>
          <h3 className={labelStyles}>
            <CalendarDays size={20} className="text-olive-400" />
            فترة الدورة
          </h3>
          <DatePicker
            range={dateRange}
            onRangeChange={(range) =>
              setValue("date_range", range, { shouldDirty: true })
            }
            defaultMonth={dateRange.from || new Date()}
          />
        </div>

        {/*
        //
        // MARK: Description & Title (Column 3)
        //
        */}
        <div className="flex min-w-0 flex-col gap-10">
          <div className="flex flex-col">
            <label htmlFor="courseName" className={labelStyles}>
              <Pencil size={20} className="text-olive-400" />
              اسم الدورة
            </label>
            <Input
              id="courseName"
              shape="square"
              placeholder="تفسير القرآن الكريم"
              inputStyles={cn(
                "shadow-soft w-full rounded-xl border-none bg-white/60 py-4 text-2xl",
              )}
              registerReturn={register("course_title", {
                required: "اسم الدورة مطلوب",
                validate: (value) =>
                  value.trim().length > 0 || "اسم الدورة مطلوب",
              })}
            />
            {errors.course_title && (
              <p className="mt-2 text-lg font-medium text-red-600">
                {errors.course_title.message}
              </p>
            )}
          </div>

          <div className="flex grow flex-col">
            <label htmlFor="description" className={labelStyles}>
              <Pencil size={20} className="text-olive-400" />
              الوصـــــــــف
            </label>
            <textarea
              id="description"
              rows={8}
              placeholder="تحفيظ وتدريس القران الكريم - مستوى متقدم"
              className="shadow-soft focus:ring-olive-200 tablet-sm:px-6 tablet-sm:py-5 w-full grow resize-none rounded-2xl border-none bg-white/60 px-10 py-8 text-2xl backdrop-blur-sm transition-all outline-none placeholder:text-2xl focus:ring-2"
              {...register("description")}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-start">
        <Button
          type="submit"
          size="large"
          loading={isSubmitting}
          disabled={!course}
          className="tablet-sm:w-full tablet-sm:px-8 tablet-sm:text-xl rounded-[0.5rem_2rem] px-16 py-4 text-2xl shadow-lg"
        >
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}
