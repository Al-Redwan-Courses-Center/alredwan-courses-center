"use client";

import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import { DataViewPagination } from "@/components/ui/data-view/DataViewPagination";
import {
  DataViewHeader,
  DataViewRow,
} from "@/components/ui/data-view/DataViewRow";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, formatDate, toHindiDigits } from "@/lib/utils";
import { InstructorEnrollmentListItem } from "@/types/entities";
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
