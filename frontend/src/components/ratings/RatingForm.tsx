'use client';

import React, { useState } from 'react';
import RatingStars from '@/components/shared/RatingStars';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import { rateCourse, rateInstructor } from '@/actions/ratings';

interface RatingFormProps {
    type: 'course' | 'instructor';
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
    onSuccess
}) => {
    const [rating, setRating] = useState<number>(10);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (type === 'course') {
                result = await rateCourse(id, rating, feedback);
            } else {
                if (!instructorId || !courseId) {
                    toast.error('بيانات المدرس أو الدورة ناقصة');
                    setLoading(false);
                    return;
                }
                result = await rateInstructor(instructorId, courseId, rating, feedback);
            }

            if (result.success) {
                toast.success(result.message);
                setFeedback('');
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <div className="text-center space-y-2">
                <h3 className="text-4xl mobile-lg:text-5xl font-bold text-gray-900">أضف تقييمك</h3>
                <p className="text-xl mobile-lg:text-2xl text-gray-500 mt-2">رأيك يهمنا ويساعدنا في التطوير</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-6 bg-primary/5 rounded-2xl mt-4">
                <span className="text-2xl font-medium text-primary">التقييم العام (من 10)</span>
                <RatingStars 
                    rating={rating} 
                    editable 
                    size="lg" 
                    onChange={setRating} 
                />
                <span className="text-4xl mobile-lg:text-5xl font-black text-primary mt-2">{rating}/10</span>
            </div>

            <div className="space-y-4 mt-6">
                <label className="text-2xl font-bold text-gray-700 mr-1">ملاحظاتك (اختياري)</label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="اكتب تجربتك هنا..."
                    className="text-2xl w-full min-h-[120px] rounded-2xl border border-gray-200 p-6 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all mt-2"
                />
            </div>

            <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 mt-6 rounded-2xl text-3xl font-bold gap-3 shadow-lg shadow-primary/20"
            >
                {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                    <>
                        <Send className="w-8 h-8" />
                        إرسال التقييم
                    </>
                )}
            </Button>
        </form>
    );
};

export default RatingForm;
