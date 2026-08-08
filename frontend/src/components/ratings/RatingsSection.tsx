"use client";

import React, { useEffect, useState } from "react";
import RatingsBreakdown from "./RatingsBreakdown";
import ReviewCard from "./ReviewCard";
import RatingForm from "./RatingForm";
import { getCourseRatings, getInstructorRatings } from "@/actions/ratings";
import { Loader2, MessageSquare, Star } from "lucide-react";

interface RatingsSectionProps {
  type: "course" | "instructor";
  id: string | number;
  showForm?: boolean;
  courseId?: number; // Needed for instructor rating
}

const RatingsSection: React.FC<RatingsSectionProps> = ({
  type,
  id,
  showForm = false,
  courseId,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result =
        type === "course"
          ? await getCourseRatings(id)
          : await getInstructorRatings(id as number);

      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [type, id, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const allReviews = [
    ...data.ratings.student_ratings.map((r: any) => ({
      ...r,
      type: "student",
    })),
    ...data.ratings.parent_ratings.map((r: any) => ({ ...r, type: "parent" })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <section id="ratings" className="space-y-12 py-12">
      <div className="flex items-center gap-3">
        <div className="bg-olive-500/10 text-olive-500 flex h-10 w-10 items-center justify-center rounded-xl">
          <Star className="fill-olive-500 h-6 w-6" />
        </div>
        <h2 className="mobile-lg:text-6xl text-5xl font-black text-gray-900">
          التقييمات والمراجعات
        </h2>
      </div>

      <RatingsBreakdown statistics={data.statistics} />

      <div className="tablet:grid-cols-1 grid w-full grid-cols-3 items-start gap-12">
        <div className="tablet:col-span-1 col-span-2 w-full space-y-8">
          {allReviews.length > 0 ? (
            <div className="flex flex-col gap-6">
              {allReviews.map((review: any) => (
                <ReviewCard
                  key={`${review.type}-${review.id}`}
                  reviewerName={review.rater_name}
                  rating={review.rating}
                  feedback={review.feedback}
                  date={review.created_at}
                  type={review.type as "student" | "parent"}
                  courseName={review.course_name}
                />
              ))}
            </div>
          ) : (
            <div className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-gray-400">
              <MessageSquare className="mb-4 h-16 w-16 opacity-20" />
              <p className="mobile-lg:text-4xl text-3xl font-medium">
                لا توجد مراجعات نصية بعد
              </p>
            </div>
          )}
        </div>

        <div className="col-span-1 space-y-8">
          {showForm && (
            <RatingForm
              type={type}
              id={id}
              instructorId={type === "instructor" ? (id as number) : undefined}
              courseId={courseId}
              onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )}

          <div className="from-olive-500 to-olive-700 rounded-3xl bg-linear-to-br p-8 text-white shadow-xl">
            <h4 className="mobile-lg:text-4xl mb-4 text-3xl font-bold">
              لماذا تقييمك مهم؟
            </h4>
            <ul className="mobile-lg:text-3xl space-y-3 text-2xl opacity-90">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                يساعد المعلمين على تحسين أسلوب الشرح
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                يوجه الطلاب الآخرين لاختيار الكورس المناسب
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                يساهم في رفع جودة المركز التعليمي ككل
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RatingsSection;
