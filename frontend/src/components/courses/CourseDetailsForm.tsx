"use client";

// import DatePicker from "@/components/courses/DatePicker";
// import TimePicker from "@/components/courses/TimePicker";
// import WeekdayPicker from "@/components/courses/WeekdayPicker";
import NotepadIcon from "@/components/icons/NotepadIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  cn,
  // formatTime,
  // getWeekDay
} from "@/lib/utils";
import { CourseDetail } from "@/types/entities";
import { PickerValue } from "@mui/x-date-pickers/internals";
import {
  // format,
  parse,
  parseISO,
} from "date-fns";
// import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";

export interface CourseDetailsInputs {
  course_title: string;
  description: string;
  weekdays: { day: number; start: PickerValue; end: PickerValue }[];
  date_range: DateRange;
}

const labelStyles = cn("text-[2rem] font-bold text-gray-500");

export default function CourseDetailsForm({
  course,
}: {
  course: CourseDetail | null;
}) {
  // const [activeClockId, setActiveClockId] = useState("");
  // const [activeClockDay, activeClockSide] = activeClockId.split("-") as [
  //   string,
  //   "start" | "end",
  // ];

  const {
    register,
    // watch,
    // setValue,
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
      })),
      date_range: {
        from: parseISO(course?.start_date || ""),
        to: parseISO(course?.end_date || ""),
      },
    },
  });

  // const weekdays = watch("weekdays");
  // const dateRange = watch("date_range");

  // const currentWeekDay = weekdays.find((w) => String(w.day) === activeClockDay);

  // console.log(course);

  return (
    <form className="flex grow flex-col gap-10">
      <div className="grid h-full grid-cols-[1.5fr_1.5fr_1fr] grid-rows-[auto_1fr] gap-x-26 gap-y-10">
        {/* 
      //
      // MARK: Course Name
      //
      */}
        <div className="grid grid-cols-[12rem_1fr] items-center">
          <label htmlFor="courseName" className={labelStyles}>
            اسم الدورة
          </label>

          <Input
            id="courseName"
            shape="square"
            placeholder="تفسير القرآن الكريم"
            icon={<NotepadIcon />}
            iconAlignment="end"
            inputStyles={cn("w-full text-3xl placeholder:text-3xl")}
            wrapperStyles={cn("grow")}
            registerReturn={register("course_title")}
          />
        </div>

        {/* 
      //
      // MARK: Days
      //
      */}
        {/* <WeekdayPicker
          labelStyles={labelStyles}
          setValue={setValue}
          weekdays={weekdays}
        /> */}

        {/* 
      //
      // MARK: Description
      //
      */}
        <div className="col-start-1 grid grid-cols-[12rem_1fr]">
          <label
            htmlFor="description"
            className={cn(labelStyles, "self-start")}
          >
            الوصـــــــــف
          </label>

          <textarea
            id="description"
            className="shadow-soft h-full w-full resize-none bg-gray-50 px-10 py-4 text-3xl placeholder:text-3xl focus-within:outline-none [&_input]:text-[1.8rem] [&_input::placeholder]:font-semibold [&_input::placeholder]:text-gray-600"
            {...register("description")}
          />
        </div>

        {/* 
        //
        // MARK: Date Select
        //
        */}
        {/* <DatePicker
          range={dateRange}
          onRangeChange={(range) => setValue("date_range", range)}
          defaultMonth={dateRange.from || new Date()}
        /> */}

        {/* 
        //
        // MARK: Time Select
        //
        */}
        {/* <div className="col-start-3 row-span-full grid grid-rows-[10.5rem_auto_minmax(40rem,1fr)]">
          <div className="mb-10 flex flex-wrap items-start justify-center gap-10">
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
                    "w-20 rounded-lg py-2 text-xl font-bold text-gray-950",
                    currentWeekDay?.day === w.day
                      ? "bg-olive-300"
                      : "bg-gray-300",
                  )}
                  onClick={() => setActiveClockId(`${w.day}-start`)}
                >
                  {getWeekDay(w.day)}
                </button>
              ))}
          </div>

          <div className="mb-10 flex items-center gap-10 text-2xl">
            <div
              onClick={() => setActiveClockId(`${activeClockDay}-start`)}
              className={cn(
                "flex min-w-60 cursor-pointer flex-col gap-2 rounded-t-2xl border-b-2 border-gray-500 px-6 py-3 transition-colors",
                activeClockSide === "start" ? "bg-olive-300" : "bg-gray-300",
              )}
            >
              <span
                className={cn(activeClockSide === "start" && "text-gray-100")}
              >
                وقت البداية
              </span>
              <span className="text-3xl">
                {currentWeekDay && currentWeekDay.start
                  ? formatTime(format(currentWeekDay?.start, "HH:mm"))
                  : "اختر يوماً!"}
              </span>
            </div>

            <span>إلى</span>

            <div
              onClick={() => setActiveClockId(`${activeClockDay}-end`)}
              className={cn(
                "flex min-w-60 cursor-pointer flex-col gap-2 rounded-t-2xl border-b-2 border-gray-500 px-6 py-3 transition-colors",
                activeClockSide === "end" ? "bg-olive-300" : "bg-gray-300",
              )}
            >
              <span
                className={cn(activeClockSide === "end" && "text-gray-100")}
              >
                وقت النهاية
              </span>
              <span className="text-3xl">
                {currentWeekDay && currentWeekDay.end
                  ? formatTime(format(currentWeekDay.end, "HH:mm"))
                  : "اختر يوماً!"}
              </span>
            </div>
          </div>

          {activeClockDay && activeClockSide && (
            <TimePicker
              value={currentWeekDay?.[activeClockSide] || new Date()}
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
          )}
        </div>
        */}
      </div>

      <Button size="small" className="min-w-50 self-end">
        حفظ
      </Button>
    </form>
  );
}
