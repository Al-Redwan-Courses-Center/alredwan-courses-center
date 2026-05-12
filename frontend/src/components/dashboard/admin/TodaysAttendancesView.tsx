"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useStaffAttendanceWebSocket } from "@/hooks/useStaffAttendanceWebSocket";
import DataView from "@/components/ui/data-view/DataView";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "@/components/ui/data-view/DataViewRow";
import DataViewControls from "@/components/ui/data-view/DataViewControls";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { StaffAttendanceListItem } from "@/types/entities/staff-attendance";
import StatusBadge from "@/components/ui/StatusBadge";
import ClientLocalTime from "@/components/ui/ClientLocalTime";
import { cva, VariantProps } from "class-variance-authority";
import { parseISO } from "date-fns";
import Button from "@/components/ui/Button";
import { manualCheckIn, manualCheckOut } from "@/actions/admin-attendances";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import toast from "react-hot-toast";

function calcPositionalStatus(
  checkInTime: string | null,
  checkOutTime: string | null,
): { label: string; value: "away" | "present" | "left"; className: string } {
  if (!checkInTime)
    return {
      value: "away",
      label: "لم يأتِ بعد",
      className: cn("bg-gray-200 text-gray-700"),
    };

  if (!checkOutTime)
    return {
      value: "present",
      label: "في المسجد",
      className: cn("bg-[#dae9e0] text-[#027243]"),
    };

  return {
    value: "left",
    label: "رحل",
    className: cn("bg-[#c5c8fd] text-[#1227b4]"),
  };
}

// const actionLabelMap = {
//   present: "تم التسجيل",
//   late: "تم التسجيل",
//   pending: "تم التسجيل",
//   absent: "سجل الحضور",
//   not_started: "سجل الحضور",
// } satisfies Record<StaffAttendanceListItem["status"], string>;

const timeBadgeStyles = cva(
  "grid h-11 w-40 place-items-center transition-colors",
  {
    variants: {
      status: {
        bonus: "bg-olive-300 text-gray-100",
        penalty: "bg-[#9F2E2E] text-gray-100",
        neutral: "bg-gray-200 text-gray-900",
      },
      revert: {
        true: "rounded-[1rem_0]",
        false: "rounded-[0_1rem]",
      },
    },
    defaultVariants: {
      status: "neutral",
      revert: false,
    },
  },
);

function TimeBadge({
  status,
  revert,
  children,
}: {
  status?: VariantProps<typeof timeBadgeStyles>["status"];
  revert?: VariantProps<typeof timeBadgeStyles>["revert"];
  children: ReactNode;
}) {
  return (
    <span className={timeBadgeStyles({ status, revert })}>{children}</span>
  );
}

