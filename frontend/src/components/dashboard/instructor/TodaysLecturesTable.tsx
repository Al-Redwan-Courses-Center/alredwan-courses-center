// PASSING CONFIG FUNCTIONS TO THE TABLE COMPONENT (NON-SERIALIZABLE DATA WHILE SERVER -> CLIENT)
"use client";

import { format } from "date-fns";
import Link from "next/link";
import lecturesViewConfig from "@/components/dashboard/instructor/lectures-view.config";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import DataViewLegacy from "@/components/ui/data-view/DataView";
import DataViewBodyLegacy from "@/components/ui/data-view/DataViewBody";
import DataViewCellLegacy from "@/components/ui/data-view/DataViewCell";
import DataViewExportLegacy from "@/components/ui/data-view/DataViewExportLegacy";
import DataViewFilterLegacy from "@/components/ui/data-view/DataViewFilter";
import { DataViewPaginationLegacy } from "@/components/ui/data-view/DataViewPagination";
import DataViewSearchLegacy from "@/components/ui/data-view/DataViewSearch";
import DataViewSortLegacy from "@/components/ui/data-view/DataViewSort";
import StatusBadge from "@/components/ui/StatusBadge";
import { exportToExcel } from "@/lib/export";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import type { TodaysLectureListItem } from "@/types/config";
import {
  DataViewHeaderLegacy,
  DataViewRowLegacy,
} from "../../ui/data-view/DataViewRow";

const { sortConfig, filterConfig, statusMap } = lecturesViewConfig;

export default function TodaysLecturesTable({
  todaysLectures = [],
}: {
  todaysLectures?: TodaysLectureListItem[];
}) {
  function handleExport() {
    const exportData = todaysLectures.map((lecture, i) => {
      const { label } = statusMap[lecture.status];
      return {
        م: i + 1,
        المحاضرة: lecture.title,
        الدورة: lecture.course.name,
        البداية: formatTime(lecture.start_time),
        النهاية: formatTime(lecture.end_time),
        الحالة: label,
      };
    });

    const today = format(new Date(), "yyyy-MM-dd");
    exportToExcel(exportData, `محاضرات_اليوم_${today}`);
  }

  return (
    <DataViewLegacy
      data={todaysLectures}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
    >
      <div className="relative z-100 mb-14 flex items-center gap-32">
        <DataViewExportLegacy onExport={handleExport} />
        <DataViewSearchLegacy />
        <DataViewSortLegacy />
        <DataViewFilterLegacy />
      </div>

      <DataViewHeaderLegacy>
        <DataViewCellLegacy>م</DataViewCellLegacy>
        <DataViewCellLegacy>المحاضرة</DataViewCellLegacy>
        <DataViewCellLegacy>الدورة</DataViewCellLegacy>
        <DataViewCellLegacy>البداية</DataViewCellLegacy>
        <DataViewCellLegacy>النهاية</DataViewCellLegacy>
        <DataViewCellLegacy>الحالة</DataViewCellLegacy>
        <DataViewCellLegacy></DataViewCellLegacy>
      </DataViewHeaderLegacy>

      <DataViewBodyLegacy<TodaysLectureListItem>
        render={{
          table: (lecture, i) => {
            const { label, color } = statusMap[lecture.status];

            return (
              <DataViewRowLegacy key={lecture.id} index={i}>
                <DataViewCellLegacy className="font-bold">
                  {toHindiDigits(i + 1)}
                </DataViewCellLegacy>
                <DataViewCellLegacy>{lecture.title}</DataViewCellLegacy>
                <DataViewCellLegacy>{lecture.course.name}</DataViewCellLegacy>
                <DataViewCellLegacy className="font-bold">
                  {formatTime(lecture.start_time)}
                </DataViewCellLegacy>
                <DataViewCellLegacy className="font-bold">
                  {formatTime(lecture.end_time)}
                </DataViewCellLegacy>
                <DataViewCellLegacy>
                  <StatusBadge color={color}>{label}</StatusBadge>
                </DataViewCellLegacy>
                <DataViewCellLegacy>
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
                </DataViewCellLegacy>
              </DataViewRowLegacy>
            );
          },

          cards: () => null,
        }}
      />

      <DataViewPaginationLegacy />
    </DataViewLegacy>
  );
}
