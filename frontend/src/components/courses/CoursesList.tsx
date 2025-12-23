import CourseCard from "@/components/courses/CourseCard";
import { courses as coursesApi, PublicCourse } from "@/dev-data/public-courses";

export default async function CoursesList() {
  const {
    data: { courses },
  }: { status: string; data: { courses: PublicCourse[] } } = await new Promise(
    (resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "success",
            data: {
              courses: coursesApi,
            },
          }),
        1500,
      ),
  );

  return (
    <div className="mb-17 grid grid-cols-3 gap-27">
      {courses.map((course, i) => (
        <CourseCard key={course.id} course={course} index={i} />
      ))}
    </div>
  );
}
