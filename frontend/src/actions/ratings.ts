'use server';

import { getAuthApiClient } from '@/lib/auth-api';
import { revalidatePath } from 'next/cache';

/**
 * Submit a rating for a course
 */
export async function rateCourse(courseId: string | number, rating: number, feedback: string) {
    try {
        const client = await getAuthApiClient();
        const response = await client.post(`/api/courses/${courseId}/rate/`, {
            rating,
            feedback
        });

        if (response.status === 200 || response.status === 201) {
            revalidatePath(`/courses/${courseId}`);
            return { success: true, message: response.data.detail || 'تم حفظ التقييم بنجاح' };
        }

        return { success: false, message: 'حدث خطأ أثناء حفظ التقييم' };
    } catch (error: any) {
        console.error('Error rating course:', error);
        return {
            success: false,
            message: error.response?.data?.non_field_errors?.[0] || 
                     error.response?.data?.detail || 
                     'فشل الاتصال بالخادم'
        };
    }
}

/**
 * Submit a rating for an instructor
 */
export async function rateInstructor(instructorId: number, courseId: number, rating: number, feedback: string) {
    try {
        const client = await getAuthApiClient();
        const response = await client.post(`/api/users/instructors/${instructorId}/rate/`, {
            course: courseId,
            rating,
            feedback
        });

        if (response.status === 200 || response.status === 201) {
            revalidatePath(`/instructors/${instructorId}`);
            return { success: true, message: response.data.detail || 'تم حفظ التقييم بنجاح' };
        }

        return { success: false, message: 'حدث خطأ أثناء حفظ التقييم' };
    } catch (error: any) {
        console.error('Error rating instructor:', error);
        return {
            success: false,
            message: error.response?.data?.non_field_errors?.[0] || 
                     error.response?.data?.detail || 
                     'فشل الاتصال بالخادم'
        };
    }
}

/**
 * Fetch course ratings
 */
export async function getCourseRatings(courseId: string | number) {
    try {
        const client = await getAuthApiClient();
        const response = await client.get(`/api/courses/${courseId}/ratings/`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Error fetching course ratings:', error);
        return { success: false, message: 'فشل تحميل التقييمات' };
    }
}

/**
 * Fetch instructor ratings
 */
export async function getInstructorRatings(instructorId: number) {
    try {
        const client = await getAuthApiClient();
        const response = await client.get(`/api/users/instructors/${instructorId}/ratings/`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Error fetching instructor ratings:', error);
        return { success: false, message: 'فشل تحميل التقييمات' };
    }
}
