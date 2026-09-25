import React from "react";
import RatingStars from "@/components/shared/RatingStars";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

interface RatingsBreakdownProps {
  statistics: {
    average_rating: number | null;
    total_ratings: number;
    student_ratings_count: number;
    student_average: number | null;
    parent_ratings_count: number;
    parent_average: number | null;
  };
  compact?: boolean;
}

const RatingsBreakdown: React.FC<RatingsBreakdownProps> = ({
  statistics,
  compact = false,
}) => {
  const {
    average_rating,
    total_ratings,
    student_ratings_count,
    student_average,
    parent_ratings_count,
    parent_average,
  } = statistics;

  if (total_ratings === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <p className="text-2xl font-medium text-gray-500">
          لا توجد تقييمات بعد
        </p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "tablet:grid-cols-1 tablet:divide-x-0 tablet:divide-y grid grid-cols-3 divide-x divide-gray-100 rounded-3xl border border-gray-100 bg-white shadow-sm divide-x-reverse",
        compact ? "gap-4 p-4" : "gap-8 p-8",
      )}
    >
      {/* Overall Score */}
      <div className="tablet:pt-0 tablet:pb-6 flex flex-col items-center justify-center">
        <span
          className={cn(
            "mb-2 font-bold text-gray-500",
            compact ? "text-xl" : "mobile-lg:text-3xl text-2xl",
          )}
        >
          التقييم العام
        </span>
        <div
          className={cn(
            "text-primary mt-4 mb-2 leading-none font-black",
            compact ? "text-6xl" : "mobile-lg:text-[8rem] text-[6rem]",
          )}
        >
          {average_rating ? average_rating.toFixed(1) : "0.0"}
        </div>
        <RatingStars rating={average_rating || 0} size="sm" />
        <span
          className={cn(
            "mt-2 text-gray-400",
            compact ? "text-lg" : "mobile-lg:text-2xl text-xl",
          )}
        >
          من {total_ratings} تقييم
        </span>
      </div>

      {/* Student Score */}
      <div className="tablet:pt-6 flex flex-col items-center justify-center">
        <span
          className={cn(
            "mb-2 font-bold text-blue-600",
            compact ? "text-xl" : "mobile-lg:text-3xl text-2xl",
          )}
        >
          تقييم الطلاب
        </span>
        <div
          className={cn(
            "mt-2 mb-2 leading-none font-bold text-gray-900",
            compact ? "text-5xl" : "mobile-lg:text-[5rem] text-[4rem]",
          )}
        >
          {student_average ? student_average.toFixed(1) : "0.0"}
        </div>
        <div className="mt-2 w-full max-w-[120px] space-y-2">
          <ProgressBar progress={(student_average || 0) * 10} className="h-2" />
          <div
            className={cn(
              "flex justify-between text-gray-400",
              compact ? "text-lg" : "mobile-lg:text-2xl text-xl",
            )}
          >
            <span>{student_ratings_count} تقييم</span>
            <span>10/10</span>
          </div>
        </div>
      </div>

      {/* Parent Score */}
      <div className="tablet:pt-6 flex flex-col items-center justify-center">
        <span
          className={cn(
            "mb-2 font-bold text-purple-600",
            compact ? "text-xl" : "mobile-lg:text-3xl text-2xl",
          )}
        >
          تقييم أولياء الأمور
        </span>
        <div
          className={cn(
            "mt-2 mb-2 leading-none font-bold text-gray-900",
            compact ? "text-5xl" : "mobile-lg:text-[5rem] text-[4rem]",
          )}
        >
          {parent_average ? parent_average.toFixed(1) : "0.0"}
        </div>
        <div className="mt-2 w-full max-w-[120px] space-y-2">
          <ProgressBar progress={(parent_average || 0) * 10} className="h-2" />
          <div
            className={cn(
              "flex justify-between text-gray-400",
              compact ? "text-lg" : "mobile-lg:text-2xl text-xl",
            )}
          >
            <span>{parent_ratings_count} تقييم</span>
            <span>10/10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingsBreakdown;
