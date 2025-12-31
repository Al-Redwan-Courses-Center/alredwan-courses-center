"use client";

import { useMediaQuery } from "usehooks-ts";
import Image from "next/image";
import AvatarProfile from "@/assets/user-avatar.png";
import { Testimonial } from "@/dev-data/testimonials";
import StarIcon from "@/components/icons/StarIcon";
import HalfStarIcon from "@/components/icons/HalfStarIcon";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { cn } from "@/lib/utils";

function renderRating(rating: number) {
  const flooredRating = Math.floor(rating);
  const starsArray: React.ReactNode[] = [];

  for (let i = 0; i < flooredRating; i++) {
    starsArray.push(<StarIcon key={`full-${i}`} className="text-beige-500" />);
  }

  if (rating - flooredRating > 0)
    starsArray.push(<HalfStarIcon key={`half`} className="text-beige-500" />);

  for (let i = starsArray.length; i < 5; i++) {
    starsArray.push(<StarIcon key={`empty-${i}`} className="text-gray-500" />);
  }

  return starsArray;
}

const navigationButtonStyles = cn(
  "font-medad absolute top-1/2 transform-[translateY(-50%)] text-7xl font-bold",
);

export default function TestimonialsSlider({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const isMobile = useMediaQuery("(max-width: 900px)");

  return (
    <div className="relative grid">
      <button
        className={cn(
          navigationButtonStyles,
          "swiper-next tablet:-left-20 -left-30",
        )}
      >
        {">"}
      </button>

      <Swiper
        modules={[Autoplay, Navigation]}
        slidesPerView={isMobile ? 1 : 3}
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
        {testimonials.map((testimonial, i) => (
          <SwiperSlide
            key={i}
            className={cn(
              "shadow-primary w-full bg-gray-100 px-25 py-8 text-[1.8rem]",
              i % 2 === 0 ? "rounded-[0_13rem]" : "rounded-[13rem_0]",
            )}
          >
            <div className="mb-11 flex items-center gap-6 self-start">
              <Image
                src={AvatarProfile}
                alt="User Profile"
                className="h-auto w-20 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-6">
                  <h3 className="text-olive-500 text-[2.4rem] font-bold">
                    {testimonial.name}
                  </h3>
                  <span className="text-gray-500">{testimonial.role}</span>
                </div>

                <div className="flex items-center gap-1">
                  {renderRating(testimonial.rating)}
                </div>
              </div>
            </div>

            <p>{testimonial.content}</p>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        className={cn(
          navigationButtonStyles,
          "swiper-prev tablet:-right-20 -right-30",
        )}
      >
        {"<"}
      </button>
    </div>
  );
}
