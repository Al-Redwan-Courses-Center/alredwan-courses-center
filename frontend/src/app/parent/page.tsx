"use client";

import { useRouter } from "next/navigation";
import ChildrenList from "@/components/dashboard/ChildrenList";
import PendingEnrollmentsList from "@/components/dashboard/PendingEnrollmentsList";
import Summary, { SummaryCardData } from "@/components/dashboard/Summary";
import { WelcomeHeader } from "@/components/dashboard/Shared";
import PeopleIcon from "@/components/icons/PeopleIcon";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import InfoCircleIcon from "@/components/icons/InfoCircleIcon";
import MoneyIcon from "@/components/icons/MoneyIcon";
import CheckIcon from "@/components/icons/CheckIcon";
import {
  MOCK_PARENT_USER,
  MOCK_CHILDREN_CARD_INFO,
  MOCK_PARENT_DASHBOARD_SUMMARY,
  MOCK_PENDING_ENROLLMENTS,
} from "@/dev-data/dashboard";
import { toHindiDigits } from "@/lib/utils";

export default function ParentDashboardPage() {
  const router = useRouter();

  const handleViewChildDashboard = (childId: string) => {
    router.push(`/parent/child/${childId}`);
  };

  const handleCancelEnrollment = async (enrollmentId: number) => {
    // TODO: Implement API call to cancel enrollment
    console.log("Cancel enrollment:", enrollmentId);
    alert("سيتم إلغاء التسجيل قريباً");
  };

  const handleRefreshEnrollments = () => {
    // TODO: Implement refresh logic
    console.log("Refresh enrollments");
    window.location.reload();
  };

  // Prepare summary cards data
  const summaryCards: SummaryCardData[] = [
    {
      icon: <PeopleIcon width="4rem" height="4rem" />,
      title: "إجمالي الأبناء",
      value: toHindiDigits(MOCK_PARENT_DASHBOARD_SUMMARY.total_children),
      bgColor: "from-purple-50 to-purple-100 text-purple-700",
    },
    {
      icon: <BookmarkIcon width="4rem" height="4rem" />,
      title: "الدورات النشطة",
      value: toHindiDigits(MOCK_PARENT_DASHBOARD_SUMMARY.total_active_courses),
      bgColor: "from-green-50 to-green-100 text-green-700",
    },
    {
      icon: <InfoCircleIcon width="4rem" height="4rem" />,
      title: "تسجيلات معلقة",
      value: toHindiDigits(
        MOCK_PARENT_DASHBOARD_SUMMARY.total_pending_enrollments,
      ),
      bgColor: "from-amber-50 to-amber-100 text-amber-700",
    },
    {
      icon: <MoneyIcon width="4rem" height="4rem" />,
      title: "مدفوعات معلقة",
      value: `${toHindiDigits(MOCK_PARENT_DASHBOARD_SUMMARY.total_pending_payments)} ج`,
      bgColor: "from-red-50 to-red-100 text-red-700",
    },
    {
      icon: <CheckIcon width="4rem" height="4rem" />,
      title: "المدفوعات الأخيرة",
      value: `${toHindiDigits(MOCK_PARENT_DASHBOARD_SUMMARY.recent_payments_sum)} ج`,
      bgColor: "from-blue-50 to-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="z-50 flex h-full max-h-full flex-col overflow-y-auto pt-15">
      {/* Welcome Header */}
      <WelcomeHeader parentUser={MOCK_PARENT_USER} />

      {/* Parent Summary Statistics */}
      <Summary items={summaryCards} />

      {/* Children List */}
      <div className="px-16">
        <ChildrenList
          childrenList={MOCK_CHILDREN_CARD_INFO}
          onViewChildDashboard={handleViewChildDashboard}
        />
      </div>

      {/* Global Pending Enrollments */}
      <PendingEnrollmentsList
        pendingEnrollments={MOCK_PENDING_ENROLLMENTS}
        onCancel={handleCancelEnrollment}
        onRefresh={handleRefreshEnrollments}
      />
    </div>
  );
}
