import PictureGrid from "@/components/landing-page/PictureGrid";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function ActivitiesSection() {
  return (
    <section
      id="activities"
      className="mobile-lg:px-15! flex flex-col items-center px-28!"
    >
      <ScrollReveal
        direction="up"
        className="flex w-full flex-col items-center"
      >
        <div className="title-block">
          <h2>
            أنشطتنا <span>المتنوعة</span>
          </h2>

          <p className="mb-36 max-w-200 text-center text-4xl text-gray-600">
            نقدم باقة شاملة من الأنشطة التعليمية والترفيهية التي تساهم في بناء
            شخصية الطفل المسلم المتكاملة
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal
        direction="up"
        delay={0.2}
        amount={0.1}
        className="flex w-full flex-col items-center"
      >
        <PictureGrid />
      </ScrollReveal>
    </section>
  );
}
