"use client";

import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useIsClient, useMediaQuery } from "usehooks-ts";
import PublicCourseCard from "@/components/courses/PublicCourseCard";
import Loader from "@/components/ui/Loader";
import { cn } from "@/lib/utils";
import type { LandingPageCourse } from "@/types/entities";

const navigationButtonStyles = cn(
  "font-medad text-5xl mobile-lg:text-4xl tablet-sm:text-5xl font-bold text-gray-900 hover:text-olive-500 transition-colors duration-200",
);

export default function PublicCoursesList({
  courses,
}: {
  courses: LandingPageCourse[];
}) {
  const isClient = useIsClient();

  if (!isClient)
    return (
      <div className="h-20">
        <Loader />
      </div>
    );

  const displayCourses = courses.length === 2 ? [...courses, ...courses] : courses;

  return (
    <div className="w-full">
      {/* Desktop Grid Layout: Visible on screens > 900px */}
      <div className="grid tablet:hidden w-full grid-cols-2 laptop:grid-cols-2 gap-10 mb-17">
        {courses.map(({ course }, i) => (
          <PublicCourseCard key={course.id} course={course} index={i} />
        ))}
      </div>

      {/* Mobile/Tablet Slider Layout: Visible on screens <= 900px */}
      <div className="hidden tablet:flex w-full flex-col items-center">
        <Swiper
          dir="rtl"
          key={displayCourses.length}
          modules={[Navigation]}
          slidesPerView={1}
          spaceBetween={20}
          loop={displayCourses.length >= 3}
          speed={1200}
          navigation={{
            enabled: true,
            nextEl: ".course-swiper-next",
            prevEl: ".course-swiper-prev",
          }}
          className="w-full"
        >
          {displayCourses.map(({ course }, i) => (
            <SwiperSlide key={`${course.id}-${i}`} className="px-4 py-5">
              <PublicCourseCard key={course.id} course={course} index={i} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons below the Slider to prevent overlapping */}
        <div className="flex items-center gap-16 mt-6">
          <button className={cn(navigationButtonStyles, "course-swiper-prev")}>
            {"<"}
          </button>
          <button className={cn(navigationButtonStyles, "course-swiper-next")}>
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
}
