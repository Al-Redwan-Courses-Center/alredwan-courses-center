"use client";

import DatePicker from "@/components/courses/DatePicker";
import TimePicker from "@/components/courses/TimePicker";
import WeekdayPicker from "@/components/courses/WeekdayPicker";
import NotepadIcon from "@/components/icons/NotepadIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  cn,
  formatTime,
  getWeekDay
} from "@/lib/utils";
import { CourseDetail } from "@/types/entities";
import { PickerValue } from "@mui/x-date-pickers/internals";
import {
  format,
  parse,
  parseISO,
} from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";

export interface CourseDetailsInputs {
  course_title: string;
  description: string;
  weekdays: { day: number; start: PickerValue; end: PickerValue }[];
  date_range: DateRange;
}

const labelStyles = cn("text-[2rem] font-bold text-gray-500 flex items-center gap-2 mb-2");

export default function CourseDetailsForm({
  course,
}: {
  course: CourseDetail | null;
}) {
  const [activeClockId, setActiveClockId] = useState("1-start");
  const [activeClockDay, activeClockSide] = activeClockId.split("-") as [
    string,
    "start" | "end",
  ];

  const {
    register,
    watch,
    setValue,
    // handleSubmit,
    // formState: { errors },
  } = useForm<CourseDetailsInputs>({
    defaultValues: {
      course_title: course?.name,
      description: course?.description,
      weekdays: course?.schedules.map((s) => ({
        day: s.weekday,
        start: parse(s.start_time, "HH:mm", new Date()),
        end: parse(s.end_time, "HH:mm", new Date()),
      })) || [],
      date_range: {
        from: course?.start_date ? parseISO(course.start_date) : undefined,
        to: course?.end_date ? parseISO(course.end_date) : undefined,
      },
    },
  });

  const weekdays = watch("weekdays");
  const dateRange = watch("date_range");

  const currentWeekDay = weekdays.find((w) => String(w.day) === activeClockDay);

  return (
    <form className="flex grow flex-col gap-10">
      <div className="grid h-full grid-cols-[1.2fr_2fr_1.5fr] gap-x-12">
        
        {/* 
        //
        // MARK: Time Select (Column 1)
        //
        */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-soft p-8 flex flex-col items-center">
            <div className="mb-6 flex flex-wrap items-start justify-center gap-4">
            {weekdays
                .sort((a, b) => {
                const dayA = (a.day + 1) % 7;
                const dayB = (b.day + 1) % 7;
                return dayA - dayB;
                })
                .map((w) => (
                <button
                    key={w.day}
                    type="button"
                    className={cn(
                    "w-16 rounded-lg py-2 text-lg font-bold transition-colors",
                    currentWeekDay?.day === w.day
                        ? "bg-olive-400 text-white"
                        : "bg-gray-200 text-gray-600",
                    )}
                    onClick={() => setActiveClockId(`${w.day}-start`)}
                >
                    {getWeekDay(w.day).substring(0, 3)}
                </button>
                ))}
            </div>

            <div className="mb-8 flex flex-col items-center gap-4 w-full">
                <div
                    onClick={() => setActiveClockId(`${activeClockDay}-start`)}
                    className={cn(
                        "flex w-full cursor-pointer flex-col items-center gap-1 rounded-2xl border-b-2 px-4 py-3 transition-colors shadow-sm",
                        activeClockSide === "start" ? "bg-olive-50 border-olive-400" : "bg-white border-transparent",
                    )}
                >
                    <span className="text-gray-400 text-lg">وقت البداية</span>
                    <span className="text-3xl font-bold text-olive-700">
                        {currentWeekDay && currentWeekDay.start
                        ? formatTime(format(currentWeekDay?.start, "HH:mm"))
                        : "7 : 00 AM"}
                    </span>
                </div>

                <div
                    onClick={() => setActiveClockId(`${activeClockDay}-end`)}
                    className={cn(
                        "flex w-full cursor-pointer flex-col items-center gap-1 rounded-2xl border-b-2 px-4 py-3 transition-colors shadow-sm",
                        activeClockSide === "end" ? "bg-olive-50 border-olive-400" : "bg-white border-transparent",
                    )}
                >
                    <span className="text-gray-400 text-lg">وقت النهاية</span>
                    <span className="text-3xl font-bold text-olive-700">
                        {currentWeekDay && currentWeekDay.end
                        ? formatTime(format(currentWeekDay.end, "HH:mm"))
                        : "8 : 00 AM"}
                    </span>
                </div>
            </div>

            {activeClockDay && activeClockSide && (
                <div className="w-full grow flex items-center justify-center">
                    <TimePicker
                        value={(currentWeekDay?.[activeClockSide] as Date) || new Date()}
                        activeClockId={activeClockId}
                        onSelect={(value) => {
                            setValue(
                            "weekdays",
                            weekdays.map((w) => {
                                if (w.day !== +activeClockDay) return w;
                                return { ...w, [activeClockSide]: value };
                            }),
                            );
                        }}
                    />
                </div>
            )}
        </div>

        {/* 
        //
        // MARK: Days & Calendar (Column 2)
        //
        */}
        <div className="flex flex-col gap-10">
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-soft p-8">
                <WeekdayPicker
                    labelStyles={labelStyles}
                    setValue={setValue}
                    weekdays={weekdays}
                />
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-soft p-6 grow">
                <DatePicker
                    range={dateRange}
                    onRangeChange={(range) => setValue("date_range", range)}
                    defaultMonth={dateRange.from || new Date()}
                />
            </div>
        </div>

        {/* 
        //
        // MARK: Description & Title (Column 3)
        //
        */}
        <div className="flex flex-col gap-10">
            <div className="flex flex-col">
                <label htmlFor="courseName" className={labelStyles}>
                    <Pencil size={20} className="text-olive-400" />
                    اسم الدورة
                </label>
                <Input
                    id="courseName"
                    shape="square"
                    placeholder="تفسير القرآن الكريم"
                    inputStyles={cn("w-full text-2xl bg-white/60 border-none shadow-soft rounded-xl py-4")}
                    registerReturn={register("course_title")}
                />
            </div>

            <div className="flex flex-col grow">
                <label htmlFor="description" className={labelStyles}>
                    <Pencil size={20} className="text-olive-400" />
                    الوصـــــــــف
                </label>
                <textarea
                    id="description"
                    placeholder="تحفيظ وتدريس القران الكريم - مستوى متقدم"
                    className="shadow-soft grow w-full resize-none bg-white/60 backdrop-blur-sm border-none rounded-2xl px-10 py-8 text-2xl placeholder:text-2xl focus:ring-2 focus:ring-olive-200 transition-all outline-none"
                    {...register("description")}
                />
            </div>
        </div>
      </div>

      <div className="flex justify-start mt-4">
        <Button size="large" className="px-16 py-4 rounded-[0.5rem_2rem] text-2xl shadow-lg">
            حفظ التغييرات
        </Button>
      </div>
    </form>
  );
}
