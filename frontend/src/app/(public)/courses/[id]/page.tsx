import { getCourseById } from "@/actions/courses";
import RatingsSection from "@/components/ratings/RatingsSection";
import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import { Badge } from "lucide-react"; // Actually I'll use custom div
import {
  Calendar,
  Book,
  Users,
  Clock,
  Tag as TagIcon,
  ArrowRight,
} from "lucide-react";
import { formatDate, toHindiDigits, getArabicPlural } from "@/lib/utils";
import { parseISO } from "date-fns";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">الدورة غير موجودة</h1>
          <Button href="/courses">العودة للدورات</Button>
        </div>
      </div>
    );
  }

  const lectureCount = course.num_lectures;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden lg:h-[60vh]">
        <Image
          src={course.image || CourseImage}
          alt={course.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 text-white lg:p-20">
          <div className="container mx-auto">
            <div className="mb-6 flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-white/20 px-4 py-1 text-sm font-bold text-white backdrop-blur-md"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <h1 className="mb-6 text-5xl font-black lg:text-7xl">
              {course.name}
            </h1>
            <div className="flex flex-wrap gap-8 text-lg font-medium opacity-90">
              <div className="flex items-center gap-2">
                <Calendar className="text-olive-500 h-5 w-5" />
                <span>تبدأ {formatDate(parseISO(course.start_date))}</span>
              </div>
              <div className="flex items-center gap-2">
                <Book className="text-olive-500 h-5 w-5" />
                <span>
                  {toHindiDigits(lectureCount)}{" "}
                  {getArabicPlural(lectureCount, {
                    singular: "محاضرة",
                    twofer: "محاضرتان",
                    plural: "محاضرات",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-olive-500 h-5 w-5" />
                <span>{toHindiDigits(course.available_spots)} مكان متاح</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 lg:px-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Main Content */}
          <div className="space-y-12 lg:col-span-8">
            <div className="space-y-6">
              <h2 className="flex items-center gap-3 text-3xl font-bold">
                <div className="bg-olive-500 h-8 w-2 rounded-full" />
                عن هذه الدورة
              </h2>
              <p className="text-xl leading-relaxed text-gray-600">
                {course.description}
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="flex items-center gap-3 text-3xl font-bold">
                <div className="bg-olive-500 h-8 w-2 rounded-full" />
                المعلم
              </h2>
              <Link
                href={`/instructors/${course.instructor.id}`}
                className="group hover:bg-olive-500/5 flex items-center gap-6 rounded-3xl bg-gray-50 p-6 transition-colors"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-md ring-4 ring-white">
                  <Image
                    src={course.instructor.image_url || CourseImage}
                    alt={course.instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="group-hover:text-olive-500 text-2xl font-bold transition-colors">
                    {course.instructor.name}
                  </h4>
                  <p className="text-gray-500">خبير في التعليم والتدريب</p>
                </div>
                <ArrowRight className="group-hover:text-olive-500 h-6 w-6 text-gray-300 transition-all group-hover:translate-x-[-8px]" />
              </Link>
            </div>

            <RatingsSection type="course" id={id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8 lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50">
              <div className="space-y-6">
                <div>
                  <p className="mb-1 text-gray-500">رسوم الاشتراك</p>
                  <p className="text-olive-500 text-5xl font-black">
                    {toHindiDigits(course.price)} جنيه
                  </p>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 opacity-40" />
                      <span>مدة المحاضرة</span>
                    </div>
                    <span className="font-bold">ساعتان</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 opacity-40" />
                      <span>السعة القصوى</span>
                    </div>
                    <span className="font-bold">
                      {toHindiDigits(course.capacity)} طلاب
                    </span>
                  </div>
                </div>

                <Button className="shadow-olive-500/20 h-14 w-full rounded-2xl text-lg font-bold shadow-lg">
                  سجل الآن في الدورة
                </Button>

                <p className="text-center text-sm text-gray-400">
                  الدفع متاح عبر فوري، المحافظ الإلكترونية، أو في المركز
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
