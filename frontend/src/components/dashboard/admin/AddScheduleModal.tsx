"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { WeeklySchedule } from "@/actions/admin-schedules";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import TimePickerPopover from "@/components/ui/TimePickerPopover";
import { cn } from "@/lib/utils";

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
      <ModalContent className="sm:max-w-[600px] bg-white rounded-3xl p-0 overflow-hidden">
        <ModalHeader className="bg-olive-300 py-10 px-12">
          <ModalTitle className="text-white text-4xl font-medad text-right">
            {type === "lecture" ? "إضافة دورة جديدة" : "إضافة فترة إشراف"}
          </ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="p-12 flex flex-col gap-10">
          {/* Type Toggle */}
          <div className="flex bg-[#F3F3F5] p-2 rounded-2xl gap-2">
            <button
              type="button"
              onClick={() => setType("lecture")}
              className={cn(
                "flex-1 py-4 rounded-xl text-2xl font-bold transition-all",
                type === "lecture"
                  ? "bg-white shadow-md text-olive-700"
                  : "text-gray-400",
              )}
            >
              دورة تعليمية
            </button>
            <button
              type="button"
              onClick={() => setType("supervision")}
              className={cn(
                "flex-1 py-4 rounded-xl text-2xl font-bold transition-all",
                type === "supervision"
                  ? "bg-white shadow-md text-olive-700"
                  : "text-gray-400",
              )}
            >
              فترة إشراف
            </button>
          </div>

          {/* Inputs */}
          {type === "lecture" ? (
            <div className="flex flex-col gap-4">
              <label className="text-2xl font-bold text-gray-600 mr-2 text-right">
                اختر الدورة
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="bg-[#F3F3F5] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-2 focus:ring-olive-300 transition-all text-right appearance-none"
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
              <label className="text-2xl font-bold text-gray-600 mr-2 text-right">
                المحاضر / المشرف
              </label>
              <select
                value={instructorId}
                onChange={(e) => setInstructorId(Number(e.target.value))}
                className="bg-[#F3F3F5] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-2 focus:ring-olive-300 transition-all text-right appearance-none"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-2xl font-bold text-gray-600 mr-2 text-right">
                اليوم
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-[#F3F3F5] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-2 focus:ring-olive-300 appearance-none text-right"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-2xl font-bold text-gray-600 mr-2 text-right">
                النطاق الزمني
              </label>
              <div className="flex items-center gap-4 bg-[#F3F3F5] p-4 rounded-2xl justify-between">
                <TimePickerPopover
                  value={endTime}
                  onChange={setEndTime}
                  usePortal={false}
                  trigger={
                    <div className="text-xl font-bold text-gray-700 cursor-pointer hover:text-olive-500">
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
                    <div className="text-xl font-bold text-gray-700 cursor-pointer hover:text-olive-500">
                      {startTime}
                    </div>
                  }
                />
                <span className="text-gray-400">من</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-olive-300 text-white py-6 rounded-2xl text-2xl font-bold hover:bg-olive-400 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ البيانات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-500 py-6 rounded-2xl text-2xl font-bold hover:bg-gray-200 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
