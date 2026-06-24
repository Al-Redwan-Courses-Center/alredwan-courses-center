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
    <section id="contact-us" className="tablet:h-[60dvh] tablet:items-start relative flex h-[calc(100dvh-6.5rem)] items-center bg-[linear-gradient(0deg,#D2DBC8_-3.15%,#557767_204.81%)]">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="absolute right-0 bottom-0 max-w-full opacity-35 tablet:opacity-20 object-cover"
        draggable="false"
      />

      <ScrollReveal direction="up" className="w-full flex flex-col items-center">
        <div className="relative z-10 mx-auto text-center flex flex-col items-center text-gray-100 px-6 max-w-4xl">
          <h2 className="text-shadow-primary mb-9 max-w-170 text-8xl mobile-lg:text-6xl font-bold">
            <span className="text-beige-500">ابدأ</span> رحلة التعلم مع أطفالك
            اليوم
          </h2>

          <p className="mb-9 max-w-220 text-4xl mobile-lg:text-2xl">
            انضم إلى أكثر من 500 عائلة اختارت واحة الرضوان لتعليم أطفالهم القرآن
            الكريم والعلوم الإسلامية
          </p>

          <div className="mb-12">
            <SignupModal
              trigger={
                <Button variant="primary" size="medium">
                  سجل الآن
                </Button>
              }
            />
          </div>

          <ul className="text-olive-500 flex items-center tablet:flex-col tablet:items-center gap-11 mobile-lg:gap-4 [&_span]:text-[1.4rem] [&>li]:flex [&>li]:items-center [&>li]:gap-3">
            <li>
              <a
                href="tel:+201234567890"
                className="flex items-center gap-3 hover:text-white transition-colors duration-200"
              >
                <PhoneIcon />
                <span>٢٠١٢٣٤٥٦٧٨٩٠+</span>
              </a>
            </li>

            <li>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors duration-200"
              >
                <WhatsappIcon />
                <span>واتساب مباشر</span>
              </a>
            </li>

            <li>
              <a
                href="mailto:info@alredwan.edu"
                className="flex items-center gap-3 hover:text-white transition-colors duration-200"
              >
                <EmailIcon />
                <span>info@alredwan.edu</span>
              </a>
            </li>
          </ul>
        </div>
      </ScrollReveal>

      <SectionDivider startColor="#D2DBC8" endColor="#2E4238" />
    </section>
  );
}
