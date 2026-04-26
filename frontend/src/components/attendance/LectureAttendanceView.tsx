"use client";

import { markLectureAttendanceInBulk } from "@/actions/attendances";
import AddNoteModal from "@/components/attendance/AddNoteModal";
import AttendanceStudentIdQrCodeScannerModal from "@/components/attendance/AttendanceStudentIdQrCodeScannerModal";
import RatingPopover from "@/components/attendance/RatingPopover";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import { persistInLocalStorage, toHindiDigits } from "@/lib/utils";
import {
  DataTable,
  DataTableMobileConfig,
} from "@/shadcn/components/data-table";
import {
  BulkLectureAttendanceBody,
  LectureAttendanceDetail,
  LectureAttendanceViewOptions,
  LectureDetail,
} from "@/types/entities";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function LectureAttendanceView({
  attendances,
  courseId,
  lecture,
  options,
}: {
  attendances: LectureAttendanceDetail[];
  courseId: string;
  lecture: LectureDetail | null;
  options: LectureAttendanceViewOptions | null;
}) {
  const router = useRouter();
  const attendanceConfig = {
    isFutureLecture: options?.is_future_lecture ?? false,
    isAttendanceSubmittable: options?.is_attendance_submittable ?? false,
    isEditable: options?.is_editable ?? false,
    userCanBypassDeadline: options?.user_can_bypass_deadline ?? false,
    userCanMarkFutureLectures: options?.user_can_mark_future_lectures ?? false,
  };

  const canEditAttendance =
    attendanceConfig.isAttendanceSubmittable && attendanceConfig.isEditable;

  const localStorageKey = `attendance-${courseId}-${lecture?.id}`;

  const getMergedAttendanceState = useCallback(
    (
      serverAttendances: LectureAttendanceDetail[],
    ): LectureAttendanceDetail[] => {
      if (typeof window === "undefined") return serverAttendances;

      if (!canEditAttendance) {
        localStorage.removeItem(localStorageKey);
        return serverAttendances;
      }

      try {
        const stored = localStorage.getItem(localStorageKey);
        if (!stored) return serverAttendances;

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return serverAttendances;

        const localStore = parsed as LectureAttendanceDetail[];

        if (serverAttendances.length === 0) {
          return localStore;
        }

        if (localStore.length === 0) {
          return serverAttendances;
        }

        return serverAttendances.map(
          (backendEntry) =>
            localStore.find(
              (localEntry) => localEntry.id === backendEntry.id,
            ) ?? backendEntry,
        );
      } catch (e) {
        console.error("Failed to parse attendance from local storage", e);
        return serverAttendances;
      }
    },
    [canEditAttendance, localStorageKey],
  );

  const [attendanceState, setAttendanceState] =
    useState<LectureAttendanceDetail[]>(attendances);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const setAttendanceStateWithPersistence = persistInLocalStorage(
    setAttendanceState,
    localStorageKey,
  );

  async function handleSubmit() {
    if (!canEditAttendance) return;

    try {
      setIsSubmitting(true);

      const body: BulkLectureAttendanceBody = {
        marked_via: "manual",
        attendances: attendanceState.map((a) => ({
          code: a.participant_code as string,
          participant_type: a.participant_type,
          rating: Math.min(10, Math.max(1, a.rating ?? 7)),
          notes: a.notes,
          present: a.present || false,
        })),
      };

      const res = await markLectureAttendanceInBulk(String(lecture?.id), body);

      if (!res || res.summary.failed > 0) {
        throw new Error(
          "حدث خطأ أثناء تسجيل غياب المحاضرة!\nرجاءً حاول مجدداً!",
        );
      } else {
        toast.success("تم تسجيل غياب المحاضرة بنجاح!");
        localStorage.removeItem(localStorageKey);
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل غياب المحاضرة!\nرجاءً حاول مجدداً!",
        { duration: 5000 },
      );
      console.error("Failed to mark lecture attendances: ", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canEditAttendance) {
      localStorage.removeItem(localStorageKey);
    }
  }, [canEditAttendance, localStorageKey]);

  useEffect(() => {
    setAttendanceState(getMergedAttendanceState(attendances));
  }, [attendances, getMergedAttendanceState]);

  if (!lecture) return null;

  const allChecked =
    attendanceState.length > 0 && attendanceState.every((a) => a.present);

  const columns = useMemo<ColumnDef<LectureAttendanceDetail>[]>(
    () => [
      {
        id: "index",
        header: "م",
        enableSorting: false,
        cell: ({ row }) => <span>{toHindiDigits(row.index + 1)}</span>,
      },
      {
        id: "participant_image",
        header: "الصورة",
        enableSorting: false,
        cell: ({ row }) => {
          const image = row.original.participant_image;
          return (
            <div className="aspect-square h-auto w-15 place-items-center overflow-clip rounded-full bg-gray-300">
              {!!image && (
                <div className="relative h-full w-full">
                  <Image
                    src={image}
                    alt="Student Image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "participant_full_name",
        header: "اسم الطالب",
      },
      {
        accessorKey: "participant_code",
        header: "الكود",
      },
      {
        accessorKey: "participant_age",
        header: "السن",
        cell: ({ row }) => (
          <span>{toHindiDigits(row.original.participant_age || "")}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: "التقييم",
        cell: ({ row }) => (
          <RatingPopover
            disabled={!canEditAttendance}
            rating={row.original.rating ?? 7}
            onSelectRating={(n) =>
              setAttendanceStateWithPersistence(
                attendanceState.map((attendance) => {
                  if (attendance.id !== row.original.id) return attendance;
                  return { ...attendance, rating: n };
                }),
              )
            }
          />
        ),
      },
      {
        accessorKey: "present",
        header: (
          <div className="flex items-center gap-5 py-0">
            <span>الحضور</span>
            <span>
              <Checkbox
                id="all-attendance"
                checked={allChecked}
                onCheckedChange={(willBe) => {
                  if (!canEditAttendance) return;

                  setAttendanceStateWithPersistence(
                    attendanceState.map((attendance) => ({
                      ...attendance,
                      present: willBe,
                    })),
                  );
                }}
                disabled={!canEditAttendance}
              />
            </span>
          </div>
        ),
        cell: ({ row }) => (
          <Checkbox
            id={`attendance-${row.original.id}`}
            checked={!!row.original.present}
            onCheckedChange={(willBe) => {
              if (!canEditAttendance) return;

              setAttendanceStateWithPersistence(
                attendanceState.map((attendance) => {
                  if (attendance.id !== row.original.id) return attendance;
                  return { ...attendance, present: willBe };
                }),
              );
            }}
            disabled={!canEditAttendance}
          />
        ),
      },
      {
        accessorKey: "notes",
        header: "ملاحظات",
        cell: ({ row }) => (
          <span className="block max-w-80 truncate text-start">
            {!!row.original.notes?.trim()
              ? row.original.notes.trim()
              : "لا توجد ملاحظات"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="*:text-olive-300 *:hover:text-olive-700 *:transition-colors">
            <AddNoteModal
              name={row.original.participant_full_name || ""}
              uniqueId={`${courseId}-${lecture.id}-${row.original.id}`}
              onSave={(notes) =>
                setAttendanceStateWithPersistence(
                  attendanceState.map((attendance) => {
                    if (attendance.id !== row.original.id) return attendance;
                    return { ...attendance, notes };
                  }),
                )
              }
              notes={row.original.notes || ""}
              disabled={!canEditAttendance}
            />
          </div>
        ),
      },
    ],
    [
      allChecked,
      attendanceState,
      canEditAttendance,
      courseId,
      lecture.id,
      setAttendanceStateWithPersistence,
    ],
  );

  const mobileConfig = useMemo<DataTableMobileConfig<LectureAttendanceDetail>>(
    () => ({
      renderTitle: (attendance, index) => (
        <span>
          {toHindiDigits(index + 1)}-{" "}
          {attendance.participant_full_name || "غير معروف"}
        </span>
      ),
      renderSubtitle: (attendance) => (
        <span className="text-olive-400">
          {attendance.participant_code || "-"}
        </span>
      ),
      renderContent: (attendance) => (
        <div className="space-y-3 text-[1.4rem]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-500">السن :</span>
            <span>{toHindiDigits(attendance.participant_age || "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-500">التقييم :</span>
            <RatingPopover
              disabled={!canEditAttendance}
              rating={attendance.rating ?? 7}
              onSelectRating={(n) =>
                setAttendanceStateWithPersistence(
                  attendanceState.map((row) =>
                    row.id === attendance.id ? { ...row, rating: n } : row,
                  ),
                )
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-500">الحضور :</span>
            <Checkbox
              id={`mobile-attendance-${attendance.id}`}
              checked={!!attendance.present}
              onCheckedChange={(willBe) => {
                if (!canEditAttendance) return;

                setAttendanceStateWithPersistence(
                  attendanceState.map((row) =>
                    row.id === attendance.id
                      ? { ...row, present: willBe }
                      : row,
                  ),
                );
              }}
              disabled={!canEditAttendance}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-gray-500">ملاحظات :</span>
            <span className="truncate">
              {!!attendance.notes?.trim()
                ? attendance.notes.trim()
                : "لا توجد ملاحظات"}
            </span>
          </div>
        </div>
      ),
      renderActions: (attendance) => (
        <div className="*:text-olive-300 *:hover:text-olive-700 flex justify-end *:transition-colors">
          <AddNoteModal
            name={attendance.participant_full_name || ""}
            uniqueId={`${courseId}-${lecture.id}-${attendance.id}-mobile`}
            onSave={(notes) =>
              setAttendanceStateWithPersistence(
                attendanceState.map((row) =>
                  row.id === attendance.id ? { ...row, notes } : row,
                ),
              )
            }
            notes={attendance.notes || ""}
            disabled={!canEditAttendance}
          />
        </div>
      ),
    }),
    [
      attendanceState,
      canEditAttendance,
      courseId,
      lecture.id,
      setAttendanceStateWithPersistence,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="mb-10 flex items-center gap-10 px-16">
        {canEditAttendance && (
          <>
            <AttendanceStudentIdQrCodeScannerModal
              disabled={!canEditAttendance}
              onScan={(studentCode) => {
                let markedStudentName = "";

                setAttendanceStateWithPersistence((prev) => {
                  const target = prev.find(
                    (a) => a.participant_code === studentCode,
                  );

                  if (!target || target.present) return prev;

                  markedStudentName = target.participant_full_name || "";

                  return prev.map((a) =>
                    a.participant_code === studentCode
                      ? { ...a, present: true }
                      : a,
                  );
                });

                if (markedStudentName) {
                  toast.success(`تم أخذ حضور ${markedStudentName}`);
                }
              }}
            />

            <Button
              variant="primary"
              size="small"
              className="bg-olive-300 hover:bg-olive-700 ms-auto h-15 min-w-50"
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              حفظ
            </Button>
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={attendanceState}
        searchKey="participant_full_name"
        searchPlaceholder="ابحث عن طالب..."
        mobileConfig={mobileConfig}
        pageSize={9999}
      />
    </div>
  );
}
