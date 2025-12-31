import TestimonialsList from "@/components/landing-page/TestimonialsList";

export default function TestimonialsSection() {
  return (
    <section className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_-12.13%,#95AA98_100%)] py-60!">
      <div className="title-block">
        <h2>
          <span>آراء</span> أولياء الامور و طلابنا
        </h2>
        <p>شاهد ما يقوله طلابنا وأولياء أمورهم عن تجربتهم معنا</p>
      </div>

      <TestimonialsList />
    </section>
  );
}
