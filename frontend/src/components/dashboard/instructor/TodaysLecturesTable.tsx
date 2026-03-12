// PASSING CONFIG FUNCTIONS TO THE TABLE COMPONENT (NON-SERIALIZABLE DATA WHILE SERVER -> CLIENT)
"use client";

import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import lecturesViewConfig from "@/components/dashboard/instructor/lectures-view.config";
import StatusBadge from "@/components/ui/StatusBadge";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import Link from "next/link";
import { DataViewPagination } from "../../ui/data-view/DataViewPagination";
import { DataViewHeader, DataViewRow } from "../../ui/data-view/DataViewRow";
import { TodaysLectureListItem } from "@/types/config";

const { sortConfig, filterConfig, statusMap } = lecturesViewConfig;

export default function TodaysLecturesTable({
  todaysLectures = [],
}: {
  todaysLectures?: TodaysLectureListItem[];
}) {
  return (
    <DataView
      data={todaysLectures}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
    >
      <div className="relative z-100 mb-14 flex items-center gap-32">
        <DataViewSearch />
        <DataViewSort />
        <DataViewFilter />
      </div>

      <DataViewHeader>
        <DataViewCell>م</DataViewCell>
        <DataViewCell>المحاضرة</DataViewCell>
        <DataViewCell>الدورة</DataViewCell>
        <DataViewCell>البداية</DataViewCell>
        <DataViewCell>النهاية</DataViewCell>
        <DataViewCell>الحالة</DataViewCell>
        <DataViewCell></DataViewCell>
      </DataViewHeader>

      <DataViewBody<TodaysLectureListItem>
        render={{
          table: (lecture, i) => {
            const { label, color } = statusMap[lecture.status];

            return (
              <DataViewRow key={lecture.id} index={i}>
                <DataViewCell className="font-bold">
                  {toHindiDigits(i + 1)}
                </DataViewCell>
                <DataViewCell>{lecture.title}</DataViewCell>
                <DataViewCell>{lecture.course.name}</DataViewCell>
                <DataViewCell className="font-bold">
                  {formatTime(lecture.start_time)}
                </DataViewCell>
                <DataViewCell className="font-bold">
                  {formatTime(lecture.end_time)}
                </DataViewCell>
                <DataViewCell>
                  <StatusBadge color={color}>{label}</StatusBadge>
                </DataViewCell>
                <DataViewCell>
                  <div className="*:text-olive-300 *:hover:text-olive-700 flex items-center justify-center gap-6 *:transition-colors">
                    <button>
                      <EditIcon />
                    </button>

                    <Link
                      href={`/dashboard/my-courses/${lecture.course.id}/lectures/${lecture.id}`}
                    >
                      <InfoIcon />
                    </Link>
                  </div>
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
