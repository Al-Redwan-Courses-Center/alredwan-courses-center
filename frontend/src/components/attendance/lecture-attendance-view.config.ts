import {
  DataViewFilterConfig,
  DataViewSortConfig,
  StatusMap,
} from "@/types/components";
import { Child, Student } from "@/types/entities";
import { parse } from "date-fns";

const headers = [
  "م",
  "المحاضرة",
  "التاريخ",
  "البداية",
  "النهاية",
  "الحالة",
  "",
];

const statusWeights = {
  submitted: 1,
  pending: 0,
};

const sortConfig: DataViewSortConfig<Student | Child> = {
  lecture: {
    sortFn: (a: Student | Child, b: Student | Child) =>
      a.title.localeCompare(b.title),
    label: headers[1],
  },
  date: {
    sortFn: (a: Student | Child, b: Student | Child) =>
      new Date(a.start_time || "").getTime() -
      new Date(b.start_time || "").getTime(),
    label: headers[2],
  },
  startTime: {
    sortFn: (a: Student | Child, b: Student | Child) =>
      parse(a.start_time || "", "HH:mm", new Date()).getTime() -
      parse(b.start_time || "", "HH:mm", new Date()).getTime(),
    label: headers[3],
  },
  endTime: {
    sortFn: (a: Student | Child, b: Student | Child) =>
      parse(a.end_time || "", "HH:mm", new Date()).getTime() -
      parse(b.end_time || "", "HH:mm", new Date()).getTime(),
    label: headers[4],
  },
  status: {
    sortFn: (a: Student | Child, b: Student | Child) =>
      statusWeights[a.status] - statusWeights[b.status],
    label: headers[5],
  },
};

const filterConfig: DataViewFilterConfig = {
  submitted: {
    key: "status",
    label: "مسجلة",
  },

  pending: {
    key: "status",
    label: "غير مسجلة",
  },
};

const statusMap: StatusMap<Student | Child> = {
  submitted: {
    label: "تم التسجيل",
    color: "green",
  },
  pending: {
    label: "غير مسجلة",
    color: "gray",
  },
};

const lectureAttendanceViewConfig = {
  sortConfig,
  filterConfig,
  statusMap,
};

export default lectureAttendanceViewConfig;
