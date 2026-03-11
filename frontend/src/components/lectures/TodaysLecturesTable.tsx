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
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { Lecture } from "@/types/entities";
import Link from "next/link";
import { DataViewPagination } from "../ui/data-view/DataViewPagination";
import { DataViewHeader, DataViewRow } from "../ui/data-view/DataViewRow";
import { TodaysLectureListItem } from "@/types/config";
import { useEffect, useState } from "react";
import Accordion from "@/components/ui/accordion/Accordion";
import AccordionItem from "@/components/ui/accordion/AccordionItem";
import AccordionHeader from "@/components/ui/accordion/AccordionHeader";
import AccordionHeaderInfo from "@/components/ui/accordion/AccordionHeaderInfo";
import AccordionContent from "@/components/ui/accordion/AccordionContent";

const { sortConfig, filterConfig, statusMap } = lecturesViewConfig;

export default function TodaysLecturesTable({
  todaysLectures = [],
}: {
  todaysLectures?: TodaysLectureListItem[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 500px)");

    function handleChange() {
      setIsMobile(mediaQuery.matches);
    }

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

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

      {isMobile ? (
        <>
          <div>
            <Accordion>
              {todaysLectures.map((lecture: Lecture, i: number) => {
                const { label, color } = statusMap[lecture.status];

                return (
                  <AccordionItem
                    key={lecture.id}
                    id={lecture.id.toString()}
                    rounded="top-left-bottom-right"
                    header={(isOpen) => (
                      <AccordionHeader isOpen={isOpen}>
                        <AccordionHeaderInfo
                          title={`${toHindiDigits(i + 1)}- ${lecture.title}`}
                          subtitle={lecture.course_title}
                          subtitleClassName="text-xs"
                        />
                      </AccordionHeader>
                    )}
                  >
                    <AccordionContent
                      rows={[
                        [
                          {
                            label: "البداية",
                            value: formatTime(lecture.start_time),
                          },
                          {
                            label: "النهاية",
                            value: formatTime(lecture.end_time),
                          },
                        ],
                        [
                          {
                            label: "الحالة",
                            value: (
                              <StatusBadge color={color}>{label}</StatusBadge>
                            ),
                          },
                        ],
                      ]}
                      actions={{
                        onEdit: () => console.log("Edit", lecture.id),
                        onInfo: () => {
                          window.location.href = `/dashboard/my-courses/${lecture.course.id}/lectures/${lecture.id}`;
                        },
                      }}
                    />
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </>
      ) : (
        <>
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
                      {toHindiDigits(i + 1)}
                    </DataViewCell>
                    <DataViewCell>{lecture.title}</DataViewCell>
                    <DataViewCell>{lecture.course_title}</DataViewCell>
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
        </>
      )}

      <DataViewPagination />
    </DataView>
  );
}
