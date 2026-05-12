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
                <h3 className="text-2xl font-bold text-gray-900">أضف تقييمك</h3>
                <p className="text-gray-500 text-sm">رأيك يهمنا ويساعدنا في التطوير</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4 bg-primary/5 rounded-2xl">
                <span className="text-sm font-medium text-primary">التقييم العام (من 10)</span>
                <RatingStars 
                    rating={rating} 
                    editable 
                    size="lg" 
                    onChange={setRating} 
                />
                <span className="text-2xl font-black text-primary">{rating}/10</span>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mr-1">ملاحظاتك (اختياري)</label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="اكتب تجربتك هنا..."
                    className="w-full min-h-[120px] rounded-2xl border border-gray-200 p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                />
            </div>

            <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/20"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        إرسال التقييم
                    </>
                )}
            </Button>
        </form>
    );
};

export default RatingForm;
