import { getLandingPageCourses } from "@/actions/landing";
import PublicCoursesList from "@/components/courses/PublicCoursesList";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Users, MonitorPlay } from "lucide-react";

export default async function CoursesSection() {
  const courses = (await getLandingPageCourses()).sort(
    (a, b) => a.order - b.order,
  );

  return (
    <section
      id="courses"
      className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_0%,#F3F6F4_100%)] pb-24"
    >
      <ScrollReveal
        direction="up"
        className="flex w-full flex-col items-center"
      >
        <div className="title-block">
          <h2>
            الدورات <span>المميزة</span>
          </h2>

          <p>
            مجموعة من الدورات التدريبية المميزة التي تساعدك على تطوير مهاراتك
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal
        direction="up"
        delay={0.2}
        amount={0.1}
        className="flex w-full flex-col items-center"
      >
        <PublicCoursesList courses={courses} />
      </ScrollReveal>

      <ScrollReveal
        direction="up"
        delay={0.4}
        className="tablet:flex-col mx-auto mt-16 flex w-full max-w-6xl flex-row justify-center gap-8 px-6"
      >
        {/* Physical Courses */}
        <div className="shadow-soft border-olive-100 hover:shadow-primary flex flex-1 flex-col items-center rounded-[2.5rem] border bg-white p-10 transition-all duration-300 hover:-translate-y-2">
          <div className="bg-olive-100/50 mb-6 rounded-full p-5">
            <Users size={40} className="text-olive-700" />
          </div>
          <h3 className="text-olive-700 font-medad mb-4 text-4xl font-bold">
            الدورات الحضورية
          </h3>
          <p className="mb-10 flex-grow text-center text-2xl leading-relaxed text-gray-500">
            تفاعل مباشر مع المعلمين في بيئة تعليمية محفزة، مع تطبيق عملي وتنمية
            للمهارات الاجتماعية والتفاعلية.
          </p>
          <Button
            variant="primary"
            href="/courses?type=physical"
            className="flex w-full items-center justify-center rounded-2xl py-5 text-2xl"
          >
            تصفح الدورات الحضورية
          </Button>
        </div>

        {/* Online Courses */}
        <div className="shadow-soft border-beige-500/30 hover:shadow-primary flex flex-1 flex-col items-center rounded-[2.5rem] border bg-white p-10 transition-all duration-300 hover:-translate-y-2">
          <div className="bg-beige-500/20 mb-6 rounded-full p-5">
            <MonitorPlay size={40} className="text-beige-500" />
          </div>
          <h3 className="text-beige-500 font-medad mb-4 text-4xl font-bold">
            الدورات الإلكترونية
          </h3>
          <p className="mb-10 flex-grow text-center text-2xl leading-relaxed text-gray-500">
            تعلم مرن في أي وقت وأي مكان، مع وصول دائم للمحتوى التعليمي وتوفير
            للوقت والجهد للطلاب وأولياء الأمور.
          </p>
          <Button
            variant="secondary"
            href="/courses?type=online"
            className="flex w-full items-center justify-center rounded-2xl py-5 text-2xl"
          >
            تصفح الدورات الإلكترونية
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
