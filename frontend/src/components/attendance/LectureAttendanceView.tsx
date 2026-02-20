"use client";

import { markLectureAttendanceInBulk } from "@/actions/attendances";
import AddNoteModal from "@/components/attendance/AddNoteModal";
import lectureAttendanceViewConfig from "@/components/attendance/lecture-attendance-view.config";
import QrCodeIcon from "@/components/icons/QrCodeIcon";
import StarIcon from "@/components/icons/StarIcon";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { cn, persistInLocalStorage, toHindiDigits } from "@/lib/utils";
import {
  BulkLectureAttendanceBody,
  LectureAttendanceDetail,
  LectureDetail,
} from "@/types/entities";
import { addHours, isValid, parseISO } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const { filterConfig, sortConfig } = lectureAttendanceViewConfig;

export default function LectureAttendanceView({
  // students,
  attendances,
  courseId,
  lecture,
}: {
  // students: {
  //   participant_name: string;
  // }[];
  attendances: LectureAttendanceDetail[];
  courseId: string;
  lecture: LectureDetail | null;
}) {
  const router = useRouter();
  const lectureDate = lecture?.scheduled_at
    ? parseISO(lecture.scheduled_at)
    : null;
  const now = new Date();
  const editableUntil =
    lectureDate && isValid(lectureDate) ? addHours(lectureDate, 24) : null;
  const isEditable =
    !!lectureDate &&
    !!editableUntil &&
    isValid(lectureDate) &&
    now >= lectureDate &&
    now <= editableUntil;
  const localStorageKey = `attendance-${courseId}-${lecture?.id}`;

  const [currentHoveredStar, setCurrentHoveredStar] = useState<number | null>(
    null,
  );

  const getMergedAttendanceState = useCallback(
    (
      serverAttendances: LectureAttendanceDetail[],
    ): LectureAttendanceDetail[] => {
      if (typeof window === "undefined") return serverAttendances;

      if (!isEditable) {
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
    [isEditable, localStorageKey],
  );

  const [attendanceState, setAttendanceState] =
    useState<LectureAttendanceDetail[]>(attendances);
  // () => {
  //   const initial: LectureAttendanceDetail[] = [];
  //   attendances.forEach((s) => {
  //     if (!s) return;
  //     const oldEntry = attendances.find(
  //       (a) => (a.child || a.student || {}).id === s.id,
  //     );

  //     initial.push({
  //       id: ``,
  //       present: oldEntry?.present || false,
  //       student: (s.age || 0) < 15 ? undefined : (s as Student),
  //       child: (s.age || 0) < 15 ? (s as Child) : undefined,
  //       notes: "",
  //       rating: oldEntry?.rating || 7,
  //     });
  //   });
  //   return initial;
  // },

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const setAttendanceStateWithPersistence = persistInLocalStorage(
    setAttendanceState,
    localStorageKey,
  );

  async function handleSubmit() {
    if (!isEditable) return;

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
    if (!isEditable) {
      localStorage.removeItem(localStorageKey);
    }
  }, [isEditable, localStorageKey]);

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

        <button
          className={cn(
            "bg-olive-300 hover:bg-olive-700 rounded-[0.4rem] p-2 text-gray-100 transition-colors",
            !isEditable && "bg-gray-450 pointer-events-none",
          )}
        >
          <QrCodeIcon />
        </button>

        <Button
          variant="primary"
          size="small"
          className="bg-olive-300 hover:bg-olive-700 ms-auto h-15 min-w-50"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!isEditable}
        >
          حفظ
        </Button>
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
                if (!isEditable) return;

                setAttendanceStateWithPersistence(
                  attendanceState.map((a) => ({ ...a, present: willBe })),
                );
              }}
              disabled={!isEditable}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "bg-gray shadow-primary flex h-15 w-4/5 items-center justify-center gap-3 rounded-[1rem_0] bg-gray-100 transition-colors hover:bg-gray-200",
                          !isEditable &&
                            "bg-gray-450 pointer-events-none shadow-none!",
                        )}
                      >
                        <StarIcon className="text-beige-500" />
                        {toHindiDigits(currentRecord?.rating || "7")} /{" "}
                        {toHindiDigits(10)}
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="shadow-primary flex w-fit flex-col items-center gap-2 bg-gray-100">
                      <div className="flex items-center">
                        {Array.from({ length: 10 }, (_, k) => k + 1).map(
                          (n) => {
                            const rating = currentRecord?.rating || 7;

                            return (
                              <StarIcon
                                key={n}
                                onMouseEnter={() => setCurrentHoveredStar(n)}
                                onMouseLeave={() => setCurrentHoveredStar(null)}
                                onClick={() =>
                                  setAttendanceStateWithPersistence(
                                    attendanceState.map((a) => {
                                      if (a.id !== id) return a;

                                      return { ...a, rating: n };
                                    }),
                                  )
                                }
                                className={cn(
                                  "h-8 w-auto cursor-pointer px-1",
                                  (
                                    !!currentHoveredStar
                                      ? n <= currentHoveredStar
                                      : n <= rating
                                  )
                                    ? "text-beige-500"
                                    : "text-gray-500",
                                )}
                              />
                            );
                          },
                        )}
                      </div>
                      <span className="text-2xl font-bold">
                        {toHindiDigits(currentRecord?.rating || "7")} /{" "}
                        {toHindiDigits(10)}
                      </span>
                    </PopoverContent>
                  </Popover>
                </DataViewCell>

                <DataViewCell className="py-0">
                  <Checkbox
                    id={`attendance-${id}`}
                    checked={!!currentRecord?.present}
                    onCheckedChange={(willBe) => {
                      if (!isEditable) return;

                      setAttendanceStateWithPersistence(
                        attendanceState.map((a) => {
                          if (a.id !== id) return a;
                          return { ...a, present: willBe };
                        }),
                      );
                    }}
                    disabled={!isEditable}
                  />
                </DataViewCell>

                <DataViewCell className="justify-start! overflow-hidden pe-0!">
                  <span className="truncate">{currentRecord?.notes}</span>
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
                    disabled={!isEditable}
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
