"use client";

import RefreshIcon from "@/components/icons/RefreshIcon";
import SectionHeader from "./Shared/SectionHeader";

interface PendingEnrollmentsHeaderProps {
  count: number;
  onRefresh?: () => void;
}

export default function PendingEnrollmentsHeader({
  count,
  onRefresh,
}: PendingEnrollmentsHeaderProps) {
  return (
    <div className="tablet:mb-6 tablet:flex-row mobile:mb-4 mobile:gap-3 mb-8 flex w-full items-center justify-between">
      <SectionHeader title="الطلبات المعلقة" count={count} />

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="mobile:self-start cursor-pointer transition-transform"
          aria-label="تحديث القائمة"
        >
          <RefreshIcon width={"24"} height={"24"} />
        </button>
      )}
    </div>
  );
}
