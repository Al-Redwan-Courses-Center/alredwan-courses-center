"use client";

import AddNoteModal from "@/components/attendance/AddNoteModal";
import lectureAttendanceViewConfig from "@/components/attendance/lecture-attendance-view.config";
import QrCodeIcon from "@/components/icons/QrCodeIcon";
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
import { Child, LectureListItem, Student } from "@/types/entities";
import { isToday } from "date-fns";
import Image from "next/image";
import { useEffect, useState } from "react";

const { filterConfig, sortConfig } = lectureAttendanceViewConfig;

export default function LectureAttendanceView({
  students,
  attendances,
  courseId,
  lecture,
}: {
  students: {
    participant_name: string;
  }[];
  attendances: LectureAttendance[];
  courseId: string;
  lecture: LectureListItem;
}) {
  const isEditable = isToday(lecture.date);
  const localStorageKey = `attendance-${courseId}-${lecture.id}`;

  const [attendance, setAttendance] = useState<LectureAttendance[]>(() => {
    const initial: LectureAttendance[] = [];
    students.forEach((s) => {
      if (!s) return;
      const oldEntry = attendances.find(
        (a) => (a.child || a.student || {}).id === s.id,
      );

      initial.push({
        id: ``,
        present: oldEntry?.present || false,
        student: (s.age || 0) < 15 ? undefined : (s as Student),
        child: (s.age || 0) < 15 ? (s as Child) : undefined,
        notes: "",
        rating: oldEntry?.rating || 7,
      });
    });
    return initial;
  });

  const setAttendanceWithPersistence = persistInLocalStorage(
    setAttendance,
    localStorageKey,
  );

  useEffect(() => {
    const initial: LectureAttendance[] = [];

    // 1. Try to load from Local Storage
    let localStore: LectureAttendance[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(
          `attendance-${courseId}-${lecture.id}`,
        );
        if (stored) {
          localStore = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to parse attendance from local storage", e);
      }
    }

    students.forEach((s) => {
      if (!s) return;

      const backendEntry = attendances.find(
        (a) => (a.child || a.student || {}).id === s.id,
      );

      const localEntry = localStore.find(
        (a) => (a.child || a.student || {}).id === s.id,
      );

      let finalEntry = backendEntry;

      // If backend entry is missing or effectively "empty" (absent), try local storage
      if (!finalEntry || (!finalEntry.present && !finalEntry.notes)) {
        if (localEntry) {
          finalEntry = localEntry;
        }
      }

      initial.push({
        id: `${courseId}-${lecture.id}-${s.id}`,
        present: finalEntry?.present || false,
        student: (s.age || 0) < 15 ? undefined : (s as Student),
        child: (s.age || 0) < 15 ? (s as Child) : undefined,
        notes: finalEntry?.notes || "",
        rating: finalEntry?.rating || 7,
      });
    });

    setAttendance(initial);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture.id, courseId, students.length]);

  return (
    <DataView
      gridLayout={cn("grid-cols-[0.25fr_1fr_1.5fr_1fr_1fr_1fr_1fr_2fr_1fr]")}
      data={students}
      filterConfig={filterConfig}
      sortConfig={sortConfig}
      maxItemsPerPage={9999}
    >
      <div className="mb-10 flex items-center gap-10 px-16">
        <DataViewSearch />

        <button className="bg-olive-300 hover:bg-olive-700 rounded-[0.4rem] p-2 text-gray-100 transition-colors">
          <QrCodeIcon />
        </button>

        <Button
          variant="primary"
          size="small"
          className="bg-olive-300 hover:bg-olive-700 ms-auto min-w-50"
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
                attendance.length > 0 && attendance.every((a) => a.present)
              }
              onCheckedChange={(willBe) => {
                setAttendanceWithPersistence(
                  attendance.map((a) => ({ ...a, present: willBe })),
                );
              }}
            />
          </span>
        </DataViewCell>
        <DataViewCell className="justify-start!">ملاحظات</DataViewCell>
        <DataViewCell></DataViewCell>
      </DataViewHeader>

      <DataViewBody
        className="max-h-[52dvh] overflow-y-auto px-[4rem_calc(4rem-10px)] pt-3 pb-10"
        render={{
          table: (s, i) => {
            if (!s) return null;
            const { image, name, code, age, id } = s as Child | Student;
            const currentRecord = attendance.find(
              (a) => (a.child || a.student || {}).id === id,
            );

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
                <DataViewCell>{toHindiDigits(age)}</DataViewCell>

                <DataViewCell className="font-bold">
                  {toHindiDigits(currentRecord?.rating || "")}
                </DataViewCell>

                <DataViewCell className="py-0">
                  <Checkbox
                    id={`attendance-${id}`}
                    checked={!!currentRecord?.present}
                    onCheckedChange={(willBe) =>
                      setAttendanceWithPersistence(
                        attendance.map((a) => {
                          if ((a.student || a.child || {}).id !== id) return a;
                          return { ...a, present: willBe };
                        }),
                      )
                    }
                  />
                </DataViewCell>

                <DataViewCell className="justify-start! overflow-hidden pe-0!">
                  <span className="truncate">{currentRecord?.notes}</span>
                </DataViewCell>

                <DataViewCell className="*:text-olive-300 *:hover:text-olive-700 *:transition-colors">
                  <AddNoteModal
                    name={name}
                    uniqueId={`${courseId}-${lecture.id}-${id}`}
                    onSave={(notes) =>
                      setAttendanceWithPersistence(
                        attendance.map((a) => {
                          if ((a.student || a.child || {}).id !== id) return a;
                          return { ...a, notes };
                        }),
                      )
                    }
                    notes={currentRecord?.notes}
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
