"use client";

import { useEffect, useState } from 'react';
import RatingStars from '@/components/shared/RatingStars';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import { rateCourse, rateInstructor, rateOnlineCourse } from '@/actions/ratings';
import { getInstructorCourses } from "@/actions/courses";
import type { CourseListItem } from "@/types/entities";
import { cn } from '@/lib/utils';

interface RatingFormProps {
    type: 'course' | 'instructor' | 'online_course';
    id: string | number;
    instructorId?: number; // Only for instructor rating
    courseId?: number; // Only for instructor rating
    onSuccess?: () => void;
    compact?: boolean;
}

const RatingForm: React.FC<RatingFormProps> = ({
    type,
    id,
    instructorId,
    courseId,
    onSuccess,
    compact = false
}) => {
  const [rating, setRating] = useState<number>(10);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (type === "instructor") {
      const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
          const fetchedCourses = await getInstructorCourses(String(id));
          setCourses(fetchedCourses);
          if (fetchedCourses.length > 0) {
            setSelectedCourseId(fetchedCourses[0].id);
          }
        } catch (error) {
          console.error("Error fetching instructor courses:", error);
        } finally {
          setLoadingCourses(false);
        }
      };
      fetchCourses();
    }
  }, [type, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        let result;
        if (type === 'course') {
            result = await rateCourse(id, rating, feedback);
        } else if (type === 'online_course') {
            result = await rateOnlineCourse(id as string, rating, feedback);
        } else {
            const finalInstructorId = instructorId || Number(id);
            const finalCourseId = courseId || Number(selectedCourseId);
            if (!finalInstructorId || !finalCourseId) {
                toast.error('يرجى اختيار الدورة التدريبية');
                setLoading(false);
                return;
            }
            result = await rateInstructor(finalInstructorId, finalCourseId, rating, feedback);
        }

        if (result.success) {
            toast.success(result.message);
            setFeedback('');
            if (onSuccess) onSuccess();
        } else {
            toast.error(result.message);
        }
    } catch (error) {
        toast.error("حدث خطأ غير متوقع");
    } finally {
        setLoading(false);
    }
  };

  return (
        <form onSubmit={handleSubmit} className={cn("bg-white border border-gray-100 shadow-xl", compact ? "rounded-2xl p-4 space-y-4" : "rounded-3xl p-8 space-y-6")}>
            <div className="text-center space-y-2">
                <h3 className={cn("font-bold text-gray-900", compact ? "text-2xl" : "text-4xl mobile-lg:text-5xl")}>أضف تقييمك</h3>
                {!compact && <p className="text-xl mobile-lg:text-2xl text-gray-500 mt-2">رأيك يهمنا ويساعدنا في التطوير</p>}
            </div>

            {type === "instructor" && !courseId && (
              <div className="space-y-4">
                <label className="text-2xl font-bold text-gray-700 mr-1">
                  الدورة التدريبية
                </label>
                {loadingCourses ? (
                  <div className="flex items-center gap-2 text-xl text-gray-400 py-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري تحميل الدورات...</span>
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                    required
                    className="text-2xl w-full rounded-2xl border border-gray-200 p-6 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all mt-2 bg-white"
                  >
                    <option value="" disabled>اختر الدورة</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className={cn("flex flex-col items-center bg-primary/5 rounded-2xl", compact ? "gap-2 py-3 mt-2" : "gap-4 py-6 mt-4")}>
                <span className={cn("font-medium text-primary", compact ? "text-lg" : "text-2xl")}>التقييم العام (من 10)</span>
                <RatingStars 
                    rating={rating} 
                    editable 
                    size={compact ? "sm" : "lg"} 
                    onChange={setRating} 
                />
                <span className={cn("font-black text-primary", compact ? "text-3xl mt-1" : "text-4xl mobile-lg:text-5xl mt-2")}>{rating}/10</span>
            </div>

            <div className={cn("space-y-2", compact ? "mt-4" : "mt-6 space-y-4")}>
                <label className={cn("font-bold text-gray-700 mr-1", compact ? "text-lg" : "text-2xl")}>ملاحظاتك (اختياري)</label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="اكتب تجربتك هنا..."
                    className={cn(
                        "w-full rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all mt-2",
                        compact ? "text-lg min-h-[80px] p-4" : "text-2xl min-h-[120px] p-6"
                    )}
                />
            </div>

            <Button 
                type="submit" 
                disabled={loading}
                className={cn("w-full rounded-2xl font-bold gap-3 shadow-lg shadow-primary/20", compact ? "h-12 mt-4 text-xl" : "h-16 mt-6 text-3xl")}
            >
                {loading ? (
                    <Loader2 className={cn("animate-spin", compact ? "w-5 h-5" : "w-8 h-8")} />
                ) : (
                    <>
                        <Send className={compact ? "w-5 h-5" : "w-8 h-8"} />
                        إرسال التقييم
                    </>
                )}
            </Button>
        </form>
    );
};

export default RatingForm;
