"use client";

import {
  createSupervisorSchedule,
  updateSupervisorSchedule,
} from "@/actions/supervisor-schedules";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalTitle,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { Instructor } from "@/types/entities/instructors";
import {
  SupervisorScheduleCreateBody,
  SupervisorScheduleRow,
} from "@/types/entities/supervisor-schedule";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

function apiTimeToInput(t: string): string {
  const m = t.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function inputTimeToApi(t: string): string {
  if (!t?.trim()) return "00:00:00";
  const [h = "0", m = "0"] = t.trim().split(":");
  const hh = h.padStart(2, "0").slice(-2);
  const mm = m.padStart(2, "0").slice(-2);
  return `${hh}:${mm}:00`;
}

function timeStringToMinutes(t: string): number {
  const [h, m, s] = t.split(":").map((x) => Number(x) || 0);
  return h * 60 + m + s / 60;
}

const supervisorScheduleFormSchema = z
  .object({
    instructor: z
      .string()
      .min(1, "اختر المشرف")
      .regex(/^\d+$/, "معرّف المشرف غير صالح")
      .refine((s) => Number(s) > 0, "اختر المشرف"),
    day_of_week: z.string().regex(/^[0-6]$/, "يوم غير صالح"),
    start_time: z.string().min(1, "اختر وقت البداية"),
    end_time: z.string().min(1, "اختر وقت النهاية"),
    grace_period_minutes: z
      .string()
      .regex(/^\d+$/, "أدخل رقماً صحيحاً")
      .refine((s) => Number(s) >= 0, "فترة السماح يجب أن تكون ≥ 0"),
    auto_absent_after_minutes: z
      .string()
      .regex(/^\d+$/, "أدخل رقماً صحيحاً")
      .refine((s) => Number(s) >= 0, "مهلة الغياب التلقائي يجب أن تكون ≥ 0"),
  })
  .superRefine((data, ctx) => {
    const startM = timeStringToMinutes(inputTimeToApi(data.start_time));
    const endM = timeStringToMinutes(inputTimeToApi(data.end_time));
    if (endM <= startM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "وقت الانتهاء يجب أن يكون بعد وقت البداية",
        path: ["end_time"],
      });
    }
  });

type SupervisorScheduleFormValues = z.infer<typeof supervisorScheduleFormSchema>;

const defaultCreateValues: SupervisorScheduleFormValues = {
  instructor: "",
  day_of_week: "0",
  start_time: "08:00",
  end_time: "14:00",
  grace_period_minutes: "15",
  auto_absent_after_minutes: "60",
};

function valuesToBody(values: SupervisorScheduleFormValues): SupervisorScheduleCreateBody {
  return {
    instructor: Number(values.instructor),
    day_of_week: Number(values.day_of_week),
    start_time: inputTimeToApi(values.start_time),
    end_time: inputTimeToApi(values.end_time),
    grace_period_minutes: Math.round(Number(values.grace_period_minutes)),
    auto_absent_after_minutes: Math.round(Number(values.auto_absent_after_minutes)),
  };
}

