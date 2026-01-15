import { Lecture, StatusMap } from "@/types";

const headers = ["م", "المحاضرة", "الدورة", "البداية", "النهاية", "الحالة", ""];

const statusWeights = {
  submitted: 1,
  "not-submitted": 0,
};

const sortConfig = {
  lecture: {
    sortFn: (a: Lecture, b: Lecture) => a.title.localeCompare(b.title),
    label: headers[1],
  },
  course: {
    sortFn: (a: Lecture, b: Lecture) =>
      a.courseName.localeCompare(b.courseName),
    label: headers[2],
  },
  startTime: {
    sortFn: (a: Lecture, b: Lecture) =>
      a.startTime.getTime() - b.startTime.getTime(),
    label: headers[3],
  },
  endTime: {
    sortFn: (a: Lecture, b: Lecture) =>
      a.endTime.getTime() - b.endTime.getTime(),
    label: headers[4],
  },
  status: {
    sortFn: (a: Lecture, b: Lecture) =>
      statusWeights[a.status] - statusWeights[b.status],
    label: headers[5],
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

const lecturesTableConfig = {
  sortConfig,
  statusMap,
};

export default lecturesTableConfig;
