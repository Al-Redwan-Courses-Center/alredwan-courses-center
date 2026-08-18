// PASSING CONFIG FUNCTIONS TO THE TABLE COMPONENT (NON-SERIALIZABLE DATA WHILE SERVER -> CLIENT)
"use client";

import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import lecturesViewConfig from "@/components/lectures/lectures-view.config";
import StatusBadge from "@/components/ui/StatusBadge";
import DataView from "@/components/ui/data-view/DataView";
import DataViewBody from "@/components/ui/data-view/DataViewBody";
import DataViewCell from "@/components/ui/data-view/DataViewCell";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import { lectures } from "@/dev-data/lectures";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { Lecture } from "@/types/entities";
import { DataViewPagination } from "../ui/data-view/DataViewPagination";
import { DataViewHeader, DataViewRow } from "../ui/data-view/DataViewRow";

const { sortConfig, filterConfig, statusMap } = lecturesViewConfig;

export default function LecturesTable() {
  return (
    <DataView
      data={lectures}
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

      <DataViewBody
        render={{
          table: (lecture: Lecture, i: number) => {
            const { label, color } = statusMap[lecture.status];

            return (
              <DataViewRow key={lecture.id} index={i}>
                <DataViewCell className="font-bold">
                  {toHindiDigits(lecture.id)}
                </DataViewCell>
                <DataViewCell>{lecture.title}</DataViewCell>
                <DataViewCell>{lecture.courseName}</DataViewCell>
                <DataViewCell className="font-bold">
                  {formatTime(lecture.startTime)}
                </DataViewCell>
                <DataViewCell className="font-bold">
                  {formatTime(lecture.endTime)}
                </DataViewCell>
                <DataViewCell>
                  <StatusBadge color={color}>{label}</StatusBadge>
                </DataViewCell>
                <DataViewCell>
                  <div className="[&>button]:text-olive-300 [&>button]:hover:text-olive-700 flex items-center justify-center gap-6 [&>button]:transition-colors">
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