export default function SupervisorScheduleFormDialog({
  open,
  onOpenChange,
  editing,
  instructors,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SupervisorScheduleRow | null;
  instructors: Instructor[];
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupervisorScheduleFormValues>({
    resolver: zodResolver(supervisorScheduleFormSchema),
    defaultValues: defaultCreateValues,
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        instructor: String(editing.instructor),
        day_of_week: String(editing.day_of_week),
        start_time: apiTimeToInput(editing.start_time),
        end_time: apiTimeToInput(editing.end_time),
        grace_period_minutes: String(editing.grace_period_minutes),
        auto_absent_after_minutes: String(editing.auto_absent_after_minutes),
      });
    } else {
      reset(defaultCreateValues);
    }
  }, [open, editing, reset]);

  const controlClass = cn(
    "shadow-soft w-full min-h-[4.8rem] rounded-[2rem_0] bg-gray-50 px-10 py-4 text-[1.8rem] font-semibold text-gray-800 outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-olive-400/50",
  );
  const fieldClass =
    "flex min-w-0 max-w-full flex-col gap-2 text-2xl";

  async function onSubmit(values: SupervisorScheduleFormValues) {
    const body = valuesToBody(values);
    if (editing) {
      const res = await updateSupervisorSchedule(editing.id, body);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("تم تحديث الجدول");
    } else {
      const res = await createSupervisorSchedule(body);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("تم إنشاء الجدول");
    }
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="max-h-[90dvh] w-[min(96vw,80rem)] max-w-[min(96vw,80rem)] overflow-y-auto sm:max-w-[min(96vw,80rem)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ModalTitle>{editing ? "تعديل الجدول" : "جدول إشراف جديد"}</ModalTitle>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-w-0 flex-col"
          noValidate
        >
          <div className="grid w-full min-w-0 grid-cols-2 gap-x-10 gap-y-10 px-8 pb-8 pt-2 sm:gap-x-14 sm:gap-y-12 sm:px-12">
            {instructors.length === 0 && (
              <p className="text-[#952B2B] col-span-full mb-2 text-2xl leading-relaxed sm:mb-4">
                لا يوجد معلمون في القائمة بعد التحميل. يمكنك إغلاق النافذة وتحديث
                الصفحة بعد إصلاح الـ API.
              </p>
            )}
            <label className={fieldClass}>
              <span className="font-semibold">المشرف</span>
              <select
                className={cn(controlClass, "cursor-pointer appearance-none")}
                {...register("instructor")}
              >
                <option value="">— اختر —</option>
                {instructors.map((i) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.name} ({i.type_display})
                  </option>
                ))}
              </select>
              {errors.instructor && (
                <span className="text-[#952B2B] mt-1 text-xl leading-snug">
                  {errors.instructor.message}
                </span>
              )}
            </label>

            <label className={fieldClass}>
              <span className="font-semibold">اليوم</span>
              <select
                className={cn(controlClass, "cursor-pointer appearance-none")}
                {...register("day_of_week")}
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={String(d.value)}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.day_of_week && (
                <span className="text-[#952B2B] mt-1 text-xl leading-snug">
                  {errors.day_of_week.message}
                </span>
              )}
            </label>

            <label className={fieldClass}>
              <span className="font-semibold">من</span>
              <input
                className={controlClass}
                type="time"
                {...register("start_time")}
              />
              {errors.start_time && (
                <span className="text-[#952B2B] mt-1 text-xl leading-snug">
                  {errors.start_time.message}
                </span>
              )}
            </label>
            <label className={fieldClass}>
              <span className="font-semibold">إلى</span>
              <input
                className={controlClass}
                type="time"
                {...register("end_time")}
              />
              {errors.end_time && (
                <span className="text-[#952B2B] mt-1 text-xl leading-snug">
                  {errors.end_time.message}
                </span>
              )}
            </label>

            <label className={fieldClass}>
              <span className="font-semibold">فترة السماح (دقيقة)</span>
              <input
                className={controlClass}
                type="number"
                min={0}
                step={1}
                {...register("grace_period_minutes")}
              />
              {errors.grace_period_minutes && (
                <span className="text-[#952B2B] mt-1 text-xl leading-snug">
                  {errors.grace_period_minutes.message}
                </span>
              )}
            </label>

            <label className={fieldClass}>
              <span className="font-semibold">تسجيل غياب تلقائي بعد (دقيقة)</span>
              <input
                className={controlClass}
                type="number"
                min={0}
                step={1}
                {...register("auto_absent_after_minutes")}
              />
              {errors.auto_absent_after_minutes && (
                <span className="text-[#952B2B] mt-1 text-xl leading-snug">
                  {errors.auto_absent_after_minutes.message}
                </span>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-5 px-8 pb-10 pt-6 sm:px-12">
            <ModalClose asChild>
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            </ModalClose>
            <Button type="submit" size="small" loading={isSubmitting}>
              {editing ? "حفظ التعديلات" : "إنشاء"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