function StaffAttendanceRow({
  attendance,
  index,
}: {
  attendance: StaffAttendanceListItem;
  index: number;
}) {
  const [nowTimestamp, setNowTimestamp] = useState<number | null>(null);
  const [scheduledCheckInTimestamp, setScheduledCheckInTimestamp] = useState<
    number | null
  >(null);
  const [scheduledCheckOutTimestamp, setScheduledCheckOutTimestamp] = useState<
    number | null
  >(null);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const {
    label: statusLabel,
    value: statusValue,
    className: statusClassName,
  } = calcPositionalStatus(attendance.check_in_time, attendance.check_out_time);

  const [checkOutHours, checkOutMinutes] = attendance.scheduled_check_out_time
    .split(":")
    .map((str) => Number(str));
  const checkOutTimestamp = !!attendance.check_out_time
    ? parseISO(attendance.check_out_time).getTime()
    : null;

  const [checkInHours, checkInMinutes] = attendance.scheduled_check_in_time
    .split(":")
    .map((str) => Number(str));
  const checkInTimestamp = !!attendance.check_in_time
    ? parseISO(attendance.check_in_time).getTime()
    : null;

  const isCheckInEarly =
    !!checkInTimestamp &&
    !!scheduledCheckInTimestamp &&
    scheduledCheckInTimestamp > checkInTimestamp;

  const isCheckInLate =
    !!checkInTimestamp &&
    !!scheduledCheckInTimestamp &&
    scheduledCheckInTimestamp < checkInTimestamp;

  const isCheckOutEarly =
    !!checkOutTimestamp &&
    !!scheduledCheckOutTimestamp &&
    scheduledCheckOutTimestamp > checkOutTimestamp;

  const isCheckOutLate =
    !!checkOutTimestamp &&
    !!scheduledCheckOutTimestamp &&
    scheduledCheckOutTimestamp < checkOutTimestamp;

  const delayUntilCheckInLate =
    !!nowTimestamp && !!scheduledCheckInTimestamp
      ? scheduledCheckInTimestamp - nowTimestamp
      : null;

  // Hydration Effect
  useEffect(() => {
    (() => {
      const ts = Date.now();

      setNowTimestamp(ts);
      setScheduledCheckInTimestamp(
        new Date(ts).setHours(checkInHours, checkInMinutes, 0, 0),
      );
      setScheduledCheckOutTimestamp(
        new Date(ts).setHours(checkOutHours, checkOutMinutes, 0, 0),
      );
    })();
  }, [checkInHours, checkInMinutes, checkOutHours, checkOutMinutes]);

  useEffect(() => {
    if (!delayUntilCheckInLate || delayUntilCheckInLate < 0) return;
    const id = setTimeout(() => {
      setNowTimestamp(Date.now());
    }, delayUntilCheckInLate);

    return () => {
      clearTimeout(id);
    };
  }, [delayUntilCheckInLate]);

  return (
    <DataViewRowLegacy index={index} key={attendance.id}>
      <DataViewCellLegacy>{toHindiDigits(index + 1)}</DataViewCellLegacy>
      <DataViewCellLegacy
        className="overflow-clip text-ellipsis whitespace-nowrap"
        {...(attendance.instructor_name.length > 15
          ? { title: attendance.instructor_name }
          : {})}
      >
        {attendance.instructor_name}
      </DataViewCellLegacy>
      <DataViewCellLegacy title={attendance.lecture_info?.lecture_title}>
        {attendance.lecture_info?.course_title}
      </DataViewCellLegacy>
      <DataViewCellLegacy>
        <span>{formatTime(attendance.scheduled_check_in_time)}</span>
      </DataViewCellLegacy>
      <DataViewCellLegacy>
        <span>{formatTime(attendance.scheduled_check_out_time)}</span>
      </DataViewCellLegacy>

      <DataViewCellLegacy />

      <DataViewCellLegacy className="py-0">
        <TimeBadge
          status={
            isCheckInEarly ? "bonus" : isCheckInLate ? "penalty" : "neutral"
          }
          revert
        >
          <ClientLocalTime iso={attendance.check_in_time} />
        </TimeBadge>
      </DataViewCellLegacy>
      <DataViewCellLegacy className="py-0">
        <TimeBadge
          status={
            isCheckOutEarly ? "penalty" : isCheckOutLate ? "bonus" : "neutral"
          }
        >
          <ClientLocalTime iso={attendance.check_out_time} />
        </TimeBadge>
      </DataViewCellLegacy>
      <DataViewCellLegacy>
        <StatusBadge
          className={cn(
            "transition-colors",
            statusClassName,
            statusValue === "away" &&
              nowTimestamp &&
              scheduledCheckInTimestamp &&
              nowTimestamp > scheduledCheckInTimestamp &&
              "bg-[#efc2c2] text-[#952B2B]",
          )}
        >
          {statusLabel}
        </StatusBadge>
      </DataViewCellLegacy>
      <DataViewCellLegacy className="py-0">
        {statusValue === "away" && (
          <Button
            size="small"
            revert={index % 2 === 0}
            className="bg-olive-100 hover:bg-olive-300 h-15 w-52 py-3 whitespace-nowrap text-gray-900"
            loading={isCheckingIn}
            onClick={async () => {
              setIsCheckingIn(true);
              await manualCheckIn(attendance.id);
              setIsCheckingIn(false);
            }}
          >
            سجل الحضور
          </Button>
        )}
        {statusValue === "present" && (
          <Button
            size="small"
            revert={index % 2 === 0}
            className="bg-olive-100 hover:bg-olive-300 h-15 w-52 py-3 whitespace-nowrap text-gray-900"
            loading={isCheckingOut}
            onClick={async () => {
              setIsCheckingOut(true);
              await manualCheckOut(attendance.id);
              setIsCheckingOut(false);
            }}
          >
            سجل الانصراف
          </Button>
        )}
        {statusValue === "left" && (
          <Button
            size="small"
            revert={index % 2 === 0}
            className="pointer-events-none h-15 w-52 bg-gray-200 py-3 whitespace-nowrap text-gray-900 shadow-none!"
          >
            تم التسجيل
          </Button>
        )}
      </DataViewCellLegacy>
    </DataViewRowLegacy>
  );
}

