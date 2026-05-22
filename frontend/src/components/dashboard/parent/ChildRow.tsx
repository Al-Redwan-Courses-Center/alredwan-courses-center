"use client";

import { useEffect, useState } from "react";
import { ParentChildDetail, getChildEnrollmentRequests } from "@/actions/user";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";


export default function ChildRow({
  child,
  index,
  onEdit,
}: {
  child: ParentChildDetail;
  index: number;
  onEdit?: (child: ParentChildDetail) => void;
}) {
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    getChildEnrollmentRequests(child.id).then((data) => {
      if (!active) return;
      const sorted = data.sort(
        (a, b) =>
          ENROLLMENT_REQUEST_STATUS_WEIGHTS[
            a.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
          ] -
          ENROLLMENT_REQUEST_STATUS_WEIGHTS[
            b.status as keyof typeof ENROLLMENT_REQUEST_STATUS_WEIGHTS
          ],
      );
      setEnrollments(sorted);
    });
    return () => {
      active = false;
    };
  }, [child.id]);

  return (
    <div className="grid grid-cols-[1.2fr_1.8fr] gap-12 border-none pb-0 items-stretch tablet:grid-cols-1 tablet:border-b tablet:border-olive-100/50 tablet:pb-10">
      <div>
        <ChildCard child={child} index={index} onEdit={onEdit} />
      </div>
      <div className="relative min-h-0 tablet:min-h-[32rem]">
        <EnrollmentRequestsList
          enrollments={enrollments}
          listStyles="absolute inset-0 mt-20 flex flex-col gap-4 max-h-none overflow-y-auto tablet:relative tablet:inset-auto tablet:mt-0 tablet:max-h-[30rem]"
          wrapperStyles="*:px-7!"
        />
      </div>
    </div>
  );
}
