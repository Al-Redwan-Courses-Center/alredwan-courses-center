"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { WeeklySchedule } from "@/actions/admin-schedules";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCourseSchedule, createSupervisionSchedule, deleteCourseSchedule, deleteSupervisionSchedule } from "@/actions/admin-schedules";
import DataViewLegacy from "@/components/ui/data-view/DataView";
import { DataViewHeaderLegacy, DataViewRowLegacy } from "@/components/ui/data-view/DataViewRow";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
  const [schedules, setSchedules] = useState<WeeklySchedule[]>(initialSchedules);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("06:00 pm");
  const [endTime, setEndTime] = useState("11:00 pm");
  const [sortBy, setSortBy] = useState<"name" | "time">("time");
  const [filterType, setFilterType] = useState<"all" | "lecture" | "supervision">("all");
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<"lecture" | "supervision">("lecture");
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  const filteredSchedules = useMemo(() => {
    let result = schedules.filter((s) => {
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
      const schedule = schedules.find(s => s.id === scheduleToDelete);
      if (!schedule) return;

      let res;
      if (schedule.type === "lecture") {
        // Find the course ID for this schedule
        const course = courses.find(c => c.name === schedule.course_name);
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
        setSchedules(prev => prev.filter(s => s.id !== scheduleToDelete));
        toast.success("تم الحذف بنجاح");
        router.refresh();
      } else {
        toast.error(res?.error || "حدث خطأ أثناء الحذف");
      }
      setScheduleToDelete(null);
    }
  };

  const handleAdd = async (newSchedule: Partial<WeeklySchedule>, courseId?: number, instructorId?: number) => {
    let res;
    if (newSchedule.type === "lecture" && courseId) {
      res = await createCourseSchedule(courseId, {
        weekday: newSchedule.weekday!,
        start_time: newSchedule.start_time!,
        end_time: newSchedule.end_time!
      });
    } else if (newSchedule.type === "supervision" && instructorId) {
      res = await createSupervisionSchedule({
        instructor: instructorId,
        day_of_week: newSchedule.weekday!,
        start_time: newSchedule.start_time!,
        end_time: newSchedule.end_time!
      });
    }

    if (res?.success) {
      toast.success("تمت الإضافة بنجاح");
      router.refresh(); // Refresh the page data from server
      // We can also optimistically update local state while server refreshes
      const schedule = {
        ...newSchedule,
        id: res.data?.id || Math.max(...schedules.map(s => s.id)) + 1,
      } as WeeklySchedule;
      setSchedules(prev => [schedule, ...prev]);
    } else {
      toast.error(res?.error || "حدث خطأ أثناء الحفظ");
    }
  };

  const handleExportExcel = () => {
    const headers = ["الدورة", "المحاضر", "الموسم", "اليوم", "الوقت", "الطلاب"];
    const rows = filteredSchedules.map(s => [
      s.course_name,
      s.instructor_name,
      s.season_name,
      s.weekday_display,
      `${s.start_time} - ${s.end_time}`,
      s.student_count
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `جدول_المواعيد_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("جاري تحميل الملف...");
  };

  return (
    <div className="flex flex-col gap-12 pb-40">
      {/* Day Selector & Time Filters */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-10 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-[1.8rem] text-gray-500 font-semibold">اختر الوقت</span>
            <div className="flex items-center gap-2">
              <span className="text-[1.6rem] text-gray-400">من</span>
              <TimePickerPopover
                value={startTime}
                onChange={setStartTime}
                trigger={
                  <div className="bg-[#F3F3F5] px-6 py-2 rounded-lg text-[1.8rem] font-bold text-gray-700 min-w-[120px] text-center shadow-inner cursor-pointer hover:bg-gray-200 transition-colors">
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
                  <div className="bg-olive-300 px-6 py-2 rounded-lg text-[1.8rem] font-bold text-white min-w-[120px] text-center shadow-md cursor-pointer hover:bg-olive-400 transition-colors">
                    {endTime}
                  </div>
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-10">
            <span className="text-[1.8rem] text-gray-500 font-semibold">اختر اليوم</span>
            <div className="flex bg-[#F3F3F5] p-2 rounded-xl gap-2 shadow-inner">
              {DAYS.map((day) => (
                <button
                  key={`${day.label}-${day.value}`}
                  onClick={() => setSelectedDay(selectedDay === day.value ? null : day.value)}
                  className={cn(
                    "size-12 flex items-center justify-center rounded-lg text-2xl font-bold transition-all",
                    selectedDay === day.value 
                      ? "bg-olive-300 text-white shadow-lg scale-110" 
                      : "text-gray-400 hover:bg-gray-200"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button 
            onClick={() => {
              setModalDefaultType("lecture");
              setIsAddModalOpen(true);
            }}
            className="bg-olive-300/20 text-olive-700 px-8 py-3 rounded-xl text-xl font-bold hover:bg-olive-300/30 transition-colors shadow-soft"
          >
            إضافة موعد جديد
          </button>
        </div>
      </div>

      {/* Search Bar & Dropdowns */}
      <div className="flex items-center gap-6">
        <div className="flex-1 min-w-[300px] shadow-soft bg-[#F3F3F5] rounded-[2.5rem_0] flex items-center gap-8 px-10 py-4">
          <Image src={SearchIcon} alt="Search" className="size-8 shrink-0" />
          <input
            placeholder="ابحث هنا عن دورة أو محاضر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-[2rem] placeholder:font-semibold placeholder:text-gray-400"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shadow-soft bg-[#F3F3F5] rounded-[0_2.5rem] flex items-center justify-between gap-12 px-10 py-4 min-w-[200px]">
              <span className="text-[1.8rem] text-gray-500">
                {sortBy === "name" ? "ترتيب بالاسم" : "ترتيب بالوقت"}
              </span>
              <ChevronDown className="size-6 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px] bg-white shadow-2xl rounded-xl z-50 p-2">
            <DropdownMenuItem onClick={() => setSortBy("name")} className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg font-medad">الاسم</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("time")} className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg font-medad">الوقت</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shadow-soft bg-[#F3F3F5] rounded-[0_2.5rem] flex items-center justify-between gap-12 px-10 py-4 min-w-[200px]">
              <span className="text-[1.8rem] text-gray-500">
                {filterType === "all" ? "كل الفئات" : filterType === "lecture" ? "محاضرات" : "إشراف"}
              </span>
              <ChevronDown className="size-6 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px] bg-white shadow-2xl rounded-xl z-50 p-2 font-medad">
            <DropdownMenuItem onClick={() => setFilterType("all")} className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg">كل الفئات</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("lecture")} className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg">محاضرات</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("supervision")} className="text-xl p-4 cursor-pointer hover:bg-gray-100 rounded-lg">إشراف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button 
          onClick={handleExportExcel}
          className="shadow-soft bg-[#F3F3F5] rounded-xl p-1 hover:bg-gray-200 transition-colors"
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
            <div className="min-w-[1200px] flex flex-col gap-4">
              <DataViewHeaderLegacy 
                className="bg-[#C8D0CB] h-[70px] shadow-soft rounded-[20px_0] px-10 mb-2 border-none items-center"
              >
                <DataViewCellLegacy className="font-['Medad_Platinum'] font-[400] text-[20px] text-[#535862] leading-[18px]">م</DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] font-[400] text-[20px] text-[#535862] leading-[18px]">الدورة</DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] font-[400] text-[20px] text-[#535862] leading-[18px]">المحاضر</DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] font-[400] text-[20px] text-[#535862] leading-[18px]">الموسم</DataViewCellLegacy>
                <DataViewCellLegacy className="font-['Medad_Platinum'] font-[400] text-[20px] text-[#535862] leading-[18px]">الايام</DataViewCellLegacy>
                <DataViewCellLegacy className="text-center font-['Medad_Platinum'] font-[400] text-[20px] text-[#535862] leading-[18px]">عدد الطلاب</DataViewCellLegacy>
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
                      className="bg-white shadow-soft rounded-2xl h-[70px] px-10 border-none mb-4 items-center transition-none"
                    >
                      <DataViewCellLegacy className="font-['El_Messiri'] font-[500] text-[14px] text-[#181D27] leading-[20px] text-right">
                        {toHindiDigits(i + 1)}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="flex items-center gap-4 text-right overflow-hidden">
                        <span className="font-['El_Messiri'] font-[500] text-[14px] text-[#181D27] whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.course_name}
                        </span>
                        <span className="text-[12px] text-gray-700 font-bold whitespace-nowrap bg-gray-100 px-4 py-1 rounded-full">
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </span>
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="font-['El_Messiri'] font-[500] text-[14px] text-[#181D27] leading-[20px] text-right">
                        {item.instructor_name}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="font-['El_Messiri'] font-[500] text-[14px] text-[#181D27] leading-[20px] text-right">
                        {item.season_name}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="font-['El_Messiri'] font-[500] text-[14px] text-[#181D27] leading-[20px] text-right">
                        {item.weekday_display}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="text-center font-['El_Messiri'] font-[500] text-[14px] text-[#181D27] leading-[20px]">
                        {toHindiDigits(item.student_count || 0)}
                      </DataViewCellLegacy>
                      <DataViewCellLegacy className="flex items-center justify-end gap-6">
                        <button 
                          onClick={() => {
                            setScheduleToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-400 hover:scale-110 transition-transform"
                        >
                          <Image src={DeleteIcon} alt="Delete" className="size-8" />
                        </button>
                      </DataViewCellLegacy>
                    </DataViewRowLegacy>
                  ),
                  cards: () => null
                }}
              />
            </div>
          </div>
          <div className="pt-10 border-t border-gray-100 mt-20">
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
