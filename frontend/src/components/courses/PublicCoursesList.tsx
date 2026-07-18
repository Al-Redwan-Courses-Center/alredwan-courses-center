"use client";

import PublicCourseCard from "@/components/courses/PublicCourseCard";
import { cn } from "@/lib/utils";
import { LandingPageCourse } from "@/types/entities";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useIsClient, useMediaQuery } from "usehooks-ts";
import Loader from "@/components/ui/Loader";

const navigationButtonStyles = cn(
  "font-medad absolute top-1/2 transform-[translateY(-50%)] text-7xl font-bold text-gray-900",
);

export default function PublicCoursesList({
  courses,
}: {
  courses: LandingPageCourse[];
}) {
  const showSlider = useMediaQuery("(max-width: 600px)");
  const isClient = useIsClient();

  if (!isClient)
    return (
      <div className="h-20">
        <Loader />
      </div>
    );

  if (showSlider) {
    return (
      <div className="tablet-sm:px-20 relative grid px-40">
        <button
          className={cn(
            navigationButtonStyles,
            "swiper-next tablet-sm:-left-10",
          )}
        >
          {">"}
        </button>

        <Swiper
          modules={[Autoplay, Navigation]}
          slidesPerView={1}
          spaceBetween={30}
          loop
          autoplay={{
            delay: 3000,
          }}
          speed={1200}
          navigation={{
            enabled: true,
            nextEl: ".swiper-next",
            prevEl: ".swiper-prev",
          }}
          className="w-full p-5!"
        >
          {courses.map(({ course }, i) => (
            <SwiperSlide key={course.id} className="px-10 py-5">
              <PublicCourseCard key={course.id} course={course} index={i} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          className={cn(
            navigationButtonStyles,
            "swiper-prev tablet-sm:-right-10",
          )}
        >
          {"<"}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-17 grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-20 xl:grid-cols-3">
      {courses.map(({ course }, i) => (
        <PublicCourseCard key={course.id} course={course} index={i} />
      ))}
    </div>
  );
}
