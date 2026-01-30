"use client";

import courseLecturesViewConfig from "@/components/courses/course-lectures-view.config";
import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { Lecture } from "@/types/entities";
import { DataViewPagination } from "../ui/data-view/DataViewPagination";
import { DataViewHeader, DataViewRow } from "../ui/data-view/DataViewRow";
import TrashIcon from "@/components/icons/TrashIcon";

const { sortConfig, filterConfig, statusMap } = courseLecturesViewConfig;

export default function CourseLecturesView({
  lectures,
}: {
  lectures: Lecture[];
}) {
  return (
    <DataView
      data={lectures}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.75fr)]",
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
        <DataViewCell>البداية</DataViewCell>
        <DataViewCell>النهاية</DataViewCell>
        <DataViewCell>الحالة</DataViewCell>
        <DataViewCell></DataViewCell>
      </DataViewHeader>

      <DataViewBody
        render={{
          table: (lecture: Lecture, i: number) => {
            const { label, color } = statusMap[lecture.status];

            return (
              <DataViewRow key={lecture.id} index={i}>
                <DataViewCell className="font-bold">
                  {toHindiDigits(i + 1)}
                </DataViewCell>
                <DataViewCell>{lecture.title}</DataViewCell>
                <DataViewCell>
                  {new Date(lecture.start_time || "").toLocaleDateString(
                    "ar-eg",
                  )}
                </DataViewCell>
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
                  <div className="[&>button]:text-olive-300 [&>button]:hover:text-olive-700 flex items-center justify-center gap-6 [&>button]:transition-colors">
                    <button>
                      <TrashIcon />
                    </button>

                    <button>
                      <EditIcon />
                    </button>

                    <button>
                      <InfoIcon />
                    </button>
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
