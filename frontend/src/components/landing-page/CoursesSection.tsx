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
    <section id="courses" className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_0%,#F3F6F4_100%)] pb-24">
      <ScrollReveal direction="up" className="w-full flex flex-col items-center">        <div className="title-block">
          <h2>
            الدورات <span>المميزة</span>
          </h2>

          <p className="mb-36 text-center text-4xl text-gray-600">
            اكتشف أفضل الدورات التعليمية المصممة خصيصاً لتطوير مهارات الأطفال
            والشباب
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal
        direction="up"
        delay={0.2}
        amount={0.1}
        className="w-full flex flex-col items-center"
      >
        <PublicCoursesList courses={courses} />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.4} className="w-full max-w-6xl mx-auto px-6 mt-16 flex flex-col tablet:flex-row gap-8 justify-center">
        {/* Physical Courses */}
        <div className="flex-1 flex flex-col items-center bg-white p-10 rounded-[2.5rem] shadow-soft border border-olive-100 hover:shadow-primary hover:-translate-y-2 transition-all duration-300">
          <div className="bg-olive-100/50 p-5 rounded-full mb-6">
            <Users size={40} className="text-olive-700" />
          </div>
          <h3 className="text-4xl font-bold text-olive-700 mb-4 font-medad">الدورات الحضورية</h3>
          <p className="text-gray-500 text-center mb-10 text-2xl leading-relaxed flex-grow">
            تفاعل مباشر مع المعلمين في بيئة تعليمية محفزة، مع تطبيق عملي وتنمية للمهارات الاجتماعية والتفاعلية.
          </p>
          <Button variant="primary" href="/courses?type=physical" className="w-full flex items-center justify-center text-2xl py-5 rounded-2xl">
            تصفح الدورات الحضورية
          </Button>
        </div>

        {/* Online Courses */}
        <div className="flex-1 flex flex-col items-center bg-white p-10 rounded-[2.5rem] shadow-soft border border-beige-500/30 hover:shadow-primary hover:-translate-y-2 transition-all duration-300">
          <div className="bg-beige-500/20 p-5 rounded-full mb-6">
            <MonitorPlay size={40} className="text-beige-500" />
          </div>
          <h3 className="text-4xl font-bold text-beige-500 mb-4 font-medad">الدورات الإلكترونية</h3>
          <p className="text-gray-500 text-center mb-10 text-2xl leading-relaxed flex-grow">
            تعلم مرن في أي وقت وأي مكان، مع وصول دائم للمحتوى التعليمي وتوفير للوقت والجهد للطلاب وأولياء الأمور.
          </p>
          <Button variant="secondary" href="/courses?type=online" className="w-full flex items-center justify-center text-2xl py-5 rounded-2xl">
            تصفح الدورات الإلكترونية
          </Button>
        </div>      </ScrollReveal>
    </section>
  );
}
