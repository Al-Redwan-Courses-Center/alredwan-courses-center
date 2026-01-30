import {
  StatusMap,
  DataViewFilterConfig,
  DataViewSortConfig,
} from "@/types/components";
import { Lecture } from "@/types/entities";

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
  "not-submitted": 0,
};

const sortConfig: DataViewSortConfig<Lecture> = {
  lecture: {
    sortFn: (a: Lecture, b: Lecture) => a.title.localeCompare(b.title),
    label: headers[1],
  },
  date: {
    sortFn: (a: Lecture, b: Lecture) =>
      new Date(a.start_time || "").getTime() -
      new Date(b.start_time || "").getTime(),
    label: headers[2],
  },
  startTime: {
    sortFn: (a: Lecture, b: Lecture) =>
      (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0),
    label: headers[3],
  },
  endTime: {
    sortFn: (a: Lecture, b: Lecture) =>
      (a.endTime?.getTime() || 0) - (b.endTime?.getTime() || 0),
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

const statusMap: StatusMap<Lecture> = {
  submitted: {
    label: "تم التسجيل",
    color: "green",
  },
  "not-submitted": {
    label: "غير مسجلة",
    color: "gray",
  },
};

const courseLecturesViewConfig = {
  sortConfig,
  filterConfig,
  statusMap,
};

export default courseLecturesViewConfig;
