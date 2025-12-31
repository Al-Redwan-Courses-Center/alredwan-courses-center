import CoursesList from "@/components/courses/CoursesList";
import Button from "@/components/ui/Button";

export default function CoursesSection() {
  return (
    <section className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_0%,#F3F6F4_100%)]">
      <div className="title-block">
        <h2>
          الدورات <span>المميزة</span>
        </h2>

        <p className="mb-36 text-center text-4xl text-gray-500">
          اكتشف أفضل الدورات التعليمية المصممة خصيصاً لتطوير مهارات الأطفال
          والشباب
        </p>
      </div>

      <CoursesList />

      <Button variant="primary" href="/courses" className="self-start">
        تصفح الدورات
      </Button>
    </section>
  );
}
