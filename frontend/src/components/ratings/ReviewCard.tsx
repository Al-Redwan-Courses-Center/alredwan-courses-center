import React from 'react';
import RatingStars from '@/components/shared/RatingStars';
import { User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReviewCardProps {
    reviewerName: string;
    rating: number;
    feedback?: string;
    date: string;
    type: 'student' | 'parent';
    courseName?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
    reviewerName,
    rating,
    feedback,
    date,
    type,
    courseName
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{reviewerName}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={type === 'student' ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded' : 'text-purple-600 bg-purple-50 px-2 py-0.5 rounded'}>
                                {type === 'student' ? 'طالب' : 'ولي أمر'}
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
                <div className="flex flex-col items-start sm:items-end gap-1">
                    <RatingStars rating={rating} size="sm" />
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(date), 'dd MMMM yyyy', { locale: ar })}</span>
                    </div>
                </div>
            </div>
            
            {feedback && (
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed relative">
                    <span className="absolute -top-2 left-4 text-4xl text-gray-200 font-serif leading-none">"</span>
                    {feedback}
                    <span className="absolute -bottom-6 right-4 text-4xl text-gray-200 font-serif leading-none rotate-180">"</span>
                </div>
            )}
        </div>
    );
};

export default ReviewCard;
