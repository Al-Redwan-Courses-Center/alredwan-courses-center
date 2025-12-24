import HeroBG from "@/assets/hero-bg.svg";
import WhyUsBG from "@/assets/why-us-bg.svg";
import CoursesList from "@/components/courses/CoursesList";
import EmailIcon from "@/components/icons/EmailIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import FeaturesGrid from "@/components/landing-page/FeaturesGrid";
import InstructorsRow from "@/components/landing-page/InstructorsRow";
import MiniSectionDivider from "@/components/landing-page/MiniSectionDivider";
import PictureGrid from "@/components/landing-page/PictureGrid";
import SecitonDivider from "@/components/landing-page/SecitonDivider";
import StatisticsRow from "@/components/landing-page/StatisticsRow";
import TestimonialsList from "@/components/landing-page/TestimonialsList";
import Button from "@/components/ui/Button";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="[&_h2>span]:text-beige-500 [&>section]:px-128 [&>section]:py-28">
      <section className="relative flex h-[calc(100dvh-6.5rem)] items-center bg-[linear-gradient(6deg,#D2DBC8_3.29%,#557767_188.07%)]">
        <Image
          src={HeroBG}
          alt="Hero Background"
          priority
          className="absolute right-0 bottom-0 object-cover"
          draggable="false"
        />

        <div className="relative z-10 mr-auto">
          <h1 className="font-medad text-shadow-primary text-[7.2rem] leading-none text-gray-100">
            واحة الرضوان التعليمية
          </h1>
          <p className="text-olive-900 text-shadow-soft mb-32 text-[3.2rem]">
            علمٌ يُزهر، وإيمانٌ يُثمر
          </p>

          <div className="grid w-fit grid-cols-2 gap-6">
            <Button variant="primary" size="m" href="/courses">
              تصفح الدورات
            </Button>

            <Button variant="secondary" size="m" href="/signup">
              سجل الآن
            </Button>
          </div>
        </div>

        <SecitonDivider startColor="#D2DBC8" endColor="#2E4238" />
      </section>

      <section className="container-wide bg-[linear-gradient(180deg,#D2DBC8_0%,#FFF_100%)]">
        <div className="title-block">
          <h2>إنجازتنا بالأرقام</h2>
          <p>نفخر بما حققناه من نجاحات مع طلابنا عبر السنوات</p>
        </div>

        <StatisticsRow />
      </section>

      <section className="container-wide">
        <Image
          src={WhyUsBG}
          alt="Mosque Illustration"
          className="absolute right-0 bottom-0 -z-10 w-160 opacity-10"
          draggable="false"
        />

        <div className="title-block">
          <h2>
            لماذا <span>واحة</span> الرضوان؟
          </h2>
          <p className="mb-37!">
            واحة الرضوان منارة تعليمية تجمع بين نور الدين وقوة العلم، لتنشئة جيل
            متدين وواعٍ ، قادر على خدمة دينه ووطنه
          </p>
        </div>

        <FeaturesGrid />
      </section>

      <section className="container-wide bg-[linear-gradient(180deg,#f8f9f8_0%,#FFF_100%)]">
        <div className="title-block">
          <h2>
            طاقم التدريس <span>المتميز</span>
          </h2>
          <p className="mb-37!">
            نخبة من المعلمين المتخصصين والمؤهلين لتقديم أفضل تجربة تعليمية
          </p>
        </div>

        <InstructorsRow />

        <MiniSectionDivider />
      </section>

      <section className="bg-[linear-gradient(180deg,#D1DAC7_0%,#FFF_100%)]">
        <div className="shadow-soft flex flex-col items-center rounded-tr-[19rem] rounded-bl-[19rem] px-32 py-24">
          <h2 className="font-medad text-olive-500 text-shadow-soft mb-12 text-[6.4rem]">
            واحة الرضوان التعليمية
          </h2>

          <p className="mb-36 text-center text-4xl text-gray-500">
            نُقدّم تعليمًا متكاملًا يجمع بين حفظ القرآن وتعلّم السنة، وبين
            العلوم الحديثة كالرياضيات والبرمجة واللغات، بأساليب مبتكرة تُلهم
            العقل وتُهذب الروح.
          </p>

          <div className="grid w-163 grid-cols-2 gap-9 *:px-0">
            <Button variant="primary" href="/contact-us">
              اتصل بنا الآن
            </Button>
            <Button variant="secondary" href="/courses">
              تعرف على مناهجنا
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center px-28!">
        <div className="title-block">
          <h2>
            أنشطتنا <span>المتنوعة</span>
          </h2>

          <p className="mb-36 max-w-200 text-center text-4xl text-gray-500">
            نقدم باقة شاملة من الأنشطة التعليمية والترفيهية التي تساهم في بناء
            شخصية الطفل المسلم المتكاملة
          </p>
        </div>

        <PictureGrid />
      </section>

      <section className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_0%,#F3F6F4_100%)]">
        <div className="title-block">
          <h2>
            الدورات <span>المميزة</span>
          </h2>

          <p className="mb-36 text-center text-4xl text-gray-500">
            اكتشف أفضل الدورات التعليمية المصممة خصيصاً لتطوير مهارات الأطفال
            والشباب
          </p>
        </div>

        <CoursesList />

        <Button variant="primary" href="/courses" className="self-start">
          تصفح الدورات
        </Button>
      </section>

      <section className="flex flex-col items-center bg-[linear-gradient(180deg,#FFF_-12.13%,#95AA98_100%)] py-60!">
        <div className="title-block">
          <h2>
            <span>آراء</span> أولياء الامور و طلابنا
          </h2>
          <p>شاهد ما يقوله طلابنا وأولياء أمورهم عن تجربتهم معنا</p>
        </div>

        <TestimonialsList />
      </section>

      <section className="relative flex h-[calc(100dvh-6.5rem)] items-center bg-[linear-gradient(0deg,#D2DBC8_-3.15%,#557767_204.81%)]">
        <Image
          src={HeroBG}
          alt="Hero Background"
          priority
          className="absolute right-0 bottom-0 object-cover"
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
            <Button variant="primary" size="m" href="/signup">
              سجل الآن
            </Button>

            <Button variant="secondary" size="m" href="/signup">
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

        <SecitonDivider startColor="#D2DBC8" endColor="#2E4238" />
      </section>
    </main>
  );
}
