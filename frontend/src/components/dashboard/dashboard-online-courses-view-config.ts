import { DataViewFilterConfig, DataViewSortConfig } from "@/types/components";
import { OnlineCourseListItem } from "@/types/entities";
import { parseISO } from "date-fns";

export type OnlineCoursesViewItem = OnlineCourseListItem & {
  price_value: number;
  instructor_name: string;
};

const getPriceValue = (course: OnlineCourseListItem) => {
  const cleaned = String(course.price).replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildOnlineCoursesView = (
  items: OnlineCourseListItem[],
): OnlineCoursesViewItem[] =>
  items.map((course) => ({
    ...course,
    price_value: getPriceValue(course),
    instructor_name: course.instructor?.name || "بدون مدرب",
  }));

export const sortOnlineCoursesConfig: DataViewSortConfig<OnlineCoursesViewItem> = {
  title: {
    sortFn: (a, b) => a.name.localeCompare(b.name),
    label: "اسم الدورة",
  },
  price: {
    sortFn: (a, b) => a.price_value - b.price_value,
    label: "السعر",
  },
  duration: {
    sortFn: (a, b) => a.total_duration_seconds - b.total_duration_seconds,
    label: "المدة الزمنية",
  },
  videos: {
    sortFn: (a, b) => a.video_count - b.video_count,
    label: "عدد الفيديوهات",
  },
  enrollments: {
    sortFn: (a, b) => a.enrolled_count - b.enrolled_count,
    label: "المسجلون",
  },
  date: {
    sortFn: (a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime(),
    label: "تاريخ الإضافة",
  }
};

export const getOnlineCoursesFilterConfig = (
  courses: OnlineCoursesViewItem[],
): DataViewFilterConfig => {
  const instructorFilters = Array.from(
    new Set(courses.map((course) => course.instructor_name).filter(name => name !== "بدون مدرب")),
  ).reduce<DataViewFilterConfig>((acc, instructorName) => {
    acc[instructorName!] = {
      key: "instructor_name",
      label: `المدرب: ${instructorName}`,
    };
    return acc;
  }, {});

  return {
    ...instructorFilters,
  };
};
