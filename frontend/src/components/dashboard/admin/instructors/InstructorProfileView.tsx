import Avatar from "@/components/ui/Avatar";
import { toHindiDigits } from "@/lib/utils";
import { InstructorDetail } from "@/types/entities/instructors";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";

interface InstructorProfileViewProps {
  instructor: InstructorDetail;
}

export default function InstructorProfileView({
  instructor,
}: InstructorProfileViewProps) {
  const formattedJoinDate = instructor.joined_date
    ? format(new Date(instructor.joined_date), "dd MMMM yyyy", { locale: ar })
    : "غير متوفر";

  return (
    <div className="flex flex-col gap-24 rounded-3xl border border-white/20 bg-white/40 p-24 shadow-sm backdrop-blur-md max-[1000px]:flex-col max-[1000px]:gap-16 max-[1000px]:p-12 md:flex-row">
      {/* Profile Image & Essential Info */}
      <div className="flex shrink-0 flex-col items-center gap-16">
        <Avatar
          src={instructor.image_url}
          alt={instructor.name}
          className="border-olive-100 h-44 w-44 border-4 shadow-md"
        />
        <div className="text-center">
          <h2 className="font-medad text-olive-700 text-3xl">
            {instructor.name}
          </h2>
          <span className="text-olive-300 text-lg font-medium">
            {instructor.type_display}
          </span>
        </div>
      </div>

      {/* Detailed Info */}
      <div className="flex flex-1 flex-col gap-20">
        <div className="grid grid-cols-1 gap-16 max-[1000px]:grid-cols-1 max-[1000px]:gap-12 md:grid-cols-2">
          <InfoItem
            label="رقم الهاتف"
            value={toHindiDigits(instructor.phone || "")}
          />
          <InfoItem
            label="البريد الإلكتروني"
            value={instructor.email || "غير متوفر"}
          />
          <InfoItem
            label="تاريخ الانضمام"
            value={toHindiDigits(formattedJoinDate)}
          />
          <InfoItem
            label="عدد التقييمات"
            value={toHindiDigits((instructor.rating_count || 0).toString())}
          />
        </div>

        <div className="border-olive-100/50 border-t pt-16">
          <h4 className="text-olive-600 mb-8 text-xl font-bold">
            النبذة الشخصية
          </h4>
          <p className="text-lg leading-relaxed text-gray-700">
            {instructor.bio || "لا توجد نبذة شخصية متاحة حالياً لهذا المعلم."}
          </p>
        </div>

        <div className="border-olive-100/50 mt-16 flex flex-wrap items-center justify-between gap-16 border-t pt-16">
          <div className="flex flex-wrap gap-8">
            {instructor.tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-olive-50 text-olive-700 border-olive-100 rounded-full border px-12 py-4 text-sm font-medium"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <Link
            href={`/dashboard/todays-staff-attendances?instructor=${instructor.id}`}
            className="bg-olive-600 hover:bg-olive-700 inline-flex w-full items-center justify-center gap-8 rounded-xl px-20 py-10 font-bold text-white shadow-sm transition-colors max-[1000px]:w-full md:w-auto"
          >
            عرض سجل الحضور الكامل
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-lg font-medium text-gray-800">{value}</span>
    </div>
  );
}
