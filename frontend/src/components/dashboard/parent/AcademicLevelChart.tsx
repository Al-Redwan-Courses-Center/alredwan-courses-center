import { cn } from "@/lib/utils";

export default function AcademicLevelChart({
  childName,
  className,
}: {
  childName: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col ps-6", className)}>
      <h4 className="mb-6 text-center text-4xl font-bold text-gray-500">
        مستوى {childName} الدراسي
      </h4>
      <div className="shadow-soft relative flex flex-col items-center rounded-3xl bg-white p-6">
        <svg
          viewBox="0 0 400 200"
          className="h-auto w-full text-gray-300"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line
            x1="40"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="60"
            x2="380"
            y2="60"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="100"
            x2="380"
            y2="100"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="140"
            x2="380"
            y2="140"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="180"
            x2="380"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />

          {/* Vertical grid lines */}
          <line
            x1="40"
            y1="20"
            x2="40"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="96"
            y1="20"
            x2="96"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="152"
            y1="20"
            x2="152"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="208"
            y1="20"
            x2="208"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="264"
            y1="20"
            x2="264"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="320"
            y1="20"
            x2="320"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1="376"
            y1="20"
            x2="376"
            y2="180"
            stroke="currentColor"
            strokeWidth="1"
          />

          {/* Line 1 (Grades - Light Olive) */}
          <polyline
            points="40,150 96,110 152,130 208,120 264,80 320,110 376,60"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <circle cx="40" cy="150" r="3" fill="#9ca3af" />
          <circle cx="96" cy="110" r="3" fill="#9ca3af" />
          <circle cx="152" cy="130" r="3" fill="#9ca3af" />
          <circle cx="208" cy="120" r="3" fill="#9ca3af" />
          <circle cx="264" cy="80" r="3" fill="#9ca3af" />
          <circle cx="320" cy="110" r="3" fill="#9ca3af" />
          <circle cx="376" cy="60" r="3" fill="#9ca3af" />

          {/* Line 2 (Attendance - Dark Olive) */}
          <polyline
            points="40,180 96,40 152,90 208,110 264,130 320,150 376,80"
            fill="none"
            stroke="#2c3e35"
            strokeWidth="2"
          />
          <circle cx="40" cy="180" r="3" fill="#2c3e35" />
          <circle cx="96" cy="40" r="3" fill="#2c3e35" />
          <circle cx="152" cy="90" r="3" fill="#2c3e35" />
          <circle cx="208" cy="110" r="3" fill="#2c3e35" />
          <circle cx="264" cy="130" r="3" fill="#2c3e35" />
          <circle cx="320" cy="150" r="3" fill="#2c3e35" />
          <circle cx="376" cy="80" r="3" fill="#2c3e35" />
        </svg>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-10 text-xl font-bold text-gray-500">
          <div className="flex items-center gap-3">
            <span>الدرجات</span>
            <span className="h-5 w-10 rounded-sm bg-gray-400"></span>
          </div>
          <div className="flex items-center gap-3">
            <span>الحضور</span>
            <span className="h-5 w-10 rounded-sm bg-[#2c3e35]"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
