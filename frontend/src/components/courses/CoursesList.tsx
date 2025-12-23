import CourseCard from "@/components/courses/CourseCard";
import { PublicCourse } from "@/dev-data/public-courses";
import { JSONResponse } from "@/types";
import axios from "axios";

export default async function CoursesList() {
  const {
    data: {
      data: { courses },
    },
  } = await axios.get<JSONResponse<{ courses: PublicCourse[] }>>(
    `${process.env.SERVER_URL}/public-courses`,
  );

  return (
    <div className="mb-17 grid grid-cols-3 gap-27">
      {courses.map((course, i) => (
        <CourseCard key={course.id} course={course} index={i} />
      ))}
    </div>
  );
}
