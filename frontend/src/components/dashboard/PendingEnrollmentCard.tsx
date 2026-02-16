"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { EnrollmentRequest } from "@/types/dashboard";
import { cn, toHindiDigits } from "@/lib/utils";

import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import BookIcon from "@/components/icons/BookIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import TrashIcon from "@/components/icons/TrashIcon";

interface PendingEnrollmentCardProps {
  enrollment: EnrollmentRequest;
  index: number;
  onCancel?: (enrollmentId: number) => void;
  showStudentName?: boolean;
  studentName?: string;
  courseHrefBuilder?: (courseId: number) => string;
}

function getStatusText(status: string): string {
  switch (status) {
    case "pending":
      return "معلق";
    case "active":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    default:
      return status;
  }
}

function getStatusPillClasses(status: string): string {
  switch (status) {
    case "pending":
      return "bg-olive-100 text-olive-900";
    case "active":
      return "bg-olive-200 text-olive-900";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return toHindiDigits(
    `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`,
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "م" : "ص";
  const displayHours = hours % 12 || 12;

  return toHindiDigits(
    `${displayHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`,
  );
}

export default function PendingEnrollmentCard({
  enrollment,
  index,
  onCancel,
  showStudentName = false,
  studentName,
  courseHrefBuilder,
}: PendingEnrollmentCardProps) {
  const router = useRouter();

  const isAccepted = enrollment.status === "active";
  const isPending = enrollment.status === "pending";

  const courseHref =
    courseHrefBuilder?.(enrollment.course.id) ??
    `/courses/${enrollment.course.id}`;

  const handleViewCourse = () => router.push(courseHref);

  return (
    <article
      className={cn(
        "shadow-soft bg-table-2 relative w-full overflow-clip",
        index % 2 === 0
          ? "tablet:rounded-[1.4rem_0] mobile:rounded-[1rem_0] rounded-[2rem_0]"
          : "tablet:rounded-[0_1.4rem] mobile:rounded-[0_1rem] rounded-[0_2rem]",
      )}
    >
      <div className="tablet:flex-col tablet:items-stretch tablet:gap-5 mobile:gap-4 flex items-center justify-between gap-8 p-7">
        {/* Main info */}
        <div className="tablet:gap-5 mobile:gap-4 flex flex-1 flex-col gap-6">
          {/* Title + Status */}
          <header className="tablet:flex-col tablet:items-start tablet:gap-3 flex items-center gap-4">
            <button
              type="button"
              onClick={handleViewCourse}
              className="text-olive-900 font-['El_Messiri'] text-2xl leading-tight font-bold hover:underline"
            >
              {enrollment.course.name}
            </button>

            <span
              className={cn(
                "rounded-tl-md rounded-br-md px-4 py-1.5 font-['El_Messiri'] text-base font-bold",
                getStatusPillClasses(enrollment.status),
              )}
            >
              {getStatusText(enrollment.status)}
            </span>
          </header>

          {/* Dates + Price */}
          <div className="tablet:flex-col tablet:items-start tablet:gap-3 flex flex-wrap items-center gap-8">
            <div className="text-olive-900 flex items-center gap-3 font-['El_Messiri'] text-lg font-medium">
              <CalendarIcon className="text-olive-700 h-6 w-6" />
              <span>تم الطلب في {formatDate(enrollment.created_at)}</span>
              <span className="mx-1 text-gray-400">•</span>
              <ClockIcon className="text-olive-700 h-6 w-6" />
              <span>{formatTime(enrollment.created_at)}</span>
            </div>

            <div className="text-olive-900 flex items-center gap-3 font-['El_Messiri'] text-lg font-medium">
              <MoneyIcon className="text-olive-700 h-6 w-6" />
              <span>{toHindiDigits(enrollment.total_price)} جنيها</span>
            </div>
          </div>

          {/* Expiration */}
          {enrollment.expiration_date && isPending && (
            <p className="font-['El_Messiri'] text-base font-medium text-red-600">
              ينتهي في {formatDate(enrollment.expiration_date)}
            </p>
          )}

          {/* Student */}
          {showStudentName && studentName && (
            <p className="text-olive-900 flex items-center gap-3 font-['El_Messiri'] text-lg font-medium">
              <BookIcon className="text-olive-700 h-6 w-6" />
              <span className="text-gray-600">الطالب:</span>
              <span className="text-olive-700 font-bold">{studentName}</span>
            </p>
          )}
        </div>

        {/* Action */}
        {onCancel && (isPending || isAccepted) && (
          <div className="tablet:w-full tablet:flex-row tablet:justify-between flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => onCancel(enrollment.id)}
              className="hover:bg-olive-100 grid h-12 w-12 place-items-center rounded-full transition active:scale-95"
              aria-label={isPending ? "إلغاء الطلب" : "حذف الطلب"}
              title={isPending ? "إلغاء" : "حذف"}
            >
              <TrashIcon className="text-olive-800 h-8 w-8" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
