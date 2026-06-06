import { getLandingPageCourses } from "@/actions/landing";
import PublicCoursesList from "@/components/courses/PublicCoursesList";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default async function CoursesSection() {
  const courses = (await getLandingPageCourses()).sort(
    (a, b) => a.order - b.order,
  );

  return (
    <section className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_0%,#F3F6F4_100%)]">
      <ScrollReveal direction="up" className="w-full flex flex-col items-center">
        <div className="title-block">
          <h2>
            الدورات <span>المميزة</span>
          </h2>

          <p className="mb-36 text-center text-4xl text-gray-600">
            اكتشف أفضل الدورات التعليمية المصممة خصيصاً لتطوير مهارات الأطفال
            والشباب
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2} amount={0.1} className="w-full flex flex-col items-center">
        <PublicCoursesList courses={courses} />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.4} className="w-full flex flex-col items-center">
        <Button variant="primary" className="mobile-lg:mt-10 self-start">
          تصفح الدورات
        </Button>
      </ScrollReveal>
    </section>
  );
}
