"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/Modal";
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
  onAdd: (schedule: Partial<WeeklySchedule>) => void;
  defaultType?: "lecture" | "supervision";
}

export default function AddScheduleModal({
  isOpen,
  onClose,
  onAdd,
  defaultType = "lecture",
}: AddScheduleModalProps) {
  const [type, setType] = useState<"lecture" | "supervision">(defaultType);
  const [courseName, setCourseName] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [startTime, setStartTime] = useState("06:00 pm");
  const [endTime, setEndTime] = useState("07:00 pm");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseName || !instructorName) {
      toast.error("يرجى إكمال جميع البيانات");
      return;
    }

    onAdd({
      type,
      course_name: courseName,
      instructor_name: instructorName,
      weekday: selectedDay,
      weekday_display: DAYS.find(d => d.value === selectedDay)?.label || "",
      start_time: startTime,
      end_time: endTime,
      season_name: "رمضان 2026",
      student_count: 0
    });

    toast.success("تمت الإضافة بنجاح");
    onClose();
    // Reset form
    setCourseName("");
    setInstructorName("");
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
                type === "lecture" ? "bg-white shadow-md text-olive-700" : "text-gray-400"
              )}
            >
              دورة تعليمية
            </button>
            <button
              type="button"
              onClick={() => setType("supervision")}
              className={cn(
                "flex-1 py-4 rounded-xl text-2xl font-bold transition-all",
                type === "supervision" ? "bg-white shadow-md text-olive-700" : "text-gray-400"
              )}
            >
              فترة إشراف
            </button>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-4">
            <label className="text-2xl font-bold text-gray-600 mr-2 text-right">
              {type === "lecture" ? "اسم الدورة" : "مسمى فترة الإشراف"}
            </label>
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder={type === "lecture" ? "مثال: تحفيظ القرآن الكريم" : "مثال: إشراف القاعة الكبرى"}
              className="bg-[#F3F3F5] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-2 focus:ring-olive-300 transition-all text-right"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-2xl font-bold text-gray-600 mr-2 text-right">المحاضر / المشرف</label>
            <input
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="اسم الشخص المسؤول"
              className="bg-[#F3F3F5] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-2 focus:ring-olive-300 transition-all text-right"
            />
          </div>

          {/* Day & Time Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-2xl font-bold text-gray-600 mr-2 text-right">اليوم</label>
              <select 
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-[#F3F3F5] p-6 rounded-2xl text-2xl focus:outline-none focus:ring-2 focus:ring-olive-300 appearance-none text-right"
              >
                {DAYS.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-2xl font-bold text-gray-600 mr-2 text-right">النطاق الزمني</label>
              <div className="flex items-center gap-4 bg-[#F3F3F5] p-4 rounded-2xl justify-between">
                <TimePickerPopover 
                  value={endTime}
                  onChange={setEndTime}
                  usePortal={false}
                  trigger={<div className="text-xl font-bold text-gray-700 cursor-pointer hover:text-olive-500">{endTime}</div>}
                />
                <span className="text-gray-400">إلى</span>
                <TimePickerPopover 
                  value={startTime}
                  onChange={setStartTime}
                  usePortal={false}
                  trigger={<div className="text-xl font-bold text-gray-700 cursor-pointer hover:text-olive-500">{startTime}</div>}
                />
                <span className="text-gray-400">من</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 mt-6">
            <button
              type="submit"
              className="flex-1 bg-olive-300 text-white py-6 rounded-2xl text-2xl font-bold hover:bg-olive-400 transition-all shadow-lg active:scale-95"
            >
              حفظ البيانات
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
