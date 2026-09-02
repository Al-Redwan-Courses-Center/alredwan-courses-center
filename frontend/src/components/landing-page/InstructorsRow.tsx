"use client";

import Image from "next/image";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import InstructorProfile from "@/assets/instructor-profile.png";
import { cn } from "@/lib/utils";
import type { LandingPageInstructor } from "@/types/entities";
import Button from "@/components/ui/Button";
import InstructorModal from "./InstructorModal";

const straightShape =
  "rounded-[3rem] sm:rounded-[0_10rem] lg:rounded-[0_12rem]";
const reversedShape =
  "rounded-[3rem] sm:rounded-[10rem_0] lg:rounded-[12rem_0]";

interface InstructorsRowProps {
  instructors: LandingPageInstructor[];
}

export default function InstructorsRow({ instructors }: InstructorsRowProps) {
  if (!instructors || instructors.length === 0) return null;

  return (
    <div className="w-full">
      <Swiper
        dir="rtl"
        modules={[Pagination]}
        loop={true}
        speed={1200}
        spaceBetween={20}
        grabCursor={true}
        pagination={{ clickable: true }}
        breakpoints={{
          0: { slidesPerView: 1.15, spaceBetween: 16 },
          380: { slidesPerView: 1.25, spaceBetween: 16 },
          480: { slidesPerView: 1.5, spaceBetween: 20 },
          600: { slidesPerView: 2, spaceBetween: 20 },
          768: { slidesPerView: 2.3, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
          1280: { slidesPerView: 4, spaceBetween: 30 },
        }}
        className="w-full px-4 pb-[200px] text-gray-600 sm:px-8 lg:px-16 [&_.swiper-pagination]:relative [&_.swiper-pagination]:mt-8 [&_.swiper-pagination-bullet]:bg-gray-300 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-300 [&_.swiper-pagination-bullet-active]:w-6 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination-bullet-active]:bg-olive-500"
      >
        {instructors.map(({ instructor }, i) => {
          const words = instructor.bio
            ? instructor.bio.trim().split(/\s+/)
            : [];
          const isLongBio = words.length > 10;
          const shortBio = isLongBio
            ? words.slice(0, 10).join(" ") + "..."
            : instructor.bio;

          const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const imgUrl = instructor.image_url?.startsWith("/")
            ? backendUrl + instructor.image_url
            : instructor.image_url;

          return (
            <SwiperSlide key={instructor.id} className="h-auto py-4">
              <div
                className={cn(
                  "shadow-soft relative flex aspect-[4/5] h-full flex-col justify-between overflow-hidden bg-[linear-gradient(181deg,#FFF_3.72%,#93A494_180.46%)] px-5 pt-6 pb-0 min-[400px]:px-6 min-[400px]:pt-8 sm:aspect-auto sm:min-h-[460px] sm:pt-10 lg:min-h-[500px]",
                  i % 2 === 0 ? straightShape : reversedShape,
                )}
              >
                {/* Text details at the top */}
                <div className="relative z-10 flex w-full flex-col items-center text-center">
                  <h4 className="mb-1.5 line-clamp-1 text-[21px] font-extrabold text-olive-500 min-[400px]:text-[23px] sm:text-[26px] lg:text-[30px]">
                    {instructor.name}
                  </h4>
                  <p className="text-beige-500 mb-2 line-clamp-3 text-[13px] leading-relaxed whitespace-normal min-[400px]:text-[14px] sm:text-[16px] lg:text-[18px]">
                    {shortBio || "لا توجد نبذة تعريفية متاحة."}
                  </p>

                  {isLongBio ? (
                    <>
                      <InstructorModal
                        trigger={<Button size="small">أكمل القراءة</Button>}
                        instructor={instructor}
                      />
                      <br />
                    </>
                  ) : (
                    <>
                      <br />
                      <br />
                      <br />
                    </>
                  )}
                </div>

                {/* Instructor Image at the bottom */}
                <div
                  className="relative z-20 mt-auto flex w-full justify-center overflow-hidden"
                  draggable="false"
                >
                  <Image
                    src={imgUrl || InstructorProfile}
                    alt={`${instructor.name} Picture`}
                    width={500}
                    height={500}
                    className="h-[210px] w-auto object-contain object-bottom min-[400px]:h-[230px] sm:h-[270px] lg:h-[300px]"
                    draggable="false"
                  />
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
