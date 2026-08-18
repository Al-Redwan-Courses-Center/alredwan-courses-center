import db from "@/dev-data/mock_db.json";
import { delay } from "@/lib/utils";

type Instructor =
  | {
      id: number;
      user_id: string;
      user: (typeof db.users)[number];
      bio: string;
      monthly_salary: number;
      joined_date: string;
      type: string;
      image: string;
    }
  | undefined;

type Course =
  | {
      id: number;
      name: string;
      slug: string;
      description: string;
      start_date: string | null;
      end_date: string | null;
      num_lectures: number | null;
      capacity: number;
      price: number;
      is_active: boolean;
      season_id: number;
      season?: (typeof db.seasons)[number];
      instructor_id: number;
      instructor?: Instructor;
      tag_ids: number[];
      tags?: typeof db.tags;
      lectures?: typeof db.lectures;
      for_adults: boolean;
      min_age: number;
      max_age: number;
      image: string;
    }
  | undefined;

function populateCourse(course: Course) {
  if (!course) return null;

  course.instructor = db.instructors.find(
    (i) => i.id === course?.instructor_id,
  ) as Instructor;

  if (!course.instructor) return null;

  course.instructor.user = db.users.find(
    (u) => u.id === course.instructor?.user_id,
  ) as (typeof db.users)[number];

  course.season = db.seasons.find((s) => s.id === course.season_id);

  course.tags = course.tag_ids.map((tId) =>
    db.tags.find((t) => t.id === tId),
  ) as (typeof db.tags)[number][];

  course.lectures = db.lectures.filter((l) => l.id === course.id);
}

export async function getCourse(id: number) {
  await delay(2000);

  const course: Course = db.courses.find((c) => c.id === id);

  populateCourse(course);

  return course;
}

export async function getMyCourses(instructorId: number) {
  await delay(2000);

  const courses = db.courses.filter((c) => c.instructor_id === instructorId);

  courses.forEach((c) => populateCourse(c));

  return courses;
}
