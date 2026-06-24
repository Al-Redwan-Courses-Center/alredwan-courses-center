import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import HeroBG from "@/assets/hero-bg.svg";
import SectionDivider from "@/components/landing-page/SectionDivider";
import Button from "@/components/ui/Button";
import { getServerSession } from "next-auth";
import Image from "next/image";
import SignupModal from "@/components/auth/SignupModal";
import ScrollReveal from "@/components/ui/ScrollReveal";

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

      <div className="relative z-10 w-full max-w-260 mr-12 lg:mr-32 xl:mr-64 ml-auto flex flex-col items-start text-right px-6 tablet:mx-auto tablet:items-center tablet:text-center">
        <ScrollReveal direction="up" delay={0.1} className="w-full flex flex-col items-start tablet:items-center">
          <h1 className="font-medad text-shadow-primary text-[8rem] md:text-[4.8rem] font-black text-gray-100 mb-4 leading-tight">
            واحة الرضوان التعليمية
          </h1>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2} className="w-full flex flex-col items-start tablet:items-center">
          <p className="text-olive-900 text-shadow-soft text-[3rem] md:text-[2.2rem] lg:text-[2.6rem] font-medium mb-12 tablet:mb-16">
            علمٌ يُزهر، وإيمانٌ يُثمر
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.3} className="w-full flex flex-col items-start tablet:items-center">
          <div className="flex gap-4 md:gap-6">
            <Button
              variant="primary"
              size="medium"
              href="/#courses"
              className="w-full sm:w-auto text-[1.6rem] md:text-[1.8rem] font-semibold py-4 px-10 md:py-5 md:px-12 flex items-center justify-center text-nowrap"
            >
              تصفح الدورات
            </Button>

            {!!session?.user ? (
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
