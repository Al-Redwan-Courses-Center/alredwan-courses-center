'use client';

import React, { useEffect, useState } from 'react';
import RatingsBreakdown from './RatingsBreakdown';
import ReviewCard from './ReviewCard';
import RatingForm from './RatingForm';
import { getCourseRatings, getInstructorRatings, getOnlineCourseRatings } from '@/actions/ratings';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingsSectionProps {
    type: 'course' | 'instructor' | 'online_course';
    id: string | number;
    showForm?: boolean;
    courseId?: number; // Needed for instructor rating
    compact?: boolean;
}

const RatingsSection: React.FC<RatingsSectionProps> = ({
    type,
    id,
    showForm = false,
    courseId,
    compact = false
}) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            let result;
            if (type === 'course') {
                result = await getCourseRatings(id);
            } else if (type === 'instructor') {
                result = await getInstructorRatings(id as number);
            } else {
                result = await getOnlineCourseRatings(id as string);
            }
            
            if (result.success) {
                setData(result.data);
            }
            setLoading(false);
        };

        fetchData();
    }, [type, id, refreshTrigger]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const allReviews = [
        ...data.ratings.student_ratings.map((r: any) => ({ ...r, type: 'student' })),
        ...data.ratings.parent_ratings.map((r: any) => ({ ...r, type: 'parent' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <section id="ratings" className={compact ? "space-y-6 py-4" : "space-y-12 py-12"}>
            <div className="flex items-center gap-3">
                <div className={cn("bg-olive-500/10 rounded-xl flex items-center justify-center text-olive-500", compact ? "w-8 h-8" : "w-10 h-10")}>
                    <Star className={cn("fill-olive-500", compact ? "w-4 h-4" : "w-6 h-6")} />
                </div>
                <h2 className={cn("font-black text-gray-900", compact ? "text-3xl" : "text-5xl mobile-lg:text-6xl")}>التقييمات والمراجعات</h2>
            </div>

            <RatingsBreakdown statistics={data.statistics} compact={compact} />

            <div className="grid grid-cols-3 tablet:grid-cols-1 gap-12 items-start w-full">
                <div className="col-span-2 tablet:col-span-1 w-full space-y-8">
                    {allReviews.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            {allReviews.map((review: any) => (
                                <ReviewCard
                                    key={`${review.type}-${review.id}`}
                                    reviewerName={review.rater_name}
                                    rating={review.rating}
                                    feedback={review.feedback}
                                    date={review.created_at}
                                    type={review.type as 'student' | 'parent'}
                                    courseName={review.course_name}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 w-full">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-3xl mobile-lg:text-4xl font-medium">لا توجد مراجعات نصية بعد</p>
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-8">
                    {showForm && (
                        <RatingForm 
                            type={type} 
                            id={id} 
                            instructorId={type === 'instructor' ? id as number : undefined}
                            courseId={courseId}
                            onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                            compact={compact}
                        />
                    )}
                    
                    {!compact && (
                        <div className="bg-linear-to-br from-olive-500 to-olive-700 rounded-3xl p-8 text-white shadow-xl">
                            <h4 className="text-3xl mobile-lg:text-4xl font-bold mb-4">لماذا تقييمك مهم؟</h4>
                        <ul className="space-y-3 text-2xl mobile-lg:text-3xl opacity-90">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                                يساعد المعلمين على تحسين أسلوب الشرح
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                                يوجه الطلاب الآخرين لاختيار الكورس المناسب
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                                يساهم في رفع جودة المركز التعليمي ككل
                            </li>
                        </ul>
                    </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RatingsSection;
