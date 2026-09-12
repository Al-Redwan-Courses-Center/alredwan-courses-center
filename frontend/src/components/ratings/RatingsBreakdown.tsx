import React from 'react';
import RatingStars from '@/components/shared/RatingStars';
import ProgressBar from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';

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

const RatingsBreakdown: React.FC<RatingsBreakdownProps> = ({ statistics, compact = false }) => {
    const {
        average_rating,
        total_ratings,
        student_ratings_count,
        student_average,
        parent_ratings_count,
        parent_average
    } = statistics;

    if (total_ratings === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-2xl font-medium">لا توجد تقييمات بعد</p>
            </div>
        );
    }
  if (total_ratings === 0) {
    return (
        <div className={cn(
            "grid grid-cols-3 tablet:grid-cols-1 bg-white rounded-3xl border border-gray-100 shadow-sm divide-x divide-x-reverse tablet:divide-x-0 tablet:divide-y divide-gray-100",
            compact ? "p-4 gap-4" : "p-8 gap-8"
        )}>
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center tablet:pt-0 tablet:pb-6">
                <span className={cn("font-bold text-gray-500 mb-2", compact ? "text-xl" : "text-2xl mobile-lg:text-3xl")}>التقييم العام</span>
                <div className={cn("leading-none font-black text-primary mb-2 mt-4", compact ? "text-6xl" : "text-[6rem] mobile-lg:text-[8rem]")}>
                    {average_rating ? average_rating.toFixed(1) : '0.0'}
                </div>
                <RatingStars rating={average_rating || 0} size="sm" />
                <span className={cn("text-gray-400 mt-2", compact ? "text-lg" : "text-xl mobile-lg:text-2xl")}>من {total_ratings} تقييم</span>
            </div>

            {/* Student Score */}
            <div className="flex flex-col items-center justify-center tablet:pt-6">
                <span className={cn("font-bold text-blue-600 mb-2", compact ? "text-xl" : "text-2xl mobile-lg:text-3xl")}>تقييم الطلاب</span>
                <div className={cn("leading-none font-bold text-gray-900 mb-2 mt-2", compact ? "text-5xl" : "text-[4rem] mobile-lg:text-[5rem]")}>
                    {student_average ? student_average.toFixed(1) : '0.0'}
                </div>
                <div className="w-full max-w-[120px] space-y-2 mt-2">
                    <ProgressBar progress={(student_average || 0) * 10} className="h-2" />
                    <div className={cn("flex justify-between text-gray-400", compact ? "text-lg" : "text-xl mobile-lg:text-2xl")}>
                        <span>{student_ratings_count} تقييم</span>
                        <span>10/10</span>
                    </div>
                </div>
            </div>

            {/* Parent Score */}
            <div className="flex flex-col items-center justify-center tablet:pt-6">
                <span className={cn("font-bold text-purple-600 mb-2", compact ? "text-xl" : "text-2xl mobile-lg:text-3xl")}>تقييم أولياء الأمور</span>
                <div className={cn("leading-none font-bold text-gray-900 mb-2 mt-2", compact ? "text-5xl" : "text-[4rem] mobile-lg:text-[5rem]")}>
                    {parent_average ? parent_average.toFixed(1) : '0.0'}
                </div>
                <div className="w-full max-w-[120px] space-y-2 mt-2">
                    <ProgressBar progress={(parent_average || 0) * 10} className="h-2" />
                    <div className={cn("flex justify-between text-gray-400", compact ? "text-lg" : "text-xl mobile-lg:text-2xl")}>
                        <span>{parent_ratings_count} تقييم</span>
                        <span>10/10</span>
                    </div>
                </div>
            </div>
        </div>    );
  }

  return (
    <div className="grid grid-cols-3 tablet:grid-cols-1 gap-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm divide-x divide-x-reverse tablet:divide-x-0 tablet:divide-y divide-gray-100">
      {/* Overall Score */}
      <div className="flex flex-col items-center justify-center tablet:pt-0 tablet:pb-6">
        <span className="text-2xl mobile-lg:text-3xl font-bold text-gray-500 mb-2">
          التقييم العام
        </span>
        <div className="text-[6rem] mobile-lg:text-[8rem] leading-none font-black text-primary mb-2 mt-4">
          {average_rating ? average_rating.toFixed(1) : "0.0"}
        </div>
        <RatingStars rating={average_rating || 0} size="sm" />
        <span className="text-xl mobile-lg:text-2xl text-gray-400 mt-2">
          من {total_ratings} تقييم
        </span>
      </div>

      {/* Student Score */}
      <div className="flex flex-col items-center justify-center tablet:pt-6">
        <span className="text-2xl mobile-lg:text-3xl font-bold text-blue-600 mb-2">
          تقييم الطلاب
        </span>
        <div className="text-[4rem] mobile-lg:text-[5rem] leading-none font-bold text-gray-900 mb-2 mt-2">
          {student_average ? student_average.toFixed(1) : "0.0"}
        </div>
        <div className="w-full max-w-[120px] space-y-2 mt-2">
          <ProgressBar progress={(student_average || 0) * 10} className="h-2" />
          <div className="flex justify-between text-xl mobile-lg:text-2xl text-gray-400">
            <span>{student_ratings_count} تقييم</span>
            <span>10/10</span>
          </div>
        </div>
      </div>

      {/* Parent Score */}
      <div className="flex flex-col items-center justify-center tablet:pt-6">
        <span className="text-2xl mobile-lg:text-3xl font-bold text-purple-600 mb-2">
          تقييم أولياء الأمور
        </span>
        <div className="text-[4rem] mobile-lg:text-[5rem] leading-none font-bold text-gray-900 mb-2 mt-2">
          {parent_average ? parent_average.toFixed(1) : "0.0"}
        </div>
        <div className="w-full max-w-[120px] space-y-2 mt-2">
          <ProgressBar progress={(parent_average || 0) * 10} className="h-2" />
          <div className="flex justify-between text-xl mobile-lg:text-2xl text-gray-400">
            <span>{parent_ratings_count} تقييم</span>
            <span>10/10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingsBreakdown;
