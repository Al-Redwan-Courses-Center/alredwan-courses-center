"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { format, parseISO } from "date-fns";
import { type ReactNode, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { manualCheckIn, manualCheckOut } from "@/actions/admin-attendances";
import { getClientAccessToken } from "@/actions/temp";
import Button from "@/components/ui/Button";
import ClientLocalTime from "@/components/ui/ClientLocalTime";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewControls from "@/components/ui/data-view/DataViewControls";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "@/components/ui/data-view/DataViewRow";
import StatusBadge from "@/components/ui/StatusBadge";
import { exportToExcel } from "@/lib/export";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import type { StaffAttendanceListItem } from "@/types/entities/staff-attendance";
import type { StaffAttendanceServerEvent } from "@/types/entities/staff-attendance-events";

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

  const [checkInHours, checkInMinutes] = (
    attendance.scheduled_check_in_time || "00:00"
  )
    .split(":")
    .map((str) => Number(str));
  const checkInTimestamp = attendance.check_in_time
    ? parseISO(attendance.check_in_time).getTime()
    : 0;

  const [checkOutHours, checkOutMinutes] = (
    attendance.scheduled_check_out_time || "00:00"
  )
    .split(":")
    .map((str) => Number(str));
  const checkOutTimestamp = attendance.check_out_time
    ? parseISO(attendance.check_out_time).getTime()
    : 0;

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
    nowTimestamp && scheduledCheckInTimestamp
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [attendances, setAttendances] =
    useState<StaffAttendanceListItem[]>(dbAttendances);

  const wsUrl = accessToken
    ? `ws://100.73.83.8:8001/ws/attendance/?token=${accessToken}`
    : null;

  const { sendJsonMessage, lastJsonMessage } =
    useWebSocket<StaffAttendanceServerEvent>(wsUrl, {
      onClose: (event) => {
        console.log(event);
      },
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 10000,
    });

  function handleWebSocketServerEvent(event: StaffAttendanceServerEvent) {
    switch (event.type) {
      case "connection_established": {
        console.log(event.message);
        break;
      }
      case "summary_response": {
        console.log(event);
        break;
      }
      case "attendance_update": {
        console.log(event);

        const { check_in_time, check_out_time, instructor_id, status } =
          event.data;

        setAttendances((attendances) =>
          attendances.map((a) => {
            if (a.instructor !== instructor_id) return a;

            return {
              ...a,
              check_in_time,
              check_out_time,
              status,
            };
          }),
        );

        break;
      }
      default: {
        console.log("NO EVENT");
      }
    }
  }

  useEffect(() => {
    const getToken: () => void = async () => {
      const token = await getClientAccessToken();
      setAccessToken(token ?? null);
    };
    getToken();
  }, []);

  useEffect(() => {
    if (!lastJsonMessage) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleWebSocketServerEvent(lastJsonMessage);
  }, [lastJsonMessage]);

  function handleExport() {
    const exportData = attendances.map((item, index) => {
      const statusObj = calcPositionalStatus(
        item.check_in_time,
        item.check_out_time,
      );

      return {
        م: index + 1,
        الاسم: item.instructor_name,
        الهدف: item.lecture_info?.course_title || "",
        الحضور: formatTime(item.scheduled_check_in_time) || "",
        الانصراف: formatTime(item.scheduled_check_out_time) || "",
        "الحضور الفعلي": item.check_in_time
          ? format(parseISO(item.check_in_time), "hh:mm a")
          : "",
        "الانصراف الفعلي": item.check_out_time
          ? format(parseISO(item.check_out_time), "hh:mm a")
          : "",
        الحالة: statusObj.label,
      };
    });

    const today = format(new Date(), "yyyy-MM-dd");
    exportToExcel(exportData, `حضور_المهام_${today}`);
  }

  return (
    <DataView
      gridLayout="grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.25fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]"
      data={attendances}
      filterConfig={{}}
      sortConfig={{}}
    >
      <DataViewControls showExport onExport={handleExport} />

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
