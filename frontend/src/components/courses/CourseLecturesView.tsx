"use client";

import courseLecturesViewConfig from "@/components/courses/course-lectures-view.config";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import {
  cn,
  formatDate,
  formatTime,
  getWeekDay,
  toHindiDigits,
} from "@/lib/utils";
import { CourseDetail, LectureListItem } from "@/types/entities";
import { parseISO } from "date-fns";
import Link from "next/link";
import { DataViewPagination } from "../ui/data-view/DataViewPagination";
import { DataViewHeader, DataViewRow } from "../ui/data-view/DataViewRow";

const { sortConfig, filterConfig, statusMap } = courseLecturesViewConfig;

export default function CourseLecturesView({
  lectures,
  course,
}: {
  lectures: LectureListItem[];
  course: CourseDetail | null;
}) {
  console.log(lectures[9].id);

  return (
    <DataView
      data={lectures}
      maxItemsPerPage={5}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]",
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
        <DataViewCell>التاريخ</DataViewCell>
        <DataViewCell>اليوم</DataViewCell>
        <DataViewCell>البداية</DataViewCell>
        <DataViewCell>النهاية</DataViewCell>
        <DataViewCell>الحالة</DataViewCell>
        <DataViewCell></DataViewCell>
      </DataViewHeader>

      <DataViewBody
        render={{
          table: (lecture: LectureListItem, i: number) => {
            const { label, color } = statusMap[lecture.status];
            const weekday = getWeekDay(parseISO(lecture.scheduled_at).getDay());

            return (
              <DataViewRow key={lecture.id} index={i}>
                <DataViewCell className="font-bold">
                  {toHindiDigits(i + 1)}
                </DataViewCell>

                <DataViewCell>{lecture.title}</DataViewCell>

                <DataViewCell>
                  {formatDate(parseISO(lecture.scheduled_at))}
                </DataViewCell>

                <DataViewCell className="font-bold">{weekday}</DataViewCell>

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
                      <TrashIcon />
                    </button>

                    <Link
                      href={`/dashboard/my-courses/${course?.id}/lectures/`}
                    >
                      <EditIcon />
                    </Link>

                    <Link
                      href={`/dashboard/my-courses/${course?.id}/lectures/${lecture.id}`}
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
