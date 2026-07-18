import React from "react";
import RatingStars from "@/components/shared/RatingStars";
import { User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ReviewCardProps {
  reviewerName: string;
  rating: number;
  feedback?: string;
  date: string;
  type: "student" | "parent";
  courseName?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  reviewerName,
  rating,
  feedback,
  date,
  type,
  courseName,
}) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h4 className="mobile-lg:text-4xl text-3xl font-bold text-gray-900">
              {reviewerName}
            </h4>
            <div className="mobile-lg:text-2xl mt-2 flex items-center gap-2 text-xl text-gray-500">
              <span
                className={
                  type === "student"
                    ? "rounded bg-blue-50 px-2 py-0.5 text-blue-600"
                    : "rounded bg-purple-50 px-2 py-0.5 text-purple-600"
                }
              >
                {type === "student" ? "طالب" : "ولي أمر"}
              </span>
              {courseName && (
                <>
                  <span>•</span>
                  <span>{courseName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <RatingStars rating={rating} size="sm" />
          <div className="mobile-lg:text-2xl mt-1 flex items-center gap-1 text-xl text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(date), "dd MMMM yyyy", { locale: ar })}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="mobile-lg:text-3xl relative mt-4 rounded-xl bg-gray-50 p-6 text-2xl leading-relaxed text-gray-700">
          <span className="mobile-lg:text-7xl absolute -top-4 left-4 font-serif text-6xl leading-none text-gray-200">
            &quot;
          </span>
          {feedback}
          <span className="mobile-lg:text-7xl absolute right-4 -bottom-8 rotate-180 font-serif text-6xl leading-none text-gray-200">
            &quot;
          </span>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
