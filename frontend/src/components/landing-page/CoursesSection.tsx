import { getLandingPageCourses } from "@/actions/landing";
import PublicCoursesList from "@/components/courses/PublicCoursesList";
import Button from "@/components/ui/Button";

export default async function CoursesSection() {
  const courses = (await getLandingPageCourses()).sort(
    (a, b) => a.order - b.order,
  );

  return (
    <section className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_0%,#F3F6F4_100%)]">
      <div className="title-block">
        <h2>
          الدورات <span>المميزة</span>
        </h2>

        <p className="mb-36 text-center text-4xl text-gray-600">
          اكتشف أفضل الدورات التعليمية المصممة خصيصاً لتطوير مهارات الأطفال
          والشباب
        </p>
      </div>

      <PublicCoursesList courses={courses} />

      <Button
        variant="primary"
        href="/courses"
        className="not-mobile-lg:self-start mobile-lg:mt-10"
      >
        تصفح الدورات
      </Button>
    </section>
  );
}
