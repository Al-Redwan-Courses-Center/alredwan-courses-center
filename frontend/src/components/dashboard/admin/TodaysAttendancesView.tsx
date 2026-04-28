"use client";

import { getClientAccessToken } from "@/actions/temp";
import { manualCheckIn, manualCheckOut } from "@/actions/admin-attendances";
import Button from "@/components/ui/Button";
import ClientLocalTime from "@/components/ui/ClientLocalTime";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import {
  DataTable,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import { StaffAttendanceListItem } from "@/types/entities/staff-attendance";
import { StaffAttendanceServerEvent } from "@/types/entities/staff-attendance-events";
import { ColumnDef } from "@tanstack/react-table";
import { cva, VariantProps } from "class-variance-authority";
import { parseISO } from "date-fns";
import { ReactNode, useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";

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

function getScheduledTimestamp(
  attendance: StaffAttendanceListItem,
  isCheckIn: boolean,
) {
  const time = isCheckIn
    ? attendance.scheduled_check_in_time
    : attendance.scheduled_check_out_time;
  return parseISO(`${attendance.date}T${time}`).getTime();
}

function AttendanceTimeBadge({
  attendance,
  isCheckIn,
}: {
  attendance: StaffAttendanceListItem;
  isCheckIn: boolean;
}) {
  const actualIso = isCheckIn
    ? attendance.check_in_time
    : attendance.check_out_time;

  const actualTimestamp = actualIso ? parseISO(actualIso).getTime() : null;
  const scheduledTimestamp = getScheduledTimestamp(attendance, isCheckIn);

  const isEarly =
    actualTimestamp !== null && scheduledTimestamp > actualTimestamp;
  const isLate =
    actualTimestamp !== null && scheduledTimestamp < actualTimestamp;

  const status = isCheckIn
    ? isEarly
      ? "bonus"
      : isLate
        ? "penalty"
        : "neutral"
    : isEarly
      ? "penalty"
      : isLate
        ? "bonus"
        : "neutral";

  return (
    <TimeBadge status={status} revert={isCheckIn}>
      <ClientLocalTime iso={actualIso} />
    </TimeBadge>
  );
}

function AttendanceStatusCell({
  attendance,
}: {
  attendance: StaffAttendanceListItem;
}) {
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());
  const scheduledCheckInTimestamp = getScheduledTimestamp(attendance, true);

  const {
    label: statusLabel,
    value: statusValue,
    className: statusClassName,
  } = calcPositionalStatus(attendance.check_in_time, attendance.check_out_time);

  useEffect(() => {
    const delayUntilCheckInLate = scheduledCheckInTimestamp - nowTimestamp;
    if (delayUntilCheckInLate <= 0) return;

    const id = setTimeout(() => {
      setNowTimestamp(Date.now());
    }, delayUntilCheckInLate);

    return () => {
      clearTimeout(id);
    };
  }, [nowTimestamp, scheduledCheckInTimestamp]);

  return (
    <StatusBadge
      className={cn(
        "transition-colors",
        statusClassName,
        statusValue === "away" &&
          nowTimestamp > scheduledCheckInTimestamp &&
          "bg-[#efc2c2] text-[#952B2B]",
      )}
    >
      {statusLabel}
    </StatusBadge>
  );
}

function AttendanceActionCell({
  attendance,
  rowIndex,
}: {
  attendance: StaffAttendanceListItem;
  rowIndex: number;
}) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { value: statusValue } = calcPositionalStatus(
    attendance.check_in_time,
    attendance.check_out_time,
  );

  if (statusValue === "away") {
    return (
      <Button
        size="small"
        revert={rowIndex % 2 === 0}
        className="bg-olive-100 hover:bg-olive-300 h-15 w-52 py-3 whitespace-nowrap text-gray-900"
        loading={isCheckingIn}
        onClick={async () => {
          setIsCheckingIn(true);
          try {
            await manualCheckIn(attendance.id);
          } finally {
            setIsCheckingIn(false);
          }
        }}
      >
        سجل الحضور
      </Button>
    );
  }

  if (statusValue === "present") {
    return (
      <Button
        size="small"
        revert={rowIndex % 2 === 0}
        className="bg-olive-100 hover:bg-olive-300 h-15 w-52 py-3 whitespace-nowrap text-gray-900"
        loading={isCheckingOut}
        onClick={async () => {
          setIsCheckingOut(true);
          try {
            await manualCheckOut(attendance.id);
          } finally {
            setIsCheckingOut(false);
          }
        }}
      >
        سجل الانصراف
      </Button>
    );
  }

  return (
    <Button
      size="small"
      revert={rowIndex % 2 === 0}
      className="pointer-events-none h-15 w-52 bg-gray-200 py-3 whitespace-nowrap text-gray-900 shadow-none!"
    >
      تم التسجيل
    </Button>
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

  const columns = useMemo<ColumnDef<StaffAttendanceListItem>[]>(
    () => [
      {
        id: "index",
        header: "م",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-bold">{toHindiDigits(row.index + 1)}</span>
        ),
      },
      {
        accessorKey: "instructor_name",
        header: "الاسم",
        cell: ({ row }) => {
          const name = row.original.instructor_name;
          return (
            <span title={name.length > 15 ? name : undefined}>{name}</span>
          );
        },
      },
      {
        id: "target",
        header: "الهدف",
        enableSorting: false,
        cell: ({ row }) => (
          <span title={row.original.lecture_info?.lecture_title}>
            {row.original.lecture_info?.course_title ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "scheduled_check_in_time",
        header: "الحضور",
        cell: ({ row }) => (
          <span>{formatTime(row.original.scheduled_check_in_time)}</span>
        ),
      },
      {
        accessorKey: "scheduled_check_out_time",
        header: "الانصراف",
        cell: ({ row }) => (
          <span>{formatTime(row.original.scheduled_check_out_time)}</span>
        ),
      },
      {
        id: "check_in_time",
        header: "الحضور الفعلي",
        enableSorting: false,
        cell: ({ row }) => (
          <AttendanceTimeBadge attendance={row.original} isCheckIn />
        ),
      },
      {
        id: "check_out_time",
        header: "الانصراف الفعلي",
        enableSorting: false,
        cell: ({ row }) => (
          <AttendanceTimeBadge attendance={row.original} isCheckIn={false} />
        ),
      },
      {
        id: "status",
        header: "الحالة",
        enableSorting: false,
        cell: ({ row }) => <AttendanceStatusCell attendance={row.original} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <AttendanceActionCell
            attendance={row.original}
            rowIndex={row.index}
          />
        ),
      },
    ],
    [],
  );

  const mobileConfig = useMemo<DataTableMobileConfig<StaffAttendanceListItem>>(
    () => ({
      renderTitle: (attendance, index) => (
        <span>
          {toHindiDigits(index + 1)}- {attendance.instructor_name}
        </span>
      ),
      renderSubtitle: (attendance) => (
        <span>{attendance.lecture_info?.course_title ?? "غير محدد"}</span>
      ),
      getContentItems: (attendance) => [
        {
          key: "scheduled_check_in_time",
          label: "الحضور",
          value: formatTime(attendance.scheduled_check_in_time),
        },
        {
          key: "scheduled_check_out_time",
          label: "الانصراف",
          value: formatTime(attendance.scheduled_check_out_time),
        },
        {
          key: "check_in_time",
          label: "الحضور الفعلي",
          value: <AttendanceTimeBadge attendance={attendance} isCheckIn />,
        },
        {
          key: "check_out_time",
          label: "الانصراف الفعلي",
          value: (
            <AttendanceTimeBadge attendance={attendance} isCheckIn={false} />
          ),
        },
        {
          key: "status",
          label: "الحالة",
          value: <AttendanceStatusCell attendance={attendance} />,
        },
      ],
      renderActions: (attendance) => (
        <div className="flex justify-end">
          <AttendanceActionCell attendance={attendance} rowIndex={0} />
        </div>
      ),
    }),
    [],
  );

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

        setAttendances((currentAttendances) =>
          currentAttendances.map((attendance) => {
            if (attendance.instructor !== instructor_id) return attendance;

            return {
              ...attendance,
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
    const getToken = async () => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="rounded-lg bg-gray-100 px-4 py-2 text-[1.3rem] text-gray-700 transition-colors hover:bg-gray-200"
          onClick={() => sendJsonMessage({ type: "request_summary" })}
        >
          Test Fetch Summary Data
        </button>
      </div>

      <DataTable
        columns={columns}
        data={attendances}
        searches={[
          {
            searchKey: "instructor_name",
            placeholder: "ابحث عن اسم مدرس...",
          },
        ]}
        mobileConfig={mobileConfig}
        pageSize={6}
      />
    </div>
  );
}
