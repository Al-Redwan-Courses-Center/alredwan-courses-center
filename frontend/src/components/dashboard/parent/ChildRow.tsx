import { ParentChildDetail } from "@/actions/user";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import { getChildEnrollmentRequests } from "@/dev-data/db";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import { toHindiDigits } from "@/lib/utils";
// import AcademicLevelChart from "@/components/dashboard/parent/AcademicLevelChart";
import { Pencil } from "lucide-react";
import DeleteChildButton from "@/components/dashboard/parent/DeleteChildButton";

export default function ChildRow({
  child,
  index,
  onEdit,
}: {
  child: ParentChildDetail;
  index: number;
  onEdit?: (child: ParentChildDetail) => void;
}) {
  // TODO(api): Enrollment requests do not include child identifiers yet.
  // Keep mock child-scoped requests until the API exposes child_id.
  const enrollments = getChildEnrollmentRequests(child.id).sort(
    (a, b) =>
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ] -
      ENROLLMENT_REQUEST_STATUS_WEIGHTS[
        b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
      ],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1.1fr)_minmax(0,1.5fr)] gap-8 border-b border-olive-100/50 pb-10 lg:pb-0 lg:border-none">
      <div className="flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4">
        <span className="text-olive-500 text-[2.4rem] font-bold">
          {`( ${toHindiDigits(index + 1)} ) ${child.first_name}`}
        </span>
        <div className="flex items-center gap-4 px-2 lg:px-4">
          <button
            onClick={() => onEdit?.(child)}
            className="text-olive-600 hover:text-olive-800 transition-colors p-2 cursor-pointer"
            title="تعديل"
          >
            <Pencil size={24} />
          </button>
          <DeleteChildButton childId={child.id} childName={child.first_name} />
        </div>
      </div>
      <div>
        <ChildCard child={child} index={index} />
      </div>
      <div className="relative min-h-[32rem] lg:min-h-0">
        <EnrollmentRequestsList
          enrollments={enrollments}
          listStyles="lg:absolute lg:inset-0 lg:mt-20 flex flex-col gap-4 max-h-[30rem] lg:max-h-none overflow-y-auto"
          wrapperStyles="*:px-7!"
        />
      </div>
    </div>
  );
}
