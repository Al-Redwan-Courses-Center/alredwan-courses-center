import { toHindiDigits } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressSectionProps {
  progressPercentage?: number;
  attendanceRate?: number;
}

export default function ProgressSection({
  progressPercentage,
  attendanceRate,
}: ProgressSectionProps) {
  return (
    <div className="tablet:mb-6 tablet:gap-5 tablet:px-8 mobile:mb-5 mobile:grid-cols-1 mobile:gap-4 mobile:px-6 mb-8 grid grid-cols-2 gap-6 px-12">
      {/* Progress Bar */}
      <div className="tablet:p-5 mobile:p-4 rounded-xl bg-gray-50 p-6">
        <div className="tablet:mb-3 mobile:mb-2 mb-4 flex justify-between">
          <p className="tablet:text-xl mobile:text-lg text-2xl font-bold text-gray-700">
            التقدم في الدورة
          </p>
          <p className="font-medad text-olive-600 tablet:text-2xl mobile:text-xl text-3xl font-bold">
            {toHindiDigits(progressPercentage?.toFixed(0) ?? "0")}٪
          </p>
        </div>

        <Progress
          value={progressPercentage}
          max={100}
          className="mobile:h-2 tablet:h-3 h-4"
        />
      </div>

      {/* Attendance Rate */}
      <div className="tablet:p-5 mobile:p-4 rounded-xl bg-gray-50 p-6">
        <div className="tablet:mb-3 mobile:mb-2 mb-4 flex justify-between">
          <p className="tablet:text-xl mobile:text-lg text-2xl font-bold text-gray-700">
            نسبة الحضور
          </p>
          <p className="font-medad tablet:text-2xl mobile:text-xl text-3xl font-bold text-green-600">
            {toHindiDigits(attendanceRate?.toFixed(0) ?? "0")}٪
          </p>
        </div>

        <Progress
          value={attendanceRate}
          max={100}
          className="mobile:h-2 tablet:h-3 h-4"
        />
      </div>
    </div>
  );
}
