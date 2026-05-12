import { getCourseById } from "@/actions/courses";
import RatingsSection from "@/components/ratings/RatingsSection";
import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import { Badge } from "lucide-react"; // Actually I'll use custom div
import { Calendar, Book, Users, Clock, Tag as TagIcon, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">الدورة غير موجودة</h1>
          <Button href="/courses">العودة للدورات</Button>
        </div>
      </div>
    );
  }

  const lectureCount = course.num_lectures;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] lg:h-[60vh] overflow-hidden">
        <Image
          src={course.image || CourseImage}
          alt={course.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 lg:p-20 text-white">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 mb-6">
              {course.tags.map((tag) => (
                <span key={tag.id} className="bg-white/20 backdrop-blur-md text-white px-4 py-1 rounded-full text-sm font-bold">
                  {tag.name}
                </span>
              ))}
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6">{course.name}</h1>
            <div className="flex flex-wrap gap-8 text-lg font-medium opacity-90">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-olive-500" />
                    <span>تبدأ {formatDate(parseISO(course.start_date))}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-olive-500" />
                    <span>{toHindiDigits(lectureCount)} {getArabicPlural(lectureCount, { singular: "محاضرة", twofer: "محاضرتان", plural: "محاضرات" })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-olive-500" />
                    <span>{toHindiDigits(course.available_spots)} مكان متاح</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-20 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <div className="w-2 h-8 bg-olive-500 rounded-full" />
                عن هذه الدورة
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <div className="w-2 h-8 bg-olive-500 rounded-full" />
                    المعلم
                </h2>
                <Link href={`/instructors/${course.instructor.id}`} className="group flex items-center gap-6 p-6 bg-gray-50 rounded-3xl hover:bg-olive-500/5 transition-colors">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md">
                        <Image src={course.instructor.image_url || CourseImage} alt={course.instructor.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-2xl font-bold group-hover:text-olive-500 transition-colors">{course.instructor.name}</h4>
                        <p className="text-gray-500">خبير في التعليم والتدريب</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-gray-300 group-hover:text-olive-500 transition-all group-hover:translate-x-[-8px]" />
                </Link>
            </div>

            <RatingsSection type="course" id={id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 sticky top-24 shadow-xl shadow-gray-100/50">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-500 mb-1">رسوم الاشتراك</p>
                  <p className="text-5xl font-black text-olive-500">{toHindiDigits(course.price)} جنيه</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-gray-600">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 opacity-40" />
                            <span>مدة المحاضرة</span>
                        </div>
                        <span className="font-bold">ساعتان</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 opacity-40" />
                            <span>السعة القصوى</span>
                        </div>
                        <span className="font-bold">{toHindiDigits(course.capacity)} طلاب</span>
                    </div>
                </div>

                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-olive-500/20">
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
