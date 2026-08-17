"use client";

import { ChevronDown, Plus, Trash2, Calendar, LayoutGrid, List, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  createSupervisionSchedule,
  deleteSupervisionSchedule,
  updateSupervisionSchedule,
} from "@/actions/admin-schedules";
import type { SupervisorSchedule } from "@/types/entities/schedules";
import type { Instructor } from "@/types/entities/instructors";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import AddScheduleModal from "./AddScheduleModal";

const DAYS = [
  { value: 0, label: "السبت" },
  { value: 1, label: "الأحد" },
  { value: 2, label: "الاثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
  { value: 6, label: "الجمعة" },
];

export default function SupervisorScheduleView({
  initialSchedules,
  instructors = [],
}: {
  initialSchedules: SupervisorSchedule[];
  instructors?: Instructor[];
}) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<SupervisorSchedule[]>(initialSchedules);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"week" | "day">("week");
  const [activeDayTab, setActiveDayTab] = useState<number>(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedDay, setPreselectedDay] = useState<number>(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<SupervisorSchedule | null>(null);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      return selectedInstructorId === null || s.instructor === selectedInstructorId;
    });
  }, [schedules, selectedInstructorId]);

  const schedulesByDay = useMemo(() => {
    const map: Record<number, SupervisorSchedule[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    filteredSchedules.forEach((s) => {
      if (map[s.day_of_week] !== undefined) {
        map[s.day_of_week].push(s);
      }
    });
    Object.keys(map).forEach((dayKey) => {
      const day = Number(dayKey);
      map[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [filteredSchedules]);

  const handleOpenAddModal = (day: number) => {
    setPreselectedDay(day);
    setIsAddModalOpen(true);
  };

  const handleAdd = async (
    newSchedule: any,
    courseId?: number,
    instructorId?: number
  ) => {
    if (!instructorId) {
      toast.error("يرجى اختيار المشرف");
      return;
    }

    if (scheduleToEdit) {
      const res = await updateSupervisionSchedule(scheduleToEdit.id, {
        instructor: instructorId,
        day_of_week: newSchedule.weekday,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        grace_period_minutes: newSchedule.grace_period_minutes,
        auto_absent_after_minutes: newSchedule.auto_absent_after_minutes,
      });

      if (res?.success) {
        toast.success("تم تعديل فترة الإشراف بنجاح");
        router.refresh();
        const updated: SupervisorSchedule = {
          id: scheduleToEdit.id,
          instructor: instructorId,
          instructor_name: instructors.find((i) => i.id === instructorId)?.name || "غير معروف",
          day_of_week: newSchedule.weekday,
          day_display: DAYS.find((d) => d.value === newSchedule.weekday)?.label || "",
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          grace_period_minutes: newSchedule.grace_period_minutes || 20,
          auto_absent_after_minutes: newSchedule.auto_absent_after_minutes || 60,
        };
        setSchedules((prev) => prev.map((s) => (s.id === scheduleToEdit.id ? updated : s)));
        setScheduleToEdit(null);
      } else {
        toast.error(res?.error || "حدث خطأ أثناء الحفظ");
      }
      return;
    }

    const res = await createSupervisionSchedule({
      instructor: instructorId,
      day_of_week: newSchedule.weekday,
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      grace_period_minutes: newSchedule.grace_period_minutes,
      auto_absent_after_minutes: newSchedule.auto_absent_after_minutes,
    });

    if (res?.success) {
      toast.success("تم إضافة فترة الإشراف بنجاح");
      router.refresh();
      const added: SupervisorSchedule = {
        id: res.data?.id || Date.now(),
        instructor: instructorId,
        instructor_name: instructors.find((i) => i.id === instructorId)?.name || "غير معروف",
        day_of_week: newSchedule.weekday,
        day_display: DAYS.find((d) => d.value === newSchedule.weekday)?.label || "",
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        grace_period_minutes: newSchedule.grace_period_minutes || 20,
        auto_absent_after_minutes: newSchedule.auto_absent_after_minutes || 60,
      };
      setSchedules((prev) => [added, ...prev]);
    } else {
      toast.error(res?.error || "حدث خطأ أثناء الحفظ");
    }
  };

  const confirmDelete = async () => {
    if (scheduleToDelete !== null) {
      const res = await deleteSupervisionSchedule(scheduleToDelete);
      if (res?.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleToDelete));
        toast.success("تم حذف فترة الإشراف بنجاح");
        router.refresh();
      } else {
        toast.error(res?.error || "حدث خطأ أثناء الحفظ");
      }
      setScheduleToDelete(null);
    }
  };

  const selectedInstructorName = useMemo(() => {
    if (selectedInstructorId === null) return "كل المشرفين";
    return instructors.find((i) => i.id === selectedInstructorId)?.name || "كل المشرفين";
  }, [selectedInstructorId, instructors]);

  return (
    <div className="flex flex-col gap-12 pb-40">
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shadow-soft bg-[#F3F3F5] rounded-[0_2.5rem] flex items-center justify-between gap-12 px-10 py-4 min-w-[240px]">
                <span className="text-[1.8rem] text-gray-500 font-medad">
                  {selectedInstructorName}
                </span>
                <ChevronDown className="size-6 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[240px] bg-white shadow-2xl rounded-xl z-50 p-2 max-h-[300px] overflow-y-auto">
              <DropdownMenuItem
                onClick={() => setSelectedInstructorId(null)}
                className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg font-medad text-right"
              >
                كل المشرفين
              </DropdownMenuItem>
              {instructors.map((i) => (
                <DropdownMenuItem
                  key={i.id}
                  onClick={() => setSelectedInstructorId(i.id)}
                  className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg font-medad text-right"
                >
                  {i.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex bg-[#F3F3F5] p-2 rounded-2xl gap-2 shadow-inner">
            <button
              onClick={() => setViewType("week")}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2 text-xl font-bold",
                viewType === "week"
                  ? "bg-white text-olive-700 shadow-md scale-105"
                  : "text-gray-400 hover:bg-gray-200"
              )}
            >
              <LayoutGrid className="size-5" />
              <span>الجدول الأسبوعي</span>
            </button>
            <button
              onClick={() => setViewType("day")}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2 text-xl font-bold",
                viewType === "day"
                  ? "bg-white text-olive-700 shadow-md scale-105"
                  : "text-gray-400 hover:bg-gray-200"
              )}
            >
              <List className="size-5" />
              <span>عرض الأيام</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => handleOpenAddModal(0)}
          className="bg-olive-300 hover:bg-olive-400 text-white px-10 py-4 rounded-2xl text-xl font-bold flex items-center gap-3 transition-colors shadow-soft"
        >
          <Plus className="size-6" />
          <span>إضافة فترة إشراف</span>
        </button>
      </div>

      {viewType === "week" ? (
        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6 mt-6">
          {DAYS.map((day) => {
            const dayShifts = schedulesByDay[day.value] || [];

            return (
              <div
                key={day.value}
                className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col gap-6 min-h-[400px]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <span className="text-[2rem] font-bold text-olive-700">{day.label}</span>
                  <span className="bg-olive-300/10 text-olive-700 text-lg px-3 py-1 rounded-full font-bold">
                    {toHindiDigits(dayShifts.length)} فترات
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[500px] no-scrollbar">
                  {dayShifts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-300 py-10">
                      <Calendar className="size-12 mb-3 stroke-[1.5]" />
                      <span className="text-lg">لا يوجد فترات</span>
                    </div>
                  ) : (
                    dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-200/50 flex flex-col gap-3 group hover:shadow-soft transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xl font-bold text-gray-800 leading-snug">
                            {shift.instructor_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setScheduleToEdit(shift);
                                setIsAddModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-olive-700 p-1 rounded hover:bg-gray-100 transition-colors shrink-0"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => {
                                setScheduleToDelete(shift.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors shrink-0"
                            >
                              <Trash2 className="size-5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[1.3rem] text-olive-600 bg-olive-300/5 py-1 px-3 rounded-lg font-semibold self-start">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => handleOpenAddModal(day.value)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-olive-300 text-gray-400 hover:text-olive-700 rounded-2xl flex items-center justify-center gap-2 transition-all text-lg font-bold"
                >
                  <Plus className="size-5" />
                  <span>إضافة فترة</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-6 bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
          <div className="flex bg-[#F3F3F5] p-2 rounded-2xl gap-2 max-w-2xl">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => setActiveDayTab(day.value)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-xl font-bold transition-all",
                  activeDayTab === day.value
                    ? "bg-white text-olive-700 shadow-md scale-105"
                    : "text-gray-400 hover:bg-gray-200"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {(schedulesByDay[activeDayTab] || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <Calendar className="size-16 mb-4 stroke-[1.5]" />
                <span className="text-2xl font-bold">لا توجد فترات إشراف في هذا اليوم</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(schedulesByDay[activeDayTab] || []).map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-[#F8F9FA] rounded-3xl p-6 border border-gray-200/50 flex items-center justify-between shadow-sm hover:shadow-soft transition-all"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-2xl font-bold text-gray-900">{shift.instructor_name}</span>
                      <span className="text-lg text-olive-600 bg-olive-300/10 px-3 py-1 rounded-full font-bold">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setScheduleToEdit(shift);
                          setIsAddModalOpen(true);
                        }}
                        className="p-3 text-gray-400 hover:text-olive-700 hover:bg-gray-100 rounded-2xl transition-colors"
                      >
                        <Edit2 className="size-5" />
                      </button>
                      <button
                        onClick={() => {
                          setScheduleToDelete(shift.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                      >
                        <Trash2 className="size-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setScheduleToEdit(null);
        }}
        onAdd={handleAdd}
        fixedType="supervision"
        instructors={instructors}
        editSchedule={scheduleToEdit || undefined}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="تأكيد حذف الإشراف"
        description="هل أنت متأكد من رغبتك في حذف فترة الإشراف هذه؟"
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
