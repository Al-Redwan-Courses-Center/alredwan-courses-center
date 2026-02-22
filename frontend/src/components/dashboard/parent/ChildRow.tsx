import { ParentChildDetail } from "@/actions/user";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import { getChildEnrollmentRequests } from "@/dev-data/db";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import { toHindiDigits } from "@/lib/utils";

export default function ChildRow({
  child,
  index,
}: {
  child: ParentChildDetail;
  index: number;
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
    <div className="grid grid-cols-[15rem_auto_1.5fr_1fr] gap-x-10">
      <span className="text-olive-500 text-[2.4rem] font-bold">
        {`( ${toHindiDigits(index + 1)} ) ${child.first_name}`}
      </span>
      <div>
        <ChildCard child={child} index={index} />
      </div>
      <div className="relative">
        <EnrollmentRequestsList
          enrollments={enrollments}
          listStyles="absolute inset-0 mt-20"
          wrapperStyles="*:px-7!"
        />
      </div>
      <div></div>
    </div>
  );
}
