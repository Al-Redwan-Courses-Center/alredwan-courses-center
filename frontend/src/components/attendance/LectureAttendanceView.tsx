"use client";

import { markLectureAttendanceInBulk } from "@/actions/attendances";
import AddNoteModal from "@/components/attendance/AddNoteModal";
import AttendanceStudentIdQrCodeScannerModal from "@/components/attendance/AttendanceStudentIdQrCodeScannerModal";
import lectureAttendanceViewConfig from "@/components/attendance/lecture-attendance-view.config";
import RatingPopover from "@/components/attendance/RatingPopover";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import {
  DataViewHeader,
  DataViewRow,
} from "@/components/ui/data-view/DataViewRow";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";

import { cn, persistInLocalStorage, toHindiDigits } from "@/lib/utils";
import {
  BulkLectureAttendanceBody,
  LectureAttendanceDetail,
  LectureAttendanceViewOptions,
  LectureDetail,
} from "@/types/entities";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const { filterConfig, sortConfig } = lectureAttendanceViewConfig;

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

  return (
    <DataView
      gridLayout={cn("grid-cols-[0.25fr_1fr_1.5fr_1fr_1fr_1fr_1fr_2fr_1fr]")}
      data={attendanceState}
      filterConfig={filterConfig}
      sortConfig={sortConfig}
      maxItemsPerPage={9999}
    >
      <div className="mb-10 flex items-center gap-10 px-16">
        <DataViewSearch />

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

      <DataViewHeader className="mx-16">
        <DataViewCell>م</DataViewCell>
        <DataViewCell>الصورة</DataViewCell>
        <DataViewCell>اسم الطالب</DataViewCell>
        <DataViewCell>الكود</DataViewCell>
        <DataViewCell>السن</DataViewCell>
        <DataViewCell>التقييم</DataViewCell>
        <DataViewCell className="felx items-center gap-5 py-0">
          <span>الحضور</span>
          <span>
            <Checkbox
              id="all-attendance"
              checked={
                attendanceState.length > 0 &&
                attendanceState.every((a) => a.present)
              }
              onCheckedChange={(willBe) => {
                if (!canEditAttendance) return;

                setAttendanceStateWithPersistence(
                  attendanceState.map((a) => ({ ...a, present: willBe })),
                );
              }}
              disabled={!canEditAttendance}
            />
          </span>
        </DataViewCell>
        <DataViewCell className="justify-start!">ملاحظات</DataViewCell>
        <DataViewCell></DataViewCell>
      </DataViewHeader>

      <DataViewBody<LectureAttendanceDetail>
        className="max-h-[52dvh] overflow-y-auto px-[4rem_calc(4rem-10px)] pt-3 pb-10"
        render={{
          table: (a, i) => {
            if (!a) return null;

            const {
              participant_image: image,
              participant_full_name: name,
              participant_code: code,
              participant_age: age,
              id,
            } = a;

            const currentRecord = attendanceState.find((a) => a.id === id);

            return (
              <DataViewRow className="min-h-26" index={i} key={id}>
                <DataViewCell>{toHindiDigits(i + 1)}</DataViewCell>

                <DataViewCell className="py-0">
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
                </DataViewCell>

                <DataViewCell>{name}</DataViewCell>
                <DataViewCell>{code}</DataViewCell>
                <DataViewCell>{toHindiDigits(age || "")}</DataViewCell>

                <DataViewCell className="py-0 font-bold">
                  <RatingPopover
                    disabled={!canEditAttendance}
                    rating={currentRecord?.rating ?? 7}
                    onSelectRating={(n) =>
                      setAttendanceStateWithPersistence(
                        attendanceState.map((a) => {
                          if (a.id !== id) return a;

                          return { ...a, rating: n };
                        }),
                      )
                    }
                  />
                </DataViewCell>

                <DataViewCell className="py-0">
                  <Checkbox
                    id={`attendance-${id}`}
                    checked={!!currentRecord?.present}
                    onCheckedChange={(willBe) => {
                      if (!canEditAttendance) return;

                      setAttendanceStateWithPersistence(
                        attendanceState.map((a) => {
                          if (a.id !== id) return a;
                          return { ...a, present: willBe };
                        }),
                      );
                    }}
                    disabled={!canEditAttendance}
                  />
                </DataViewCell>

                <DataViewCell className="justify-start! overflow-hidden pe-0!">
                  <span className="truncate">
                    {!!currentRecord?.notes?.trim()
                      ? currentRecord.notes.trim()
                      : "لا توجد ملاحظات"}
                  </span>
                </DataViewCell>

                <DataViewCell className="*:text-olive-300 *:hover:text-olive-700 *:transition-colors">
                  <AddNoteModal
                    name={name || ""}
                    uniqueId={`${courseId}-${lecture.id}-${id}`}
                    onSave={(notes) =>
                      setAttendanceStateWithPersistence(
                        attendanceState.map((a) => {
                          if (a.id !== id) return a;
                          return { ...a, notes };
                        }),
                      )
                    }
                    notes={currentRecord?.notes || ""}
                    disabled={!canEditAttendance}
                  />
                </DataViewCell>
              </DataViewRow>
            );
          },
          cards: () => null,
        }}
      />
    </DataView>
  );
}
