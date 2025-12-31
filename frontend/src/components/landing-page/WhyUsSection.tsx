import Image from "next/image";
import WhyUsBG from "@/assets/why-us-bg.svg";
import FeaturesGrid from "@/components/landing-page/FeaturesGrid";

export default function WhyUsSection() {
  return (
    <section className="container-wide">
      <Image
        src={WhyUsBG}
        alt="Mosque Illustration"
        className="absolute right-0 bottom-0 -z-10 w-160 opacity-10"
        draggable="false"
      />

      <div className="title-block">
        <h2>
          لماذا <span>واحة</span> الرضوان؟
        </h2>
        <p className="mb-37!">
          واحة الرضوان منارة تعليمية تجمع بين نور الدين وقوة العلم، لتنشئة جيل
          متدين وواعٍ ، قادر على خدمة دينه ووطنه
        </p>
      </div>

      <FeaturesGrid />
    </section>
  );
}
