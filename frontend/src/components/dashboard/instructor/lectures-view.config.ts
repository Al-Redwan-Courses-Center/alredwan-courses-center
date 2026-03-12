import {
  DataViewFilterConfig,
  DataViewSortConfig,
  StatusMap,
} from "@/types/components";
import { TodaysLectureListItem } from "@/types/config";
import { parse } from "date-fns";

const statusWeights: Record<TodaysLectureListItem["status"], number> = {
  scheduled: 0,
  additional: 1,
  completed: 2,
  cancelled: 3,
};

const sortConfig: DataViewSortConfig<TodaysLectureListItem> = {
  lecture: {
    sortFn: (a: TodaysLectureListItem, b: TodaysLectureListItem) =>
      a.title.localeCompare(b.title),
    label: "المحاضرة",
  },
  course: {
    sortFn: (a: TodaysLectureListItem, b: TodaysLectureListItem) =>
      a.course.name.localeCompare(b.course.name),
    label: "الدورة",
  },
  startTime: {
    sortFn: (a: TodaysLectureListItem, b: TodaysLectureListItem) =>
      parse(a.start_time, "HH:mm", new Date()).getTime() -
      parse(b.start_time, "HH:mm", new Date()).getTime(),
    label: "البداية",
  },
  endTime: {
    sortFn: (a: TodaysLectureListItem, b: TodaysLectureListItem) =>
      parse(a.end_time, "HH:mm", new Date()).getTime() -
      parse(b.end_time, "HH:mm", new Date()).getTime(),
    label: "النهاية",
  },
  status: {
    sortFn: (a: TodaysLectureListItem, b: TodaysLectureListItem) =>
      statusWeights[a.status] - statusWeights[b.status],
    label: "الحالة",
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

const statusMap: StatusMap<TodaysLectureListItem> = {
  completed: {
    label: "تم التسجيل",
    color: "green",
  },
  scheduled: {
    label: "غير مسجلة",
    color: "gray",
  },
  additional: {
    label: "غير مسجلة",
    color: "gray",
  },
  cancelled: {
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
