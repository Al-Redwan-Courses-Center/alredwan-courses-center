"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { WeeklySchedule } from "@/actions/admin-schedules";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createCourseSchedule,
  createSupervisionSchedule,
  deleteCourseSchedule,
  deleteSupervisionSchedule,
} from "@/actions/admin-schedules";
import DataViewLegacy from "@/components/ui/data-view/DataView";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "@/components/ui/data-view/DataViewRow";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import MicrosoftExcelLogo from "@/components/icons/microsoftExcelLogo.svg";
import SearchIcon from "@/components/icons/searchIcon.svg";
import ExportIcon from "@/components/icons/exportIcon.svg";
import DeleteIcon from "@/components/icons/deleteIcon.svg";
import TimePickerPopover from "@/components/ui/TimePickerPopover";
import AddScheduleModal from "./AddScheduleModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import toast from "react-hot-toast";

const DAYS = [
  { label: "S", value: 6, full: "السبت" },
  { label: "S", value: 0, full: "الأحد" },
  { label: "M", value: 1, full: "الاثنين" },
  { label: "T", value: 2, full: "الثلاثاء" },
  { label: "W", value: 3, full: "الأربعاء" },
  { label: "T", value: 4, full: "الخميس" },
  { label: "F", value: 5, full: "الجمعة" },
];

