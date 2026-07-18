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
    <section
      id="contact-us"
      className="tablet:h-[60dvh] tablet:items-start relative flex h-[calc(100dvh-6.5rem)] items-center bg-[linear-gradient(0deg,#D2DBC8_-3.15%,#557767_204.81%)]"
    >
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="tablet:opacity-20 absolute right-0 bottom-0 max-w-full object-cover opacity-35"
        draggable="false"
      />

      <ScrollReveal
        direction="up"
        className="flex w-full flex-col items-center"
      >
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center text-gray-100">
          <h2 className="text-shadow-primary mobile-lg:text-6xl mb-9 max-w-170 text-8xl font-bold">
            <span className="text-beige-500">ابدأ</span> رحلة التعلم مع أطفالك
            اليوم
          </h2>

          <p className="mobile-lg:text-2xl mb-9 max-w-220 text-4xl">
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

          <ul className="text-olive-500 tablet:flex-col tablet:items-center mobile-lg:gap-4 flex items-center gap-11 [&_span]:text-[1.4rem] [&>li]:flex [&>li]:items-center [&>li]:gap-3">
            <li>
              <a
                href="tel:+201234567890"
                className="flex items-center gap-3 transition-colors duration-200 hover:text-white"
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
                className="flex items-center gap-3 transition-colors duration-200 hover:text-white"
              >
                <WhatsappIcon />
                <span>واتساب مباشر</span>
              </a>
            </li>

            <li>
              <a
                href="mailto:info@alredwan.edu"
                className="flex items-center gap-3 transition-colors duration-200 hover:text-white"
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
