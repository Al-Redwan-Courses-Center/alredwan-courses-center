"use client";

import { EnrollmentRequest } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import PendingEnrollmentsHeader from "./PendingEnrollmentsHeader";
import PendingEnrollmentCard from "./PendingEnrollmentCard";

interface PendingEnrollmentsListProps {
  pendingEnrollments: EnrollmentRequest[];
  onCancel?: (enrollmentId: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  // For parent view - to show child name
  showStudentName?: boolean;
  getStudentName?: (studentId: string) => string | undefined;
}

export default function PendingEnrollmentsList({
  pendingEnrollments,
  onCancel,
  onRefresh,
  isLoading = false,
  showStudentName = false,
  getStudentName,
}: PendingEnrollmentsListProps) {
  if (isLoading) {
    return (
      <div className="tablet:mb-12 tablet:px-8 mobile:mb-8 mobile:px-4 mb-17 px-16">
        <div className="tablet:mb-6 tablet:flex-row tablet:gap-3 mobile:mb-4 mobile:flex-col mb-8 flex items-center justify-between">
          <div className="tablet:gap-4 mobile:gap-3 flex items-center gap-4">
            <Skeleton className="tablet:h-10 tablet:w-40 mobile:h-8 mobile:w-32 h-12 w-48" />
            <Skeleton className="tablet:h-8 tablet:w-20 mobile:h-6 mobile:w-16 h-10 w-24" />
          </div>

          <Skeleton className="tablet:h-10 tablet:w-28 mobile:h-8 mobile:w-24 h-12 w-32" />
        </div>

        <div className="tablet:space-y-4 mobile:space-y-3 space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="tablet:h-36 mobile:h-32 h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (pendingEnrollments.length === 0) {
    return (
      <div className="p-8 text-center text-lg text-gray-600">
        لا توجد طلبات تسجيل معلقة.
      </div>
    );
  }

  return (
    <div className="tablet:mb-12 tablet:px-8 mobile:mb-8 mobile:px-4 mb-17 px-16">
      {/* Header */}
      <PendingEnrollmentsHeader
        count={pendingEnrollments.length}
        onRefresh={onRefresh}
      />


      {/* Enrollments List */}
      <div className="tablet:space-y-5 mobile:space-y-4 w-full space-y-6">
        {pendingEnrollments.map((enrollment, index) => {
          const studentName =
            showStudentName && getStudentName
              ? getStudentName(enrollment.student_id)
              : undefined;

          return (
            <PendingEnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              index={index}
              onCancel={onCancel}
              showStudentName={showStudentName}
              studentName={studentName}
            />
          );
        })}
      </div>
    </div>
  );
}
