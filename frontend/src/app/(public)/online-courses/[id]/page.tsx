import { ArrowRight, Book, Clock, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicOnlineCourseById } from "@/actions/online-courses";
import CourseImage from "@/assets/course-img.jpg";
import RatingsSection from "@/components/ratings/RatingsSection";
import Button from "@/components/ui/Button";
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE,
  CONTACT_WHATSAPP_HREF,
} from "@/lib/contact";
import { formatDuration, getArabicPlural, toHindiDigits } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getPublicOnlineCourseById(id);

  if (!course) {
    return { title: "الدورة غير موجودة | واحة الرضوان" };
  }

  return {
    title: `${course.name} | واحة الرضوان`,
    description: course.description?.slice(0, 160) || undefined,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const course = await getPublicOnlineCourseById(id);

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">الدورة غير موجودة</h1>
          <Button href="/courses?type=online">العودة للدورات</Button>
        </div>
      </div>
    );
  }

  const lectureCount = course.video_count || 0;

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden lg:h-[60vh]">
        <Image
          src={course.thumbnail || CourseImage}
          alt={course.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 text-white lg:p-20">
          <div className="container mx-auto">
            <h1 className="mb-6 text-5xl font-black lg:text-7xl">
              {course.name}
            </h1>
            <div className="flex flex-wrap gap-8 text-lg font-medium opacity-90">
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
              <p className="text-xl leading-relaxed break-words whitespace-pre-wrap text-gray-600">
                {course.description}
              </p>
            </div>

            {course.instructor && (
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
                  </div>
                  <ArrowRight className="group-hover:text-olive-500 h-6 w-6 text-gray-300 transition-all group-hover:translate-x-[-8px]" />
                </Link>
              </div>
            )}

            <RatingsSection type="online_course" id={id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8 lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50">
              <div className="space-y-6">
                <div>
                  <p className="mb-1 text-gray-500">رسوم الاشتراك</p>
                  <p className="text-olive-500 text-5xl font-black">
                    {toHindiDigits(Number(course.price))} جنيه
                  </p>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 opacity-40" />
                      <span>إجمالي الساعات</span>
                    </div>
                    <span className="font-bold">
                      {formatDuration(course.total_duration_seconds)}
                    </span>
                  </div>
                </div>

                <Button
                  href="/?login=true"
                  className="shadow-olive-500/20 h-14 w-full rounded-2xl text-lg font-bold shadow-lg"
                >
                  سجل الآن في الدورة
                </Button>

                <p className="text-center text-sm text-gray-400">
                  الدفع متاح عبر فوري، المحافظ الإلكترونية، أو في المركز
                </p>
              </div>
            </div>

            {/* الاستفسارات */}
            <div className="rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50">
              <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold">
                <div className="bg-olive-500 h-6 w-2 rounded-full" />
                الاستفسارات
              </h3>
              <div className="space-y-4">
                <a
                  href={CONTACT_WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:border-olive-500/10 hover:bg-olive-500/5 flex items-center gap-4 rounded-2xl border border-transparent p-4 transition-colors"
                >
                  <div className="bg-olive-500/10 text-olive-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">واتساب</p>
                    <p className="font-bold text-gray-900" dir="ltr">
                      {CONTACT_PHONE}
                    </p>
                  </div>
                </a>
                <a
                  href={CONTACT_EMAIL_HREF}
                  className="hover:border-olive-500/10 hover:bg-olive-500/5 flex items-center gap-4 rounded-2xl border border-transparent p-4 transition-colors"
                >
                  <div className="bg-olive-500/10 text-olive-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">
                      البريد الإلكتروني
                    </p>
                    <p className="font-bold text-gray-900">{CONTACT_EMAIL}</p>
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
