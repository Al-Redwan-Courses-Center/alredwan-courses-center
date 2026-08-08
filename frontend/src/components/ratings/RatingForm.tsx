"use client";

import React, { useState } from "react";
import RatingStars from "@/components/shared/RatingStars";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { Loader2, Send } from "lucide-react";
import { rateCourse, rateInstructor } from "@/actions/ratings";

interface RatingFormProps {
  type: "course" | "instructor";
  id: string | number;
  instructorId?: number; // Only for instructor rating
  courseId?: number; // Only for instructor rating
  onSuccess?: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({
  type,
  id,
  instructorId,
  courseId,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(10);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (type === "course") {
        result = await rateCourse(id, rating, feedback);
      } else {
        if (!instructorId || !courseId) {
          toast.error("بيانات المدرس أو الدورة ناقصة");
          setLoading(false);
          return;
        }
        result = await rateInstructor(instructorId, courseId, rating, feedback);
      }

      if (result.success) {
        toast.success(result.message);
        setFeedback("");
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
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-xl"
    >
      <div className="space-y-2 text-center">
        <h3 className="mobile-lg:text-5xl text-4xl font-bold text-gray-900">
          أضف تقييمك
        </h3>
        <p className="mobile-lg:text-2xl mt-2 text-xl text-gray-500">
          رأيك يهمنا ويساعدنا في التطوير
        </p>
      </div>

      <div className="bg-primary/5 mt-4 flex flex-col items-center gap-4 rounded-2xl py-6">
        <span className="text-primary text-2xl font-medium">
          التقييم العام (من 10)
        </span>
        <RatingStars rating={rating} editable size="lg" onChange={setRating} />
        <span className="mobile-lg:text-5xl text-primary mt-2 text-4xl font-black">
          {rating}/10
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <label className="mr-1 text-2xl font-bold text-gray-700">
          ملاحظاتك (اختياري)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="اكتب تجربتك هنا..."
          className="focus:ring-primary/20 focus:border-primary mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-gray-200 p-6 text-2xl transition-all outline-none focus:ring-2"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="shadow-primary/20 mt-6 h-16 w-full gap-3 rounded-2xl text-3xl font-bold shadow-lg"
      >
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <>
            <Send className="h-8 w-8" />
            إرسال التقييم
          </>
        )}
      </Button>
    </form>
  );
};

export default RatingForm;
