import PublicCourseCard from "@/components/courses/PublicCourseCard";
import { LANDING_PAGE_COURSES } from "@/dev-data/db";

export default async function PublicCoursesList() {
  const {
    data: { courses },
  }: { status: string; data: { courses: typeof LANDING_PAGE_COURSES } } =
    await new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "success",
            data: {
              courses: LANDING_PAGE_COURSES,
            },
          }),
        1500,
      ),
    );

  return (
    <div className="tablet:grid-cols-2 tablet:gap-17 mb-17 grid grid-cols-3 gap-27">
      {courses.map(({ course }, i) => (
        <PublicCourseCard key={course.id} course={course} index={i} />
      ))}
    </div>
  );
}
