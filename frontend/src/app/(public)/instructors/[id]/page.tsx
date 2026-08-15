import { format } from "date-fns";
import { Award, Calendar, Star, Users } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getInstructorById } from "@/actions/user";
import InstructorProfile from "@/assets/instructor-profile.png";
import RatingsSection from "@/components/ratings/RatingsSection";

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const instructor = await getInstructorById(id);

  if (!instructor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Hero Section */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Instructor Image */}
            <div className="flex justify-center lg:col-span-4">
              <div className="ring-olive-500/5 relative h-64 w-64 overflow-hidden rounded-[4rem_0] shadow-2xl ring-8 lg:h-80 lg:w-80">
                <Image
                  src={instructor.image_url || InstructorProfile}
                  alt={instructor.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Instructor Info */}
            <div className="space-y-6 text-center lg:col-span-8 lg:text-right">
              <div className="space-y-2">
                <div className="mb-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {instructor.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="bg-olive-500/10 text-olive-500 rounded-full px-4 py-1 text-sm font-bold"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <h1 className="text-5xl font-black tracking-tight text-gray-900 lg:text-6xl">
                  {instructor.name}
                </h1>
                <p className="text-olive-500 text-2xl font-bold">
                  {instructor.type_display}
                </p>
              </div>

              <p className="max-w-3xl text-xl leading-relaxed text-gray-600">
                {instructor.bio || "لا يوجد وصف متاح حالياً لهذا المعلم."}
              </p>

              <div className="grid grid-cols-2 gap-6 pt-6 md:grid-cols-4">
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-gray-50 p-4 lg:items-start">
                  <div className="text-olive-500 flex items-center gap-2 font-bold">
                    <Star className="fill-olive-500 h-5 w-5" />
                    <span className="text-2xl">
                      {instructor.average_rating || "0.0"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">التقييم العام</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-gray-50 p-4 lg:items-start">
                  <div className="flex items-center gap-2 font-bold text-blue-600">
                    <Users className="h-5 w-5" />
                    <span className="text-2xl">{instructor.rating_count}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    إجمالي المراجعات
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-gray-50 p-4 lg:items-start">
                  <div className="flex items-center gap-2 font-bold text-purple-600">
                    <Calendar className="h-5 w-5" />
                    <span className="text-2xl">
                      {format(new Date(instructor.joined_date), "yyyy")}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">سنة الانضمام</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-gray-50 p-4 lg:items-start">
                  <div className="flex items-center gap-2 font-bold text-green-600">
                    <Award className="h-5 w-5" />
                    <span className="text-2xl">خبير</span>
                  </div>
                  <span className="text-xs text-gray-400">المستوى</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Section */}
      <div className="container mx-auto mt-12 px-6">
        <RatingsSection type="instructor" id={id} />
      </div>
    </div>
  );
}
