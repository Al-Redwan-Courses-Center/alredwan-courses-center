import { parse } from "date-fns";
import type {
  DataViewFilterConfig,
  DataViewSortConfig,
  StatusMap,
} from "@/types/components";
import type { LectureListItem } from "@/types/entities";

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
  scheduled: 0,
  additional: 1,
  completed: 2,
  cancelled: 3,
};

const sortConfig: DataViewSortConfig<LectureListItem> = {
  lecture: {
    sortFn: (a: LectureListItem, b: LectureListItem) =>
      a.title.localeCompare(b.title),
    label: headers[1],
  },
  date: {
    sortFn: (a: LectureListItem, b: LectureListItem) =>
      new Date(a.start_time || "").getTime() -
      new Date(b.start_time || "").getTime(),
    label: headers[2],
  },
  startTime: {
    sortFn: (a: LectureListItem, b: LectureListItem) =>
      parse(a.start_time || "", "HH:mm", new Date()).getTime() -
      parse(b.start_time || "", "HH:mm", new Date()).getTime(),
    label: headers[3],
  },
  endTime: {
    sortFn: (a: LectureListItem, b: LectureListItem) =>
      parse(a.end_time || "", "HH:mm", new Date()).getTime() -
      parse(b.end_time || "", "HH:mm", new Date()).getTime(),
    label: headers[4],
  },
  status: {
    sortFn: (a: LectureListItem, b: LectureListItem) =>
      statusWeights[a.status] - statusWeights[b.status],
    label: headers[5],
  },
};

const filterConfig: DataViewFilterConfig = {
  completed: {
    key: "status",
    label: "مسجلة",
  },

  scheduled: {
    key: "status",
    label: "غير مسجلة",
  },
};

const statusMap: StatusMap<LectureListItem> = {
  scheduled: {
    label: "غير مسجلة",
    color: "gray",
  },
  additional: {
    label: "إضافية",
    color: "gray",
  },
  completed: {
    label: "تم التسجيل",
    color: "green",
  },
  cancelled: {
    label: "ملغية",
    color: "gray",
  },
};

const courseLecturesViewConfig = {
  sortConfig,
  filterConfig,
  statusMap,
};

export default courseLecturesViewConfig;
