"use client";

import PublicCourseCard from "@/components/courses/PublicCourseCard";
import { cn } from "@/lib/utils";
import { LandingPageCourse } from "@/types/entities";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useEffect, useState } from "react";

const navigationButtonStyles = cn(
  "font-medad absolute top-1/2 transform-[translateY(-50%)] text-7xl font-bold",
);

export default function PublicCoursesList({
  courses,
}: {
  courses: LandingPageCourse[];
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 500px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isMobile ? (
    <div className="relative grid px-10">
      <button
        className={cn(navigationButtonStyles, "swiper-next mobile-lg:-left-10")}
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

      <button className={cn(navigationButtonStyles, "swiper-prev -right-10")}>
        {"<"}
      </button>
    </div>
  ) : (
    <div className="tablet:grid-cols-2 tablet:gap-17 mb-17 grid grid-cols-3 gap-27">
      {courses.map(({ course }, i) => (
        <PublicCourseCard key={course.id} course={course} index={i} />
      ))}
    </div>
  );
}
