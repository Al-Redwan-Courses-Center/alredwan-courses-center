import type {
  DataViewFilterConfig,
  DataViewSortConfig,
} from "@/types/components";
import type { LectureAttendanceDetail } from "@/types/entities";

const sortConfig: DataViewSortConfig<LectureAttendanceDetail> = {
  // lecture: {
  //   sortFn: (a: Student | Child, b: Student | Child) =>
  //     a.title.localeCompare(b.title),
  //   label: headers[1],
  // },
  // date: {
  //   sortFn: (a: Student | Child, b: Student | Child) =>
  //     new Date(a.start_time || "").getTime() -
  //     new Date(b.start_time || "").getTime(),
  //   label: headers[2],
  // },
  // startTime: {
  //   sortFn: (a: Student | Child, b: Student | Child) =>
  //     parse(a.start_time || "", "HH:mm", new Date()).getTime() -
  //     parse(b.start_time || "", "HH:mm", new Date()).getTime(),
  //   label: headers[3],
  // },
  // endTime: {
  //   sortFn: (a: Student | Child, b: Student | Child) =>
  //     parse(a.end_time || "", "HH:mm", new Date()).getTime() -
  //     parse(b.end_time || "", "HH:mm", new Date()).getTime(),
  //   label: headers[4],
  // },
  // status: {
  //   sortFn: (a: Student | Child, b: Student | Child) =>
  //     statusWeights[a.status] - statusWeights[b.status],
  //   label: headers[5],
  // },
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

const lectureAttendanceViewConfig = {
  sortConfig,
  filterConfig,
};

export default lectureAttendanceViewConfig;
