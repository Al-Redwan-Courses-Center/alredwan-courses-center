import { getPublicOnlineCourseById } from "@/actions/online-courses";
import RatingsSection from "@/components/ratings/RatingsSection";
import Image from "next/image";
import CourseImage from "@/assets/course-img.jpg";
import { Book, Clock, ArrowRight, Phone, Mail } from "lucide-react";
import { toHindiDigits, getArabicPlural } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getPublicOnlineCourseById(id);

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

  const lectureCount = course.video_count || 0;


  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] lg:h-[60vh] overflow-hidden">
        <Image
          src={course.thumbnail || CourseImage}
          alt={course.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 lg:p-20 text-white">
          <div className="container mx-auto">
            <h1 className="text-5xl lg:text-7xl font-black mb-6">{course.name}</h1>
            <div className="flex flex-wrap gap-8 text-lg font-medium opacity-90">
                <div className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-olive-500" />
                    <span>{toHindiDigits(lectureCount)} {getArabicPlural(lectureCount, { singular: "محاضرة", twofer: "محاضرتان", plural: "محاضرات" })}</span>
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
              <p className="text-xl text-gray-600 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            </div>

            {course.instructor && (
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
            )}

            <RatingsSection type="online_course" id={id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 sticky top-24 shadow-xl shadow-gray-100/50">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-500 mb-1">رسوم الاشتراك</p>
                  <p className="text-5xl font-black text-olive-500">{toHindiDigits(Number(course.price))} جنيه</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-gray-600">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 opacity-40" />
                            <span>إجمالي الساعات</span>
                        </div>
                        <span className="font-bold">
                            {Math.floor(course.total_duration_seconds / 3600) > 0 ? `${toHindiDigits(Math.floor(course.total_duration_seconds / 3600))} ساعة ` : ""}
                            {Math.floor((course.total_duration_seconds % 3600) / 60) > 0 ? `${toHindiDigits(Math.floor((course.total_duration_seconds % 3600) / 60))} دقيقة` : ""}
                            {course.total_duration_seconds < 60 ? "أقل من دقيقة" : ""}
                        </span>
                    </div>
                </div>

                <Button href="/?login=true" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-olive-500/20">
                  سجل الآن في الدورة
                </Button>
                
                <p className="text-center text-sm text-gray-400">
                    الدفع متاح عبر فوري، المحافظ الإلكترونية، أو في المركز
                </p>
              </div>
            </div>

            {/* الاستفسارات */}
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 sticky top-[400px] shadow-xl shadow-gray-100/50">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-olive-500 rounded-full" />
                الاستفسارات
              </h3>
              <div className="space-y-4">
                <a href="https://wa.me/201234567890" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-olive-500/5 transition-colors border border-transparent hover:border-olive-500/10">
                  <div className="w-12 h-12 bg-olive-500/10 rounded-xl flex items-center justify-center text-olive-500 shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">واتساب</p>
                    <p className="font-bold text-gray-900" dir="ltr">+20 123 456 7890</p>
                  </div>
                </a>
                <a href="mailto:info@alredwan.com" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-olive-500/5 transition-colors border border-transparent hover:border-olive-500/10">
                  <div className="w-12 h-12 bg-olive-500/10 rounded-xl flex items-center justify-center text-olive-500 shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
                    <p className="font-bold text-gray-900">info@alredwan.com</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

}
