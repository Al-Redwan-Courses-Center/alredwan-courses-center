"use client";

import lecturesTableConfig from "@/components/lectures/lectures-table.config";
import Table from "@/components/ui/table/Table";
import TableBody from "@/components/ui/table/TableBody";
import TableCell from "@/components/ui/table/TableCell";
import { TableOperations } from "@/components/ui/table/TableOperations";
import { lectures } from "@/dev-data/lectures";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { TablePagination } from "../ui/table/TablePagination";
import { TableHeader, TableRow } from "../ui/table/TableRow";
import StatusBadge from "@/components/ui/StatusBadge";
import InfoIcon from "@/components/icons/InfoIcon";
import EditIcon from "@/components/icons/EditIcon";
import { Lecture } from "@/types/entities";

const { sortConfig, filterConfig, statusMap } = lecturesTableConfig;

export default function LecturesTable() {
  return (
    <Table
      data={lectures}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      searchableValues={Object.keys(lectures[1]) as (keyof Lecture)[]}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
    >
      <TableOperations />

      <TableHeader>
        <TableCell>م</TableCell>
        <TableCell>المحاضرة</TableCell>
        <TableCell>الدورة</TableCell>
        <TableCell>البداية</TableCell>
        <TableCell>النهاية</TableCell>
        <TableCell>الحالة</TableCell>
        <TableCell></TableCell>
      </TableHeader>

      <TableBody
        render={(lecture: Lecture, i: number) => {
          const { label, color } = statusMap[lecture.status];

          return (
            <TableRow key={lecture.id} index={i}>
              <TableCell className="font-bold">
                {toHindiDigits(lecture.id)}
              </TableCell>
              <TableCell>{lecture.title}</TableCell>
              <TableCell>{lecture.courseName}</TableCell>
              <TableCell className="font-bold">
                {formatTime(lecture.startTime)}
              </TableCell>
              <TableCell className="font-bold">
                {formatTime(lecture.endTime)}
              </TableCell>
              <TableCell>
                <StatusBadge color={color}>{label}</StatusBadge>
              </TableCell>
              <TableCell>
                <div className="[&>button]:text-olive-300 [&>button]:hover:text-olive-700 flex items-center justify-center gap-6 [&>button]:transition-colors">
                  <button>
                    <EditIcon />
                  </button>

                  <button>
                    <InfoIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        }}
      />

      <TablePagination />
    </Table>
  );
}