export default function TodaysAttendancesView({
  dbAttendances,
}: {
  dbAttendances: StaffAttendanceListItem[];
}) {
  const [attendances, setAttendances] =
    useState<StaffAttendanceListItem[]>(dbAttendances);

  const { lastJsonMessage, readyState, fatalCloseCode, reconnectExhausted } =
    useStaffAttendanceWebSocket(true);

  const fatalToastRef = useRef<number | null>(null);
  const exhaustedToastRef = useRef(false);

  useEffect(() => {
    if (!reconnectExhausted || exhaustedToastRef.current) return;
    exhaustedToastRef.current = true;
    toast.error("تعذر الاتصال بتحديثات الحضور بعد عدة محاولات. حدّث الصفحة لاحقًا.");
  }, [reconnectExhausted]);

  useEffect(() => {
    if (fatalCloseCode == null) return;
    if (fatalToastRef.current === fatalCloseCode) return;
    fatalToastRef.current = fatalCloseCode;

    const messages: Record<number, string> = {
      4001: "تعذر الاتصال: لم يُرسل رمز الدخول",
      4002: "انتهت صلاحية ربط الحضور أو أصبح غير صالح",
      4003: "غير مصرح لك بعرض تحديثات الحضور المباشرة",
    };
    toast.error(
      messages[fatalCloseCode] ?? "تعذر الاتصال بتحديثات الحضور المباشرة",
    );
  }, [fatalCloseCode]);

  useEffect(() => {
    if (!lastJsonMessage) return;

    const event = lastJsonMessage;

    switch (event.type) {
      case "connection_established":
        break;

      case "pong":
        break;

      case "summary_response": {
        const d = event.data;
        const absent = d.absent ?? 0;
        const checkedIn = d.checked_in ?? 0;
        const total = d.total_expected ?? 0;
        toast.success(
          `ملخص الحضور اليوم: سجّل ${checkedIn} من ${total} — غائب ${absent}`,
          { duration: 5000 },
        );
        break;
      }

      case "attendance_update": {
        const d = event.data;
        const checkIn = d.time ?? d.check_in_time ?? null;
        const checkOut = d.check_out_time;

        setAttendances((rows: StaffAttendanceListItem[]) =>
          rows.map((a: StaffAttendanceListItem) => {
            if (a.id !== d.id) return a;
            return {
              ...a,
              ...(checkIn != null ? { check_in_time: checkIn } : {}),
              ...(checkOut !== undefined ? { check_out_time: checkOut } : {}),
              status: d.status,
            };
          }),
        );

        toast.success(`${d.instructor} — تم تسجيل الحضور`);
        break;
      }

      case "attendance_check_out": {
        const d = event.data;
        setAttendances((rows: StaffAttendanceListItem[]) =>
          rows.map((a: StaffAttendanceListItem) =>
            a.id === d.id ? { ...a, check_out_time: d.check_out_time } : a,
          ),
        );
        toast.success(`${d.instructor} — تم تسجيل الانصراف`);
        break;
      }

      case "attendance_rated": {
        const d = event.data;
        setAttendances((rows: StaffAttendanceListItem[]) =>
          rows.map((a: StaffAttendanceListItem) =>
            a.id === d.id ? { ...a, rating: d.rating, status: d.status } : a,
          ),
        );
        toast.success(`${d.instructor} — تم التقييم (${d.rating})`);
        break;
      }

      default:
        break;
    }
  }, [lastJsonMessage]);

  return (
    <DataView
      gridLayout="grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.25fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]"
      data={attendances}
      filterConfig={{}}
      sortConfig={{}}
    >
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <DataViewControls />
        {fatalCloseCode != null && (
          <span className="text-[#952B2B] text-2xl">
            توقفت التحديثات المباشرة
          </span>
        )}
        {fatalCloseCode == null && reconnectExhausted && (
          <span className="text-[#952B2B] text-2xl">
            تعذر الاتصال بتحديثات الحضور
          </span>
        )}
        {fatalCloseCode == null &&
          !reconnectExhausted &&
          readyState === "connecting" && (
            <span className="text-olive-600 text-2xl">
              جاري الاتصال بتحديثات الحضور…
            </span>
          )}
        {fatalCloseCode == null &&
          !reconnectExhausted &&
          readyState === "open" && (
            <span className="text-[#027243] text-2xl">
              متصل — تحديثات مباشرة
            </span>
          )}
      </div>

      <DataViewHeaderLegacy>
        <DataViewCellLegacy>م</DataViewCellLegacy>
        <DataViewCellLegacy>الاسم</DataViewCellLegacy>
        <DataViewCellLegacy>الهدف</DataViewCellLegacy>
        <DataViewCellLegacy>الحضور</DataViewCellLegacy>
        <DataViewCellLegacy>الانصراف</DataViewCellLegacy>
        <DataViewCellLegacy />
        <DataViewCellLegacy>الحضور الفعلي</DataViewCellLegacy>
        <DataViewCellLegacy>الانصراف الفعلي</DataViewCellLegacy>
        <DataViewCellLegacy>الحالة</DataViewCellLegacy>
        <DataViewCellLegacy></DataViewCellLegacy>
      </DataViewHeaderLegacy>

      <DataViewBodyLegacy<StaffAttendanceListItem>
        render={{
          table: (item, i) => (
            <StaffAttendanceRow key={item.id} attendance={item} index={i} />
          ),
          cards: () => null,
        }}
      />

      <DataViewPaginationLegacy />
    </DataView>
  );
}
