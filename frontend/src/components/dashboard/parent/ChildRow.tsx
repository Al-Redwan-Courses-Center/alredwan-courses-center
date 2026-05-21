"use client";

import { useEffect, useState } from "react";
import { ParentChildDetail, getChildEnrollmentRequests } from "@/actions/user";
import EnrollmentRequestsList from "@/components/dashboard/enrollments/EnrollmentRequestsList";
import ChildCard from "@/components/dashboard/parent/ChildCard";
import { ENROLLMENT_REQUEST_STATUS_WEIGHTS } from "@/lib/config";
import { toHindiDigits } from "@/lib/utils";
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
    <div className="grid grid-cols-[14rem_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.5fr)] gap-8 border-none pb-0 tablet:grid-cols-1 tablet:border-b tablet:border-olive-100/50 tablet:pb-10">
      <div className="flex flex-col items-start justify-start gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <span
          className="text-olive-500 text-[2.4rem] font-bold truncate block max-w-full"
          title={`( ${toHindiDigits(index + 1)} ) ${child.first_name}`}
        >
          {`( ${toHindiDigits(index + 1)} ) ${child.first_name}`}
        </span>
        <div className="flex items-center gap-4 px-4 tablet:px-2">
          <button
            onClick={() => onEdit?.(child)}
            className="text-olive-700 hover:text-olive-900 transition-colors p-2 cursor-pointer"
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
      {/* Space reserved for AcademicLevelChart to be added in the future */}
      <div className="hidden tablet:block" />
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
