import React from "react";
import RatingStars from "@/components/shared/RatingStars";
import ProgressBar from "@/components/ui/ProgressBar";

interface RatingsBreakdownProps {
  statistics: {
    average_rating: number | null;
    total_ratings: number;
    student_ratings_count: number;
    student_average: number | null;
    parent_ratings_count: number;
    parent_average: number | null;
  };
}

const RatingsBreakdown: React.FC<RatingsBreakdownProps> = ({ statistics }) => {
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
    <div className="tablet:grid-cols-1 tablet:divide-x-0 tablet:divide-y grid grid-cols-3 gap-8 divide-x divide-gray-100 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm divide-x-reverse">
      {/* Overall Score */}
      <div className="tablet:pt-0 tablet:pb-6 flex flex-col items-center justify-center">
        <span className="mobile-lg:text-3xl mb-2 text-2xl font-bold text-gray-500">
          التقييم العام
        </span>
        <div className="mobile-lg:text-[8rem] text-primary mt-4 mb-2 text-[6rem] leading-none font-black">
          {average_rating ? average_rating.toFixed(1) : "0.0"}
        </div>
        <RatingStars rating={average_rating || 0} size="sm" />
        <span className="mobile-lg:text-2xl mt-2 text-xl text-gray-400">
          من {total_ratings} تقييم
        </span>
      </div>

      {/* Student Score */}
      <div className="tablet:pt-6 flex flex-col items-center justify-center">
        <span className="mobile-lg:text-3xl mb-2 text-2xl font-bold text-blue-600">
          تقييم الطلاب
        </span>
        <div className="mobile-lg:text-[5rem] mt-2 mb-2 text-[4rem] leading-none font-bold text-gray-900">
          {student_average ? student_average.toFixed(1) : "0.0"}
        </div>
        <div className="mt-2 w-full max-w-[120px] space-y-2">
          <ProgressBar progress={(student_average || 0) * 10} className="h-2" />
          <div className="mobile-lg:text-2xl flex justify-between text-xl text-gray-400">
            <span>{student_ratings_count} تقييم</span>
            <span>10/10</span>
          </div>
        </div>
      </div>

      {/* Parent Score */}
      <div className="tablet:pt-6 flex flex-col items-center justify-center">
        <span className="mobile-lg:text-3xl mb-2 text-2xl font-bold text-purple-600">
          تقييم أولياء الأمور
        </span>
        <div className="mobile-lg:text-[5rem] mt-2 mb-2 text-[4rem] leading-none font-bold text-gray-900">
          {parent_average ? parent_average.toFixed(1) : "0.0"}
        </div>
        <div className="mt-2 w-full max-w-[120px] space-y-2">
          <ProgressBar progress={(parent_average || 0) * 10} className="h-2" />
          <div className="mobile-lg:text-2xl flex justify-between text-xl text-gray-400">
            <span>{parent_ratings_count} تقييم</span>
            <span>10/10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingsBreakdown;
