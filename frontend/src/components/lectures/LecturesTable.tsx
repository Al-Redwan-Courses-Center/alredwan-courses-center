import EditIcon from "@/components/icons/EditIcon";
import InfoIcon from "@/components/icons/InfoIcon";
import lecturesTableConfig from "@/components/lectures/lectures-table.config";
import StatusBadge from "@/components/ui/StatusBadge";
import Table from "@/components/ui/table/Table";
import TableBody from "@/components/ui/table/TableBody";
import TableCell from "@/components/ui/table/TableCell";
import TableFilter from "@/components/ui/table/TableFilter";
import TableSearch from "@/components/ui/table/TableSearch";
import { lectures } from "@/dev-data/lectures";
import { cn, formatTime, toHindiDigits } from "@/lib/utils";
import { Lecture } from "@/types/entities";
import { TablePagination } from "../ui/table/TablePagination";
import { TableHeader, TableRow } from "../ui/table/TableRow";

const { sortConfig, filterConfig, statusMap } = lecturesTableConfig;

export default function LecturesTable() {
  return (
    <Table
      data={lectures}
      sortConfig={sortConfig}
      filterConfig={filterConfig}
      gridLayout={cn(
        "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
      )}
    >
      <div className="relative z-100 mb-14 flex items-center gap-32">
        <TableSearch />

        <TableFilter />

        <TableFilter />
      </div>

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
