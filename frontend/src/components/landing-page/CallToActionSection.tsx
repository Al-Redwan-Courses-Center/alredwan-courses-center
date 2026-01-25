import Image from "next/image";
import HeroBG from "@/assets/hero-bg.svg";
import Button from "@/components/ui/Button";
import PhoneIcon from "@/components/icons/PhoneIcon";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import EmailIcon from "@/components/icons/EmailIcon";

export default function CallToActionSection() {
  return (
    <section className="tablet:h-[60dvh] tablet:items-start relative flex h-[calc(100dvh-6.5rem)] items-center bg-[linear-gradient(0deg,#D2DBC8_-3.15%,#557767_204.81%)]">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="absolute right-0 bottom-0 max-w-4/5 object-cover"
        draggable="false"
      />

      <div className="relative z-10 mr-auto text-gray-100">
        <h2 className="text-shadow-primary mb-9 max-w-170 text-8xl font-bold">
          <span className="text-beige-500">ابدأ</span> رحلة التعلم مع أطفالك
          اليوم
        </h2>

        <p className="mb-9 max-w-220 text-4xl">
          انضم إلى أكثر من 500 عائلة اختارت واحة الرضوان لتعليم أطفالهم القرآن
          الكريم والعلوم الإسلامية
        </p>

        <div className="mb-12 grid w-fit grid-cols-2 gap-6">
          <Button variant="primary" size="medium" href="/signup">
            سجل الآن
          </Button>

          <Button variant="secondary" size="medium" href="/signup">
            جرب درس تجريبي
          </Button>
        </div>

        <ul className="text-olive-500 flex items-center gap-11 [&_span]:text-[1.4rem] [&>li]:flex [&>li]:items-center [&>li]:gap-3">
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
    </section>
  );
}
