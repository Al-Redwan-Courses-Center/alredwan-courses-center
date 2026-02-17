"use client";

import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import { DataViewPagination } from "@/components/ui/data-view/DataViewPagination";
import {
  DataViewHeader,
  DataViewRow,
} from "@/components/ui/data-view/DataViewRow";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import {
  EnrollmentListItem,
  InstructorEnrollmentListItem,
} from "@/types/entities";
import { parseISO } from "date-fns";

const participantTranslationMap: Record<
  NonNullable<InstructorEnrollmentListItem["participant_type"]>,
  string
> = {
  child: "طفل",
  student: "طالب",
};

const enrollmentStatusMap: Record<
  InstructorEnrollmentListItem["status"],
  { label: string; color: string }
> = {
  active: {
    label: "نشط",
    color: cn("bg-green-300"),
  },
  completed: {
    label: "نشط",
    color: cn("bg-blue-300"),
  },
  dropped: {
    label: "نشط",
    color: cn("bg-gray-300"),
  },
  refunded: {
    label: "نشط",
    color: cn("bg-purple-300"),
  },
  suspended: {
    label: "نشط",
    color: cn("bg-amber-300"),
  },
};

export default function CourseEnrollmentsView({
  enrollments,
}: {
  enrollments: InstructorEnrollmentListItem[];
}) {
  return (
    <DataView
      data={enrollments}
      gridLayout={cn("grid-cols-[0.25fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr]")}
      maxItemsPerPage={5}
      filterConfig={{}}
      sortConfig={{}}
    >
      <div className="relative z-100 mb-14 flex items-center gap-32">
        <DataViewSearch />
        {/* <DataViewSort />
        <DataViewFilter /> */}
      </div>

      <DataViewHeader>
        <DataViewCell>م</DataViewCell>
        <DataViewCell>الدورة</DataViewCell>
        <DataViewCell>الطالب</DataViewCell>
        <DataViewCell>نوع الطالب</DataViewCell>
        <DataViewCell>رقم الهاتف</DataViewCell>
        <DataViewCell>الحالة</DataViewCell>
        <DataViewCell>وقت الالتحاق</DataViewCell>
      </DataViewHeader>

      <DataViewBody<InstructorEnrollmentListItem>
        render={{
          table: (item, i) => {
            const { color: statusColor, label: statusLabel } =
              enrollmentStatusMap[item.status];

            return (
              <DataViewRow key={item.id} index={i}>
                <DataViewCell>{toHindiDigits(i + 1)}</DataViewCell>
                <DataViewCell>{item.course_name}</DataViewCell>
                <DataViewCell>{item.participant_name}</DataViewCell>
                <DataViewCell>
                  {item.participant_type
                    ? participantTranslationMap[item.participant_type]
                    : "غير محدد"}
                </DataViewCell>
                <DataViewCell>
                  {item.participant_phone
                    ? toHindiDigits(item.participant_phone.slice(2), true)
                    : "غير معرف"}
                </DataViewCell>
                <DataViewCell>
                  <StatusBadge className={statusColor}>
                    {statusLabel}
                  </StatusBadge>
                </DataViewCell>
                <DataViewCell>
                  {formatDate(parseISO(item.enrolled_at))}
                </DataViewCell>
              </DataViewRow>
            );
          },

          cards: () => null,
        }}
      />

      <DataViewPagination />
    </DataView>
  );
}

/**
{
    "id": "08078277-12f5-455d-a2ca-b8a2c0ef814e",
    "course_start_date": "2026-01-19",
    "course_end_date": null,
    "participant_name": "سلمى كمال",
    "participant_type": "child",
    "participant_phone": "+208748624007",
    "status": "active",
    "status_display": "نشط",
    "enrolled_at": "2026-02-15T18:47:29.782200+02:00",
    "completed_at": null,
    "completion_percentage": 0.0
}

"course_id": "40",
"course_name": "حفظ القرآن للأطفال",

{
    "capacity": 15,
    "enrolled_count": 11,
    "available_spots": 4,
    "active_students": 11,
    "suspended_students": 0,
    "completed_students": 0,
    "dropped_students": 0,
    "refunded_students": 0
}
*/
