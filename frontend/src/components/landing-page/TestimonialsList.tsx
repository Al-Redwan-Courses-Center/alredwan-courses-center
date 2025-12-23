import AvatarProfile from "@/assets/user-avatar.png";
import HalfStarIcon from "@/components/icons/HalfStarIcon";
import StarIcon from "@/components/icons/StarIcon";
import {
  Testimonial,
  testimonials as testimonialsApi,
} from "@/dev-data/testimonials";
import cn from "@/utils/cn";
import Image from "next/image";

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

export default async function TestimonialsList() {
  const {
    data: { testimonials },
  }: { status: string; data: { testimonials: Testimonial[] } } =
    await new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "success",
            data: {
              testimonials: testimonialsApi,
            },
          }),
        1500,
      ),
    );

  return (
    <div className="flex items-center gap-14">
      {testimonials.map((testimonial, i) => (
        <div
          key={i}
          className={cn(
            "shadow-primary flex max-w-250 flex-col items-center justify-center bg-gray-100 px-25 py-8 text-[1.8rem]",
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
        </div>
      ))}
    </div>
  );
}
