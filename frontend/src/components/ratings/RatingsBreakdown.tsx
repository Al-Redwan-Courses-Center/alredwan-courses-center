import React from 'react';
import RatingStars from '@/components/shared/RatingStars';
import ProgressBar from '@/components/ui/ProgressBar';

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
        parent_average
    } = statistics;

    if (total_ratings === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">لا توجد تقييمات بعد</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center border-l border-gray-100 last:border-l-0">
                <span className="text-sm font-bold text-gray-500 mb-2">التقييم العام</span>
                <div className="text-6xl font-black text-primary mb-2">
                    {average_rating ? average_rating.toFixed(1) : '0.0'}
                </div>
                <RatingStars rating={average_rating || 0} size="sm" />
                <span className="text-xs text-gray-400 mt-2">من {total_ratings} تقييم</span>
            </div>

            {/* Student Score */}
            <div className="flex flex-col items-center justify-center border-l border-gray-100 last:border-l-0">
                <span className="text-sm font-bold text-blue-600 mb-2">تقييم الطلاب</span>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                    {student_average ? student_average.toFixed(1) : '0.0'}
                </div>
                <div className="w-full max-w-[120px] space-y-1">
                    <ProgressBar progress={(student_average || 0) * 10} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{student_ratings_count} تقييم</span>
                        <span>10/10</span>
                    </div>
                </div>
            </div>

            {/* Parent Score */}
            <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-purple-600 mb-2">تقييم أولياء الأمور</span>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                    {parent_average ? parent_average.toFixed(1) : '0.0'}
                </div>
                <div className="w-full max-w-[120px] space-y-1">
                    <ProgressBar progress={(parent_average || 0) * 10} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{parent_ratings_count} تقييم</span>
                        <span>10/10</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingsBreakdown;
