import { getPublicOnlineCourses } from "@/actions/landing";
import OnlineCourseCard from "@/components/dashboard/online-courses/OnlineCourseCard";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default async function OnlineCoursesSection() {
  const courses = await getPublicOnlineCourses();

  // Only show section if there are online courses
  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section id="online-courses" className="flex flex-col items-center bg-white border-t border-gray-100">
      <ScrollReveal direction="up" className="w-full flex flex-col items-center">
        <div className="title-block">
          <h2>
            الدورات <span>الإلكترونية</span>
          </h2>

          <p className="mb-24 text-center text-4xl text-gray-600">
            تعلم عن بعد وفي أي وقت من خلال منصتنا التعليمية المتكاملة
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.2} amount={0.1} className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
          {courses.slice(0, 3).map((course) => (
            <OnlineCourseCard key={course.id} course={course} />
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.4} className="w-full flex flex-col items-center">
        <Button variant="primary" href="/courses" className="mobile-lg:mt-10 self-center">
          تصفح المنصة الإلكترونية
        </Button>
      </ScrollReveal>
    </section>
  );
}
