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
    <section className="tablet:min-h-[60dvh] relative flex min-h-[80dvh] items-center justify-center overflow-hidden bg-[linear-gradient(6deg,#D2DBC8_3.29%,#557767_188.07%)] pt-20">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="tablet:right-0 tablet:left-auto tablet:max-w-4/5 tablet:opacity-100 tablet:scale-x-100 absolute bottom-0 left-0 max-w-1/2 scale-x-[-1] object-cover opacity-60"
        draggable="false"
      />

      <div className="tablet:mx-auto tablet:items-center tablet:text-center relative z-10 mr-12 ml-auto flex w-full max-w-260 flex-col items-start px-6 text-right lg:mr-32 xl:mr-64">
        <ScrollReveal
          direction="up"
          delay={0.1}
          className="tablet:items-center flex w-full flex-col items-start"
        >
          <h1 className="font-medad text-shadow-primary mb-4 text-[8rem] leading-tight font-black text-gray-100 md:text-[4.8rem]">
            واحة الرضوان التعليمية
          </h1>
        </ScrollReveal>
        <ScrollReveal
          direction="up"
          delay={0.2}
          className="tablet:items-center flex w-full flex-col items-start"
        >
          <p className="text-olive-900 text-shadow-soft tablet:mb-16 mb-12 text-[3rem] font-medium md:text-[2.2rem] lg:text-[2.6rem]">
            علمٌ يُزهر، وإيمانٌ يُثمر
          </p>
        </ScrollReveal>

        <ScrollReveal
          direction="up"
          delay={0.3}
          className="tablet:items-center flex w-full flex-col items-start"
        >
          <div className="flex gap-4 md:gap-6">
            <Button
              variant="primary"
              size="medium"
              href="/#courses"
              className="flex w-full items-center justify-center px-10 py-4 text-[1.6rem] font-semibold text-nowrap sm:w-auto md:px-12 md:py-5 md:text-[1.8rem]"
            >
              تصفح الدورات
            </Button>

            {!!session?.user ? (
              <Button
                variant="secondary"
                size="medium"
                href="/dashboard"
                revert
                className="flex w-full items-center justify-center px-10 py-4 text-[1.6rem] font-semibold text-nowrap sm:w-auto md:px-12 md:py-5 md:text-[1.8rem]"
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
                    className="flex w-full items-center justify-center px-10 py-4 text-[1.6rem] font-semibold text-nowrap sm:w-auto md:px-12 md:py-5 md:text-[1.8rem]"
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
