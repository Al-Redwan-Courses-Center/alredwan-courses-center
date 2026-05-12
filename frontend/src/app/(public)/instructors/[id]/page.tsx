import React from 'react';
import { getInstructorById } from '@/actions/user';
import RatingsSection from '@/components/ratings/RatingsSection';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import InstructorProfile from "@/assets/instructor-profile.png";
import { Calendar, GraduationCap, Users, Star, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default async function InstructorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const instructor = await getInstructorById(id);

    if (!instructor) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-6 py-12 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Instructor Image */}
                        <div className="lg:col-span-4 flex justify-center">
                            <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-[4rem_0] overflow-hidden shadow-2xl ring-8 ring-olive-500/5">
                                <Image
                                    src={instructor.image_url || InstructorProfile}
                                    alt={instructor.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Instructor Info */}
                        <div className="lg:col-span-8 space-y-6 text-center lg:text-right">
                            <div className="space-y-2">
                                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                                    {instructor.tags.map((tag: any) => (
                                        <span key={tag.id} className="bg-olive-500/10 text-olive-500 px-4 py-1 text-sm rounded-full font-bold">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">
                                    {instructor.name}
                                </h1>
                                <p className="text-2xl text-olive-500 font-bold">
                                    {instructor.type_display}
                                </p>
                            </div>

                            <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                                {instructor.bio || "لا يوجد وصف متاح حالياً لهذا المعلم."}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                                <div className="flex flex-col items-center lg:items-start gap-1 p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-2 text-olive-500 font-bold">
                                        <Star className="w-5 h-5 fill-olive-500" />
                                        <span className="text-2xl">{instructor.average_rating || "0.0"}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">التقييم العام</span>
                                </div>
                                <div className="flex flex-col items-center lg:items-start gap-1 p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                                        <Users className="w-5 h-5" />
                                        <span className="text-2xl">{instructor.rating_count}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">إجمالي المراجعات</span>
                                </div>
                                <div className="flex flex-col items-center lg:items-start gap-1 p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-2 text-purple-600 font-bold">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-2xl">{format(new Date(instructor.joined_date), 'yyyy')}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">سنة الانضمام</span>
                                </div>
                                <div className="flex flex-col items-center lg:items-start gap-1 p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-2 text-green-600 font-bold">
                                        <Award className="w-5 h-5" />
                                        <span className="text-2xl">خبير</span>
                                    </div>
                                    <span className="text-xs text-gray-400">المستوى</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ratings Section */}
            <div className="container mx-auto px-6 mt-12">
                <RatingsSection type="instructor" id={id} />
            </div>
        </div>
    );
}
