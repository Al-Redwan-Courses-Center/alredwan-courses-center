"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { deleteEnrollmentRequestById } from "@/actions/enrollments";
import TrashIcon from "@/components/icons/TrashIcon";
import { cn } from "@/lib/utils";

export default function EnrollmentRequestCancelButton({
  enrollmentRequestId,
}: {
  enrollmentRequestId: string;
}) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  async function handleCancelEnrollmentRequest() {
    setIsCancelling(true);

    const ok = await deleteEnrollmentRequestById(enrollmentRequestId);

    if (ok) {
      toast.success("تم إلغاء طلب الالتحاق بنجاح!");
      router.refresh();
    } else {
      toast.error(
        "حدث خطأ أثناء إلغاء طلب الالتحاق!\nبرجاء المحاولة مجدداً لاحقاً",
      );
    }

    setIsCancelling(false);
  }

  return (
    <button
      onClick={handleCancelEnrollmentRequest}
      className={cn(
        "hover:text-olive-700 absolute top-1/2 left-10 -translate-y-[50%] *:transition-colors",
        isCancelling ? "pointer-events-none text-gray-500" : "text-olive-300",
      )}
    >
      <TrashIcon />
    </button>
  );
}
