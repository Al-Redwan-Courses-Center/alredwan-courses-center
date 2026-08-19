import TestimonialsSlider from "@/components/landing-page/TestimonialsSlider";
import {
  type Testimonial,
  testimonials as testimonialsApi,
} from "@/dev-data/testimonials";

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

  return <TestimonialsSlider testimonials={testimonials} />;
}
