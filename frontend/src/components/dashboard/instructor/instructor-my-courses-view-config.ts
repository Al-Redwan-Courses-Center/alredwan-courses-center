import { parseISO } from "date-fns";
import type {
  DataViewFilterConfig,
  DataViewSortConfig,
} from "@/types/components";
import type { CourseListItem } from "@/types/entities";

export type CourseViewItem = CourseListItem & {
  course_state: "ongoing" | "upcoming" | "ended";
  availability: "open" | "full";
  season_name: string;
  price_value: number;
};

const getCourseState = (course: CourseViewItem) => {
  const todayDate = new Date();
  const startDate = parseISO(course.start_date);
  const endDate = course.end_date ? parseISO(course.end_date) : null;

  if (startDate > todayDate) return "upcoming";
  if (endDate && endDate < todayDate) return "ended";
  return "ongoing";
};

const getAvailability = (course: CourseViewItem) =>
  course.is_full || course.available_spots <= 0 ? "full" : "open";

const getPriceValue = (course: CourseViewItem) => {
  const cleaned = String(course.price).replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

function buildInstructorMyCoursesConfig(inputCourses: CourseListItem[]) {
  const courses: CourseViewItem[] = inputCourses.map((course) => {
    const viewCourse = {
      ...course,
      season_name: course.season?.name || "",
      price_value: getPriceValue(course as CourseViewItem),
    } as CourseViewItem;

    return {
      ...viewCourse,
      course_state: getCourseState(viewCourse),
      availability: getAvailability(viewCourse),
    };
  });

  const headers = ["م", "الدورة", "الموسم", "البداية", "النهاية"];

  const sortConfig: DataViewSortConfig<CourseViewItem> = {
    title: {
      sortFn: (a, b) => a.name.localeCompare(b.name),
      label: headers[1],
    },
    season: {
      sortFn: (a, b) =>
        (a.season?.name || "").localeCompare(b.season?.name || ""),
      label: headers[2],
    },
    startDate: {
      sortFn: (a, b) =>
        parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime(),
      label: headers[3],
    },
    endDate: {
      sortFn: (a, b) => {
        const aTime = a.end_date ? parseISO(a.end_date).getTime() : Infinity;
        const bTime = b.end_date ? parseISO(b.end_date).getTime() : Infinity;
        return aTime - bTime;
      },
      label: headers[4],
    },
    price: {
      sortFn: (a, b) => a.price_value - b.price_value,
      label: "السعر",
    },
    capacity: {
      sortFn: (a, b) => a.capacity - b.capacity,
      label: "السعة",
    },
    enrollments: {
      sortFn: (a, b) => a.enrolled_count - b.enrolled_count,
      label: "المسجلون",
    },
  };

  const seasonFilters = Array.from(
    new Set(courses.map((course) => course.season_name).filter(Boolean)),
  ).reduce<DataViewFilterConfig>((acc, seasonName) => {
    acc[seasonName] = {
      key: "season_name",
      label: `الموسم: ${seasonName}`,
    };

    return acc;
  }, {});

  const filterConfig: DataViewFilterConfig = {
    ongoing: {
      key: "course_state",
      label: "جارية",
    },
    upcoming: {
      key: "course_state",
      label: "قادمة",
    },
    ended: {
      key: "course_state",
      label: "منتهية",
    },
    open: {
      key: "availability",
      label: "متاحة للتسجيل",
    },
    full: {
      key: "availability",
      label: "مكتملة",
    },
    ...seasonFilters,
  };

  return { courses, filterConfig, sortConfig };
}

export default buildInstructorMyCoursesConfig;
