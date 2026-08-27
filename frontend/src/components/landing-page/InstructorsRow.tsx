"use client";

import Image from "next/image";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import InstructorProfile from "@/assets/instructor-profile.png";
import { cn } from "@/lib/utils";
import type { LandingPageInstructor } from "@/types/entities";

const straight = cn("rounded-[0_19rem]");
const reversed = cn("rounded-[19rem_0]");

interface InstructorsRowProps {
  instructors: LandingPageInstructor[];
}

export default function InstructorsRow({ instructors }: InstructorsRowProps) {
  if (instructors.length <= 0) return null;

  return (
    <Swiper
      modules={[Autoplay]}
      loop={true}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
      }}
      speed={1200}
      spaceBetween={20}
      grabCursor={true}
      breakpoints={{
        0: { slidesPerView: 1, spaceBetween: 20 },
        800: { slidesPerView: 2, spaceBetween: 30 },
        1200: { slidesPerView: 3, spaceBetween: 40 },
      }}
      className="laptop:px-55 w-full text-[1.5rem] text-gray-600"
    >
      {instructors.map(({ instructor }, i) => (
        <SwiperSlide key={instructor.id} className="py-5">
          <div
            className={cn(
              "shadow-soft mobile-lg:px-5 relative min-h-151 bg-[linear-gradient(181deg,#FFF_3.72%,#93A494_180.46%)] px-10 py-16",
              i % 2 === 0 ? straight : reversed,
            )}
          >
            <div
              className={cn(
                "absolute bottom-0 left-0 flex w-full justify-end overflow-clip rounded-t-none!",
                i % 2 === 0 ? straight : reversed,
              )}
              draggable="false"
            >
              <Image
                src={instructor.image_url || InstructorProfile}
                alt={instructor.name + " Picture"}
                width={400}
                height={400}
                className="mobile-lg:-left-30 relative z-20 w-130 object-cover"
                draggable="false"
              />
            </div>

            <div className="relative z-10 pr-10">
              <div className="mb-30 pr-15">
                <h4 className="text-olive-500 max-w-85 text-[2.8rem] font-bold">
                  {instructor.name}
                </h4>
                <p className="text-beige-500 max-w-80 text-[1.8rem]">
                  {instructor.bio}
                </p>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
