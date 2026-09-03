import { parseISO } from "date-fns";
import type {
  DataViewFilterConfig,
  DataViewSortConfig,
  StatusMap,
} from "@/types/components";
import type { CourseDetail, LectureListItem } from "@/types/entities";
import { formatDate, formatTime, getWeekDay, toHindiDigits } from "@/lib/utils";

export type LectureViewItem = LectureListItem & {
  display_title: string;
  weekday: string;
  formatted_date: string;
  formatted_start_time: string;
  formatted_end_time: string;
  status_label: string;
  instructor_name: string;
  course_name: string;
  lecture_number_str: string;
  lecture_number_hindi: string;
  search_text: string;
};

const headers = [
  "م",
  "المحاضرة",
  "التاريخ",
  "اليوم",
  "البداية",
  "النهاية",
  "الحالة",
  "",
];

const statusWeights: Record<string, number> = {
  scheduled: 0,
  additional: 1,
  completed: 2,
  cancelled: 3,
};

const arabicOrdinals = [
  "",
  "الاولى",
  "الثانيه",
  "الثالثه",
  "الرابعه",
  "الخامسه",
  "السادسه",
  "السابعه",
  "الثامنه",
  "التاسعه",
  "العاشره",
  "الحاديه عشر",
  "الثانيه عشر",
  "الثالثه عشر",
  "الرابعه عشر",
  "الخامسه عشر",
  "السادسه عشر",
  "السابعه عشر",
  "الثامنه عشر",
  "التاسعه عشر",
  "العشرون",
];

export function buildCourseLecturesView(
  lectures: LectureListItem[],
  course?: CourseDetail | null,
): LectureViewItem[] {
  return lectures.map((lecture, index) => {
    const lectureNum = lecture.lecture_number ?? index + 1;
    const rawTitle = lecture.title?.trim() || "";
    const displayTitle = rawTitle || `محاضرة ${toHindiDigits(lectureNum)}`;

    let weekday = "";
    let formattedDate = "";
    const dateSource = lecture.scheduled_at || lecture.day;
    if (dateSource) {
      try {
        const parsed = parseISO(dateSource);
        weekday = getWeekDay(parsed.getDay());
        formattedDate = formatDate(parsed);
      } catch {
        weekday = lecture.day || "";
        formattedDate = lecture.day || "";
      }
    }

    const formattedStartTime =
      formatTime(lecture.start_time) || lecture.start_time || "";
    const formattedEndTime =
      formatTime(lecture.end_time) || lecture.end_time || "";
    const statusEntry = statusMap[lecture.status];
    const statusLabel = statusEntry
      ? statusEntry.label
      : lecture.status_display || lecture.status || "";
    const instructorName = lecture.instructor?.full_name || "";
    const courseName = lecture.course?.name || course?.name || "";
    const lectureNumStr = String(lectureNum);
    const lectureNumHindi = toHindiDigits(lectureNum);
    const ordinal = arabicOrdinals[lectureNum] || "";

    const searchText = [
      displayTitle,
      rawTitle,
      `محاضرة ${lectureNum}`,
      `المحاضرة ${lectureNum}`,
      `محاضرة ${lectureNumHindi}`,
      `المحاضرة ${lectureNumHindi}`,
      `محاضرة ${ordinal}`,
      `المحاضرة ${ordinal}`,
      `درس ${lectureNum}`,
      `الدرس ${lectureNum}`,
      `درس ${lectureNumHindi}`,
      `الدرس ${lectureNumHindi}`,
      `درس ${ordinal}`,
      `الدرس ${ordinal}`,
      lectureNumStr,
      lectureNumHindi,
      weekday,
      formattedDate,
      lecture.day || "",
      formattedStartTime,
      formattedEndTime,
      lecture.start_time || "",
      lecture.end_time || "",
      statusLabel,
      lecture.status_display || "",
      lecture.status || "",
      instructorName,
      courseName,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...lecture,
      display_title: displayTitle,
      weekday,
      formatted_date: formattedDate,
      formatted_start_time: formattedStartTime,
      formatted_end_time: formattedEndTime,
      status_label: statusLabel,
      instructor_name: instructorName,
      course_name: courseName,
      lecture_number_str: lectureNumStr,
      lecture_number_hindi: lectureNumHindi,
      search_text: searchText,
    };
  });
}

const sortConfig: DataViewSortConfig<LectureViewItem> = {
  lecture: {
    sortFn: (a: LectureViewItem, b: LectureViewItem) =>
      (a.display_title || a.title || "").localeCompare(
        b.display_title || b.title || "",
      ),
    label: headers[1],
  },
  date: {
    sortFn: (a: LectureViewItem, b: LectureViewItem) => {
      const aTime = new Date(a.scheduled_at || a.day || "").getTime();
      const bTime = new Date(b.scheduled_at || b.day || "").getTime();
      return (isNaN(aTime) ? 0 : aTime) - (isNaN(bTime) ? 0 : bTime);
    },
    label: headers[2],
  },
  startTime: {
    sortFn: (a: LectureViewItem, b: LectureViewItem) =>
      (a.start_time || "").localeCompare(b.start_time || ""),
    label: headers[4],
  },
  endTime: {
    sortFn: (a: LectureViewItem, b: LectureViewItem) =>
      (a.end_time || "").localeCompare(b.end_time || ""),
    label: headers[5],
  },
  status: {
    sortFn: (a: LectureViewItem, b: LectureViewItem) =>
      (statusWeights[a.status] ?? 99) - (statusWeights[b.status] ?? 99),
    label: headers[6],
  },
};

const filterConfig: DataViewFilterConfig = {
  completed: {
    key: "status",
    label: "تم التسجيل",
  },
  scheduled: {
    key: "status",
    label: "غير مسجلة",
  },
  additional: {
    key: "status",
    label: "إضافية",
  },
  cancelled: {
    key: "status",
    label: "ملغية",
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
  buildCourseLecturesView,
};

export default courseLecturesViewConfig;
