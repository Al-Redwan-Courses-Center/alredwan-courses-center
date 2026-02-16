import { toHindiDigits } from "@/lib/utils";

interface Instructor {
  user: {
    first_name: string;
    last_name: string;
  };
}

interface CourseDetailsGridProps {
  instructor?: Instructor;
  numLectures: number;
  startDate: string;
  endDate?: string;
}

export default function CourseDetailsGrid({
  instructor,
  numLectures,
  startDate,
  endDate,
}: CourseDetailsGridProps) {
  return (
    <div className="mb-8 grid grid-cols-4 gap-6 px-12 sm:mb-5 sm:grid-cols-1 sm:gap-4 sm:px-6 md:mb-6 md:grid-cols-2 md:gap-5 md:px-8">
      {/* Instructor */}
      {instructor && (
        <div className="bg-olive-50 rounded-xl p-6 sm:p-4 md:p-5">
          <p className="text-olive-600 mb-2 text-xl font-bold sm:text-base md:text-lg">
            المدرس
          </p>
          <p className="text-olive-700 text-2xl sm:text-lg md:text-xl">
            {instructor.user.first_name} {instructor.user.last_name}
          </p>
        </div>
      )}

      {/* Lectures Count */}
      <div className="rounded-xl bg-blue-50 p-6 sm:p-4 md:p-5">
        <p className="mb-2 text-xl font-bold text-blue-600 sm:text-base md:text-lg">
          عدد المحاضرات
        </p>
        <p className="font-medad text-3xl text-blue-700 sm:text-xl md:text-2xl">
          {toHindiDigits(numLectures || 0)} محاضرة
        </p>
      </div>

      {/* Start Date */}
      <div className="rounded-xl bg-green-50 p-6 sm:p-4 md:p-5">
        <p className="mb-2 text-xl font-bold text-green-600 sm:text-base md:text-lg">
          تاريخ البداية
        </p>
        <p className="text-2xl text-green-700 sm:text-lg md:text-xl">
          {toHindiDigits(startDate).replaceAll("-", "/")}
        </p>
      </div>

      {/* End Date */}
      {endDate && (
        <div className="rounded-xl bg-amber-50 p-6 sm:p-4 md:p-5">
          <p className="mb-2 text-xl font-bold text-amber-600 sm:text-base md:text-lg">
            تاريخ النهاية
          </p>
          <p className="text-2xl text-amber-700 sm:text-lg md:text-xl">
            {toHindiDigits(endDate).replaceAll("-", "/")}
          </p>
        </div>
      )}
    </div>
  );
}
