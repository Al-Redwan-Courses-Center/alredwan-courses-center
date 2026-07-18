"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import { cn, toHindiDigits } from "@/lib/utils";
import TimePickerPopover from "@/components/ui/TimePickerPopover";
import { WeeklySchedule } from "@/actions/admin-schedules";
import toast from "react-hot-toast";

const DAYS = [
  { label: "السبت", value: 6 },
  { label: "الأحد", value: 0 },
  { label: "الاثنين", value: 1 },
  { label: "الثلاثاء", value: 2 },
  { label: "الأربعاء", value: 3 },
  { label: "الخميس", value: 4 },
  { label: "الجمعة", value: 5 },
];

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    schedule: Partial<WeeklySchedule>,
    courseId?: number,
    instructorId?: number,
  ) => Promise<void>;
  defaultType?: "lecture" | "supervision";
  courses?: any[];
  instructors?: any[];
}

export default function AddScheduleModal({
  isOpen,
  onClose,
  onAdd,
  defaultType = "lecture",
  courses = [],
  instructors = [],
}: AddScheduleModalProps) {
  const [type, setType] = useState<"lecture" | "supervision">(defaultType);
  const [courseId, setCourseId] = useState<number | "">("");
  const [instructorId, setInstructorId] = useState<number | "">("");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [startTime, setStartTime] = useState("06:00 pm");
  const [endTime, setEndTime] = useState("07:00 pm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to convert "06:00 pm" to "18:00:00"
  const convertTo24HourFormat = (timeStr: string) => {
    if (!timeStr) return "00:00:00";
    try {
      const [time, modifier] = timeStr.toLowerCase().split(" ");
      let [hours, minutes] = time.split(":");

      if (hours === "12") {
        hours = "00";
      }

      if (modifier === "pm" || modifier === "م") {
        hours = (parseInt(hours, 10) + 12).toString();
      }

      hours = hours.padStart(2, "0");
      minutes = minutes.padStart(2, "0");

      return `${hours}:${minutes}:00`;
    } catch (e) {
      return timeStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "lecture" && !courseId) {
      toast.error("يرجى اختيار الدورة");
      return;
    }

    if (type === "supervision" && !instructorId) {
      toast.error("يرجى اختيار المحاضر/المشرف");
      return;
    }

    setIsSubmitting(true);

    const selectedCourse = courses.find((c) => c.id === courseId);
    const selectedInstructor = instructors.find((i) => i.id === instructorId);

    await onAdd(
      {
        type,
        course_name: selectedCourse?.name || "إشراف",
        instructor_name:
          type === "lecture"
            ? selectedCourse?.instructor?.user?.first_name
              ? `${selectedCourse.instructor.user.first_name} ${selectedCourse.instructor.user.last_name}`
              : "غير محدد"
            : selectedInstructor?.name || "غير محدد",
        weekday: selectedDay,
        weekday_display: DAYS.find((d) => d.value === selectedDay)?.label || "",
        start_time: convertTo24HourFormat(startTime),
        end_time: convertTo24HourFormat(endTime),
        season_name: selectedCourse?.season?.name || "-",
        student_count: selectedCourse?.enrolled_count || 0,
      },
      Number(courseId),
      Number(instructorId),
    );

    setIsSubmitting(false);
    onClose();
    // Reset form
    setCourseId("");
    setInstructorId("");
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="overflow-hidden rounded-3xl bg-white p-0 sm:max-w-[600px]">
        <ModalHeader className="bg-olive-300 px-12 py-10">
          <ModalTitle className="font-medad text-right text-4xl text-white">
            {type === "lecture" ? "إضافة دورة جديدة" : "إضافة فترة إشراف"}
          </ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10 p-12">
          {/* Type Toggle */}
          <div className="flex gap-2 rounded-2xl bg-[#F3F3F5] p-2">
            <button
              type="button"
              onClick={() => setType("lecture")}
              className={cn(
                "flex-1 rounded-xl py-4 text-2xl font-bold transition-all",
                type === "lecture"
                  ? "text-olive-700 bg-white shadow-md"
                  : "text-gray-400",
              )}
            >
              دورة تعليمية
            </button>
            <button
              type="button"
              onClick={() => setType("supervision")}
              className={cn(
                "flex-1 rounded-xl py-4 text-2xl font-bold transition-all",
                type === "supervision"
                  ? "text-olive-700 bg-white shadow-md"
                  : "text-gray-400",
              )}
            >
              فترة إشراف
            </button>
          </div>

          {/* Inputs */}
          {type === "lecture" ? (
            <div className="flex flex-col gap-4">
              <label className="mr-2 text-right text-2xl font-bold text-gray-600">
                اختر الدورة
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="focus:ring-olive-300 appearance-none rounded-2xl bg-[#F3F3F5] p-6 text-right text-2xl transition-all focus:ring-2 focus:outline-none"
              >
                <option value="" disabled>
                  -- الرجاء اختيار دورة --
                </option>
                {courses.map((course) => (
                  <option key={`course-${course.id}`} value={course.id}>
                    {course.name} - {course.season?.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="mr-2 text-right text-2xl font-bold text-gray-600">
                المحاضر / المشرف
              </label>
              <select
                value={instructorId}
                onChange={(e) => setInstructorId(Number(e.target.value))}
                className="focus:ring-olive-300 appearance-none rounded-2xl bg-[#F3F3F5] p-6 text-right text-2xl transition-all focus:ring-2 focus:outline-none"
              >
                <option value="" disabled>
                  -- الرجاء اختيار المحاضر --
                </option>
                {instructors.map((instructor) => (
                  <option key={`inst-${instructor.id}`} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day & Time Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <label className="mr-2 text-right text-2xl font-bold text-gray-600">
                اليوم
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="focus:ring-olive-300 appearance-none rounded-2xl bg-[#F3F3F5] p-6 text-right text-2xl focus:ring-2 focus:outline-none"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <label className="mr-2 text-right text-2xl font-bold text-gray-600">
                النطاق الزمني
              </label>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F3F3F5] p-4">
                <TimePickerPopover
                  value={endTime}
                  onChange={setEndTime}
                  usePortal={false}
                  trigger={
                    <div className="hover:text-olive-500 cursor-pointer text-xl font-bold text-gray-700">
                      {endTime}
                    </div>
                  }
                />
                <span className="text-gray-400">إلى</span>
                <TimePickerPopover
                  value={startTime}
                  onChange={setStartTime}
                  usePortal={false}
                  trigger={
                    <div className="hover:text-olive-500 cursor-pointer text-xl font-bold text-gray-700">
                      {startTime}
                    </div>
                  }
                />
                <span className="text-gray-400">من</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-olive-300 hover:bg-olive-400 flex-1 rounded-2xl py-6 text-2xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ البيانات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gray-100 py-6 text-2xl font-bold text-gray-500 transition-all hover:bg-gray-200"
            >
              إلغاء
            </button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
