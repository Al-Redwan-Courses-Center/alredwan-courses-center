import Image from "next/image";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import HeroBG from "@/assets/hero-bg.svg";
import SignupModal from "@/components/auth/SignupModal";
import SectionDivider from "@/components/landing-page/SectionDivider";
import Button from "@/components/ui/Button";

import ScrollReveal from "@/components/ui/ScrollReveal";
import { Sparkles, MonitorPlay, ArrowLeft } from "lucide-react";

export default async function HeroSection() {
  const session = await getServerSession(authConfig);

  return (
    <section className="relative flex min-h-[80dvh] tablet:min-h-[60dvh] items-center justify-center bg-[linear-gradient(6deg,#D2DBC8_3.29%,#557767_188.07%)] overflow-hidden pt-20">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="absolute left-0 bottom-0 max-w-1/2 opacity-60 object-cover tablet:right-0 tablet:left-auto tablet:max-w-4/5 tablet:opacity-100 scale-x-[-1] tablet:scale-x-100"
        draggable="false"
      />

      {/* New Online Courses Floating Badge (Desktop/Tablet Only) */}
      <div className="absolute left-48 desktop-sm:left-32 laptop:left-12 laptop-sm:left-6 top-[45%] -translate-y-1/2 z-20 flex tablet:hidden flex-col items-center">
        <ScrollReveal direction="left" delay={0.6}>
          <a 
            href="#courses" 
            className="group relative flex flex-col items-center p-12 rounded-[2.5rem] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:bg-white/20 hover:scale-110 hover:-translate-y-4 transition-all duration-500"
          >
            {/* "New" Tag */}
            <div className="absolute -top-6 -right-6 bg-yellow-400 text-yellow-900 text-xl font-bold px-6 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
              <Sparkles size={24} />
              <span>إضافة جديدة</span>
            </div>
            
            {/* Icon */}
            <div className="bg-white/20 p-8 rounded-full mb-6 group-hover:bg-beige-500/90 transition-colors duration-500 shadow-inner">
              <MonitorPlay size={72} className="text-white" strokeWidth={1.5} />
            </div>
            
            {/* Text */}
            <h3 className="text-5xl font-black text-white mb-3 font-medad tracking-wide text-shadow-sm">
              الدورات الإلكترونية
            </h3>
            <p className="text-gray-100 text-2xl font-medium text-center mb-8 max-w-[280px]">
              تعلم عن بعد وفي أي وقت بكل سهولة
            </p>
            
            {/* Call to Action */}
            <div className="flex items-center gap-3 text-beige-300 font-bold text-3xl group-hover:text-white transition-colors">
              <span>اكتشف الآن</span>
              <ArrowLeft size={28} className="group-hover:-translate-x-4 transition-transform duration-300" />
            </div>
          </a>
        </ScrollReveal>
      </div>

      <div className="relative z-10 w-full max-w-260 mr-12 lg:mr-32 xl:mr-64 ml-auto flex flex-col items-start text-right px-6 tablet:mx-auto tablet:items-center tablet:text-center">
        <ScrollReveal
          direction="up"
          delay={0.1}
          className="w-full flex flex-col items-start tablet:items-center"
        >
          <h1 className="font-medad text-shadow-primary text-[8rem] md:text-[4.8rem] font-black text-gray-100 mb-4 leading-tight">
            واحة الرضوان التعليمية
          </h1>
        </ScrollReveal>
        <ScrollReveal
          direction="up"
          delay={0.2}
          className="w-full flex flex-col items-start tablet:items-center"
        >
          <p className="text-olive-900 text-shadow-soft text-[3rem] md:text-[2.2rem] lg:text-[2.6rem] font-medium mb-12 tablet:mb-16">
            علمٌ يُزهر، وإيمانٌ يُثمر
          </p>
        </ScrollReveal>

        <ScrollReveal
          direction="up"
          delay={0.3}
          className="w-full flex flex-col items-start tablet:items-center"
        >
          <div className="flex gap-4 md:gap-6">
            <Button
              variant="primary"
              size="medium"
              href="/#courses"
              className="w-full sm:w-auto text-[1.6rem] md:text-[1.8rem] font-semibold py-4 px-10 md:py-5 md:px-12 flex items-center justify-center text-nowrap"
            >
              تصفح الدورات
            </Button>

            {session?.user ? (
              <Button
                variant="secondary"
                size="medium"
                href="/dashboard"
                revert
                className="w-full sm:w-auto text-[1.6rem] md:text-[1.8rem] font-semibold py-4 px-10 md:py-5 md:px-12 flex items-center justify-center text-nowrap"
              >
                لوحة التحكم
              </Button>
            ) : (
              <SignupModal
                trigger={
                  <Button
                    variant="secondary"
                    size="medium"
                    revert
                    className="w-full sm:w-auto text-[1.6rem] md:text-[1.8rem] font-semibold py-4 px-10 md:py-5 md:px-12 flex items-center justify-center text-nowrap"
                  >
                    سجل الآن
                  </Button>
                }
              />
            )}
          </div>
        </ScrollReveal>
      </div>

      <SectionDivider startColor="#D2DBC8" endColor="#2E4238" />
    </section>
  );
}