export default function SeasonSchedulesView({
  initialSchedules,
  courses = [],
  instructors = [],
}: {
  initialSchedules: WeeklySchedule[];
  courses?: any[];
  instructors?: any[];
}) {
  const router = useRouter();
  const [schedules, setSchedules] =
    useState<WeeklySchedule[]>(initialSchedules);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("06:00 pm");
  const [endTime, setEndTime] = useState("11:00 pm");
  const [sortBy, setSortBy] = useState<"name" | "time">("time");
  const [filterType, setFilterType] = useState<
    "all" | "lecture" | "supervision"
  >("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<
    "lecture" | "supervision"
  >("lecture");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  const filteredSchedules = useMemo(() => {
    const result = schedules.filter((s) => {
      const matchesSearch =
        s.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDay = selectedDay === null || s.weekday === selectedDay;
      const matchesType = filterType === "all" || s.type === filterType;

      return matchesSearch && matchesDay && matchesType;
    });

    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.course_name ?? "").localeCompare(b.course_name ?? "");
      }
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    });

    return result;
  }, [schedules, searchQuery, selectedDay, filterType, sortBy]);

  const confirmDelete = async () => {
    if (scheduleToDelete !== null) {
      const schedule = schedules.find((s) => s.id === scheduleToDelete);
      if (!schedule) return;

      let res;
      if (schedule.type === "lecture") {
        // Find the course ID for this schedule
        const course = courses.find((c) => c.name === schedule.course_name);
        if (course) {
          res = await deleteCourseSchedule(course.id, schedule.id);
        } else {
          toast.error("لا يمكن العثور على الدورة المرتبطة بهذا الموعد");
          return;
        }
      } else {
        res = await deleteSupervisionSchedule(schedule.id);
      }

      if (res?.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleToDelete));
        toast.success("تم الحذف بنجاح");
        router.refresh();
      } else {
        toast.error(res?.error || "حدث خطأ أثناء الحذف");
      }
      setScheduleToDelete(null);
    }
  };

  const handleAdd = async (
    newSchedule: Partial<WeeklySchedule>,
    courseId?: number,
    instructorId?: number,
  ) => {
    let res;
    if (newSchedule.type === "lecture" && courseId) {
      res = await createCourseSchedule(courseId, {
        weekday: newSchedule.weekday!,
        start_time: newSchedule.start_time!,
        end_time: newSchedule.end_time!,
      });
    } else if (newSchedule.type === "supervision" && instructorId) {
      res = await createSupervisionSchedule({
        instructor: instructorId,
        day_of_week: newSchedule.weekday!,
        start_time: newSchedule.start_time!,
        end_time: newSchedule.end_time!,
      });
    }

    if (res?.success) {
      toast.success("تمت الإضافة بنجاح");
      router.refresh(); // Refresh the page data from server
      // We can also optimistically update local state while server refreshes
      const schedule = {
        ...newSchedule,
        id: res.data?.id || Math.max(...schedules.map((s) => s.id)) + 1,
      } as WeeklySchedule;
      setSchedules((prev) => [schedule, ...prev]);
    } else {
      toast.error(res?.error || "حدث خطأ أثناء الحفظ");
    }
  };

  const handleExportExcel = () => {
    const headers = ["الدورة", "المحاضر", "الموسم", "اليوم", "الوقت", "الطلاب"];
    const rows = filteredSchedules.map((s) => [
      s.course_name,
      s.instructor_name,
      s.season_name,
      s.weekday_display,
      `${s.start_time} - ${s.end_time}`,
      s.student_count,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `جدول_المواعيد_${new Date().toLocaleDateString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("جاري تحميل الملف...");
  };

  return (
    <div className="flex flex-col gap-12 pb-40">
      {/* Day Selector & Time Filters */}
      <div className="no-scrollbar flex items-center gap-6 overflow-x-auto pb-2">
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex items-center gap-4">
            <span className="text-[1.8rem] font-semibold text-gray-500">
              اختر الوقت
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[1.6rem] text-gray-400">من</span>
              <TimePickerPopover
                value={startTime}
                onChange={setStartTime}
                trigger={
                  <div className="min-w-[120px] cursor-pointer rounded-lg bg-[#F3F3F5] px-6 py-2 text-center text-[1.8rem] font-bold text-gray-700 shadow-inner transition-colors hover:bg-gray-200">
                    {startTime}
                  </div>
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[1.6rem] text-gray-400">الي</span>
              <TimePickerPopover
                value={endTime}
                onChange={setEndTime}
                trigger={
                  <div className="bg-olive-300 hover:bg-olive-400 min-w-[120px] cursor-pointer rounded-lg px-6 py-2 text-center text-[1.8rem] font-bold text-white shadow-md transition-colors">
                    {endTime}
                  </div>
                }
              />
            </div>
          </div>

          <div className="ml-10 flex items-center gap-4">
            <span className="text-[1.8rem] font-semibold text-gray-500">
              اختر اليوم
            </span>
            <div className="flex gap-2 rounded-xl bg-[#F3F3F5] p-2 shadow-inner">
              {DAYS.map((day) => (
                <button
                  key={`${day.label}-${day.value}`}
                  onClick={() =>
                    setSelectedDay(selectedDay === day.value ? null : day.value)
                  }
                  className={cn(
                    "flex size-12 items-center justify-center rounded-lg text-2xl font-bold transition-all",
                    selectedDay === day.value
                      ? "bg-olive-300 scale-110 text-white shadow-lg"
                      : "text-gray-400 hover:bg-gray-200",
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={() => {
              setModalDefaultType("lecture");
              setIsAddModalOpen(true);
            }}
            className="bg-olive-300/20 text-olive-700 hover:bg-olive-300/30 shadow-soft rounded-xl px-8 py-3 text-xl font-bold transition-colors"
          >
            إضافة موعد جديد
          </button>
        </div>
      </div>

      {/* Search Bar & Dropdowns */}
      <div className="flex items-center gap-6">
        <div className="shadow-soft flex min-w-[300px] flex-1 items-center gap-8 rounded-[2.5rem_0] bg-[#F3F3F5] px-10 py-4">
          <Image src={SearchIcon} alt="Search" className="size-8 shrink-0" />
          <input
            placeholder="ابحث هنا عن دورة أو محاضر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[2rem] placeholder:font-semibold placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shadow-soft flex min-w-[200px] items-center justify-between gap-12 rounded-[0_2.5rem] bg-[#F3F3F5] px-10 py-4">
              <span className="text-[1.8rem] text-gray-500">
                {sortBy === "name" ? "ترتيب بالاسم" : "ترتيب بالوقت"}
              </span>
              <ChevronDown className="size-6 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-50 min-w-[200px] rounded-xl bg-white p-2 shadow-2xl">
            <DropdownMenuItem
              onClick={() => setSortBy("name")}
              className="font-medad cursor-pointer rounded-lg p-4 text-xl hover:bg-gray-100"
            >
              الاسم
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("time")}
              className="font-medad cursor-pointer rounded-lg p-4 text-xl hover:bg-gray-100"
            >
              الوقت
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shadow-soft flex min-w-[200px] items-center justify-between gap-12 rounded-[0_2.5rem] bg-[#F3F3F5] px-10 py-4">
              <span className="text-[1.8rem] text-gray-500">
                {filterType === "all"
                  ? "كل الفئات"
                  : filterType === "lecture"
                    ? "محاضرات"
                    : "إشراف"}
              </span>
              <ChevronDown className="size-6 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="font-medad z-50 min-w-[200px] rounded-xl bg-white p-2 shadow-2xl">
            <DropdownMenuItem
              onClick={() => setFilterType("all")}
              className="cursor-pointer rounded-lg p-4 text-xl hover:bg-gray-100"
            >
              كل الفئات
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterType("lecture")}
              className="cursor-pointer rounded-lg p-4 text-xl hover:bg-gray-100"
            >
              محاضرات
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterType("supervision")}
              className="cursor-pointer rounded-lg p-4 text-xl hover:bg-gray-100"
            >
              إشراف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={handleExportExcel}
          className="shadow-soft rounded-xl bg-[#F3F3F5] p-1 transition-colors hover:bg-gray-200"
        >
          <Image src={MicrosoftExcelLogo} alt="Excel" className="size-18" />
        </button>
      </div>

      {/* Single Data Table */}
      <div className="mt-10">
        <DataViewLegacy
          gridLayout="grid-cols-[minmax(0,0.4fr)_minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)]"
          data={filteredSchedules}
          filterConfig={{}}
          sortConfig={{}}
          maxItemsPerPage={10}
        >
          <div className="w-full overflow-x-auto">
            <div className="flex min-w-[1200px] flex-col gap-4">
              <DataViewHeaderLegacy className="shadow-soft mb-2 h-[70px] items-center rounded-[20px_0] border-none bg-[#C8D0CB] px-10">
                <DataViewCellLegacy className="font-['Medad_Platinum'] text-[20px] leading-[18px] font-normal text-gray-500">
                  م
                </DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] text-[20px] leading-[18px] font-normal text-gray-500">
                  الدورة
                </DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] text-[20px] leading-[18px] font-normal text-gray-500">
                  المحاضر
                </DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] text-[20px] leading-[18px] font-normal text-gray-500">
                  الموسم
                </DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] text-[20px] leading-[18px] font-normal text-gray-500">
                  الايام
                </DataViewCellLegacy>
                <DataViewCellLegacy className="text-center font-['Medad_Platinum'] text-[20px] leading-[18px] font-normal text-gray-500">
                  عدد الطلاب
                </DataViewCellLegacy>
                <DataViewCellLegacy className="flex items-center justify-end">
                  {/* Redundant add button removed from here */}
                </DataViewCellLegacy>
              </DataViewHeaderLegacy>

              <DataViewBodyLegacy<WeeklySchedule>
                render={{
                  table: (item, i) => (
                    <DataViewRowLegacy
                      index={i}
                      key={`${item.type}-${item.id}`}
                      className="shadow-soft mb-4 h-[70px] items-center rounded-2xl border-none bg-white px-10 transition-none"
                    >
                      <DataViewCellLegacy className="text-right font-['El_Messiri'] text-[14px] leading-[20px] font-medium text-gray-900">
                        {toHindiDigits(i + 1)}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="flex items-center gap-4 overflow-hidden text-right">
                        <span className="overflow-hidden font-['El_Messiri'] text-[14px] font-medium text-ellipsis whitespace-nowrap text-gray-900">
                          {item.course_name}
                        </span>
                        <span className="rounded-full bg-gray-100 px-4 py-1 text-[12px] font-bold whitespace-nowrap text-gray-700">
                          {formatTime(item.start_time)} -{" "}
                          {formatTime(item.end_time)}
                        </span>
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="text-right font-['El_Messiri'] text-[14px] leading-[20px] font-medium text-gray-900">
                        {item.instructor_name}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="text-right font-['El_Messiri'] text-[14px] leading-[20px] font-medium text-gray-900">
                        {item.season_name}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="text-right font-['El_Messiri'] text-[14px] leading-[20px] font-medium text-gray-900">
                        {item.weekday_display}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="text-center font-['El_Messiri'] text-[14px] leading-[20px] font-medium text-gray-900">
                        {toHindiDigits(item.student_count || 0)}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="flex items-center justify-end gap-6">
                        <button
                          onClick={() => {
                            setScheduleToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-400 transition-transform hover:scale-110"
                        >
                          <Image
                            src={DeleteIcon}
                            alt="Delete"
                            className="size-8"
                          />
                        </button>
                      </DataViewCellLegacy>
                    </DataViewRowLegacy>
                  ),
                  cards: () => null,
                }}
              />
            </div>
          </div>
          <div className="mt-20 border-t border-gray-100 pt-10">
            <DataViewPaginationLegacy />
          </div>
        </DataViewLegacy>
      </div>

      {/* Add Modal */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
        defaultType={modalDefaultType}
        courses={courses}
        instructors={instructors}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        description="هل أنت متأكد من رغبتك في حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
