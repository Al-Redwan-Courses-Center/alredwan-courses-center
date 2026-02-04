"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { cn } from "@/lib/utils";

const navigationBtnStyles = cn(
  "aspect-square h-full w-auto place-items-center",
);

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root, classNames?.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
          classNames?.months,
        ),
        month: cn(
          "flex w-full flex-col gap-4",
          defaultClassNames.month,
          classNames?.month,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
          classNames?.nav,
        ),
        button_previous: cn(
          navigationBtnStyles,
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
          classNames?.button_previous,
        ),
        button_next: cn(
          navigationBtnStyles,
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
          classNames?.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
          classNames?.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
          classNames?.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input has-focus:ring-ring/50 relative rounded-md border shadow-xs has-focus:ring-[3px]",
          defaultClassNames.dropdown_root,
          classNames?.dropdown_root,
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown,
          classNames?.dropdown,
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
          classNames?.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays, classNames?.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 rounded-md text-[0.8rem] font-normal select-none",
          defaultClassNames.weekday,
          classNames?.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week, classNames?.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header,
          classNames?.week_number_header,
        ),
        week_number: cn(
          "text-muted-foreground text-[0.8rem] select-none",
          defaultClassNames.week_number,
          classNames?.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none",
          defaultClassNames.day,
          classNames?.day,
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start,
          classNames?.range_start,
        ),
        range_middle: cn(
          "rounded-none",
          defaultClassNames.range_middle,
          classNames?.range_middle,
        ),
        range_end: cn(
          "bg-accent rounded-r-md",
          defaultClassNames.range_end,
          classNames?.range_end,
        ),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today,
          classNames?.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
          classNames?.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
          classNames?.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden, classNames?.hidden),
        // ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <div>
      {(modifiers.range_start || modifiers.range_end) && (
        <div className="bg-olive-500 absolute z-10 size-full rounded-full" />
      )}
      <button
        ref={ref}
        data-day={day.date.toLocaleDateString()}
        data-selected-single={
          modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle
        }
        data-range-start={modifiers.range_start}
        data-range-end={modifiers.range_end}
        data-range-middle={modifiers.range_middle}
        className={cn(
          "relative flex aspect-square size-auto w-full min-w-10 flex-col justify-center gap-1 leading-none font-normal text-gray-900",
          "z-20",
          "[&>span]:relative [&>span]:z-20 [&>span]:text-xs [&>span]:opacity-70",

          modifiers.range_start || modifiers.range_end
            ? "hover:bg-olive-500 text-gray-100"
            : "hover:bg-gray-200",

          "group-data-[focused=true]/day:z-30",
          "group-data-[focused=true]/day:border-gray-500 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-gray-500/50",

          "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-gray-200",

          "data-[range-end=true]:bg-olive-500 data-[range-end=true]:rounded-full",
          "data-[range-end=true]:bg-transparent",
          "rounded-full",
          "data-[range-end=true]:text-gray-100",

          // "data-[selected-single=true]:bg-black data-[selected-single=true]:text-[#ff0]",

          defaultClassNames.day,
          className,
        )}
        {...props}
      />
      {(modifiers.range_start || modifiers.range_end) && (
        <div
          className={cn(
            "absolute top-0 h-full w-1/2 bg-gray-200",
            modifiers.range_start ? "end-0" : "",
          )}
        />
      )}
    </div>
  );
}

export { Calendar, CalendarDayButton };
