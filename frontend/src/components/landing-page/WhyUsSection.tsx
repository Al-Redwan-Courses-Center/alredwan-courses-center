import Image from "next/image";
import WhyUsBG from "@/assets/why-us-bg.svg";
import FeaturesGrid from "@/components/landing-page/FeaturesGrid";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function WhyUsSection() {
  return (
    <section id="about" className="container-wide">
      <Image
        src={WhyUsBG}
        alt="Mosque Illustration"
        className="absolute right-0 bottom-0 -z-10 w-160 opacity-10"
        draggable="false"
      />

      <ScrollReveal
        direction="up"
        className="flex w-full flex-col items-center"
      >
        <div className="title-block">
          <h2>
            لماذا <span>واحة</span> الرضوان؟
          </h2>
          <p className="mb-37!">
            واحة الرضوان منارة تعليمية تجمع بين نور الدين وقوة العلم، لتنشئة جيل
            متدين وواعٍ ، قادر على خدمة دينه ووطنه
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal
        direction="up"
        delay={0.2}
        className="flex w-full flex-col items-center"
      >
        <FeaturesGrid />
      </ScrollReveal>
    </section>
  );
}
