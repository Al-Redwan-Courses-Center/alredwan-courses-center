import {
  DataViewFilterConfig,
  DataViewSortConfig,
  StatusMap,
} from "@/types/components";
import { Lecture } from "@/types/entities";
import { parse } from "date-fns";

const headers = ["م", "المحاضرة", "الدورة", "البداية", "النهاية", "الحالة", ""];

const statusWeights = {
  submitted: 1,
  pending: 0,
};

const sortConfig: DataViewSortConfig<Lecture> = {
  lecture: {
    sortFn: (a: Lecture, b: Lecture) => a.title.localeCompare(b.title),
    label: headers[1],
  },
  course: {
    sortFn: (a: Lecture, b: Lecture) =>
      (a.course_title || "").localeCompare(b.course_title || ""),
    label: headers[2],
  },
  startTime: {
    sortFn: (a: Lecture, b: Lecture) =>
      parse(a.start_time || "", "HH:mm", new Date()).getTime() -
      parse(b.start_time || "", "HH:mm", new Date()).getTime(),
    label: headers[3],
  },
  endTime: {
    sortFn: (a: Lecture, b: Lecture) =>
      parse(a.end_time || "", "HH:mm", new Date()).getTime() -
      parse(b.end_time || "", "HH:mm", new Date()).getTime(),
    label: headers[4],
  },
  status: {
    sortFn: (a: Lecture, b: Lecture) =>
      statusWeights[a.status] - statusWeights[b.status],
    label: headers[5],
  },
};

const filterConfig: DataViewFilterConfig = {
  submitted: {
    key: "status",
    label: "مسجلة",
  },

  "not-submitted": {
    key: "status",
    label: "غير مسجلة",
  },
};

const statusMap: StatusMap<any> = {
  submitted: {
    label: "تم التسجيل",
    color: "green",
  },
  pending: {
    label: "غير مسجلة",
    color: "gray",
  },
};

const lecturesViewConfig = {
  sortConfig,
  filterConfig,
  statusMap,
};

export default lecturesViewConfig;
