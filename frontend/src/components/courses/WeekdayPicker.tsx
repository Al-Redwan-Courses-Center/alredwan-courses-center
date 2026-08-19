import type { PickerValue } from "@mui/x-date-pickers/internals";
import { parse } from "date-fns";
import type { UseFormSetValue } from "react-hook-form";
import type { CourseDetailsInputs } from "@/components/courses/CourseDetailsForm";
import { cn } from "@/lib/utils";

const daySelectionBtnStyles = cn(
  "text-olive-900 hover:bg-olive-100 aspect-square h-auto w-17 rounded-[0.7rem] font-bold transition-colors",
);

function toggleDay(
  day: number,
  controllers: {
    setValue: UseFormSetValue<CourseDetailsInputs>;
    weekdays: { day: number; start: PickerValue; end: PickerValue }[];
  },
) {
  const { setValue, weekdays } = controllers;
  const isSelected = weekdays.find((w) => w.day === day);

  if (isSelected)
    return setValue(
      "weekdays",
      weekdays.filter((w) => w.day !== day),
    );
  setValue("weekdays", [
    ...weekdays,
    {
      day,
      start: parse("12:00", "HH:mm", new Date()),
      end: parse("14:00", "HH:mm", new Date()),
    },
  ]);
}

export default function WeekdayPicker({
  labelStyles,
  weekdays,
  setValue,
}: {
  labelStyles: string;
  weekdays: { day: number; start: PickerValue; end: PickerValue }[];
  setValue: UseFormSetValue<CourseDetailsInputs>;
}) {
  return (
    <div className="flex items-center gap-10">
      <label className={labelStyles}>الأيـــــــــام</label>

      <div className="flex items-center gap-2 text-4xl" dir="ltr">
        <button
          type="button"
          onClick={() =>
            toggleDay(6, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 6) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          S
        </button>
        <button
          type="button"
          onClick={() =>
            toggleDay(0, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 0) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          S
        </button>
        <button
          type="button"
          onClick={() =>
            toggleDay(1, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 1) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          M
        </button>
        <button
          type="button"
          onClick={() =>
            toggleDay(2, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 2) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          T
        </button>
        <button
          type="button"
          onClick={() =>
            toggleDay(3, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 3) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          W
        </button>
        <button
          type="button"
          onClick={() =>
            toggleDay(4, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 4) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          T
        </button>
        <button
          type="button"
          onClick={() =>
            toggleDay(5, {
              setValue,
              weekdays,
            })
          }
          className={cn(
            daySelectionBtnStyles,
            !!weekdays.find((w) => w.day === 5) &&
              "bg-olive-300 hover:bg-olive-300",
          )}
        >
          F
        </button>
      </div>
    </div>
  );
}
