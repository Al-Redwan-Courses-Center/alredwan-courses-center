"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import EditIcon from "@/components/icons/EditIcon";
import LectureEditModal from "@/components/courses/LectureEditModal";
import type { LectureListItem } from "@/types/entities";

/** Client wrapper so a server-rendered page can offer the lecture edit modal. */
export default function LectureEditButton({
  lecture,
  isAdmin,
}: {
  lecture: LectureListItem;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-olive-600 hover:bg-olive-700 inline-flex max-w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-md transition sm:gap-3 sm:rounded-2xl sm:px-7 sm:py-3.5 sm:text-xl"
      >
        <EditIcon className="h-4 w-4 sm:h-6 sm:w-6" />
        <span>تعديل المحاضرة</span>
      </button>

      {isOpen && (
        <LectureEditModal
          key={lecture.id}
          lecture={lecture}
          isAdmin={isAdmin}
          onClose={() => setIsOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
