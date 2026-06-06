import Image from "next/image";
import HeroBG from "@/assets/hero-bg.svg";
import Button from "@/components/ui/Button";
import PhoneIcon from "@/components/icons/PhoneIcon";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import EmailIcon from "@/components/icons/EmailIcon";
import SectionDivider from "@/components/landing-page/SectionDivider";
import SignupModal from "@/components/auth/SignupModal";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function CallToActionSection() {
  return (
    <section className="tablet:h-[60dvh] tablet:items-start relative flex h-[calc(100dvh-6.5rem)] items-center bg-[linear-gradient(0deg,#D2DBC8_-3.15%,#557767_204.81%)]">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="absolute right-0 bottom-0 max-w-1/2 tablet:max-w-full opacity-60 tablet:opacity-20 object-cover"
        draggable="false"
      />

      <ScrollReveal direction="up" className="w-full flex flex-col items-start tablet:items-center">
        <div className="relative z-10 mr-auto tablet:mx-auto tablet:text-center flex flex-col items-start tablet:items-center text-gray-100 px-6 lg:pl-32">
          <h2 className="text-shadow-primary mb-9 max-w-170 text-8xl mobile-lg:text-6xl font-bold">
            <span className="text-beige-500">ابدأ</span> رحلة التعلم مع أطفالك
            اليوم
          </h2>

          <p className="mb-9 max-w-220 text-4xl mobile-lg:text-2xl">
            انضم إلى أكثر من 500 عائلة اختارت واحة الرضوان لتعليم أطفالهم القرآن
            الكريم والعلوم الإسلامية
          </p>

          <div className="mb-12 grid w-fit grid-cols-2 mobile-lg:grid-cols-1 gap-6">
            <SignupModal
              trigger={
                <Button variant="primary" size="medium">
                  سجل الآن
                </Button>
              }
            />

            <SignupModal
              trigger={
                <Button variant="secondary" size="medium" revert>
                  جرب درس تجريبي
                </Button>
              }
            />
          </div>

          <ul className="text-olive-500 flex items-center tablet:flex-col tablet:items-center gap-11 mobile-lg:gap-4 [&_span]:text-[1.4rem] [&>li]:flex [&>li]:items-center [&>li]:gap-3">
            <li>
              <PhoneIcon />
              <span>٢٠١٢٣٤٥٦٧٨٩٠+</span>
            </li>

            <li>
              <WhatsappIcon />
              <span>واتساب مباشر</span>
            </li>

            <li>
              <EmailIcon />
              <span>info@alredwan.edu</span>
            </li>
          </ul>
        </div>
      </ScrollReveal>

      <SectionDivider startColor="#D2DBC8" endColor="#2E4238" />
    </section>
  );
}
