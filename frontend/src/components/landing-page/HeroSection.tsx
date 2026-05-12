import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import HeroBG from "@/assets/hero-bg.svg";
import SectionDivider from "@/components/landing-page/SectionDivider";
import Button from "@/components/ui/Button";
import { getServerSession } from "next-auth";
import Image from "next/image";
import SignupModal from "@/components/auth/SignupModal";

export default async function HeroSection() {
  const session = await getServerSession(authConfig);

  return (
    <section className="relative flex min-h-[80dvh] tablet:min-h-[60dvh] items-center justify-center bg-[linear-gradient(6deg,#D2DBC8_3.29%,#557767_188.07%)] overflow-hidden pt-20">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="absolute right-0 bottom-0 max-w-full tablet:max-w-4/5 object-cover opacity-60 tablet:opacity-100"
        draggable="false"
      />

      <div className="relative z-10 w-full flex flex-col items-center tablet:items-start tablet:mr-auto text-center tablet:text-right px-6">
        <h1 className="font-medad text-shadow-primary text-[4rem] md:text-[6rem] lg:text-[7.2rem] leading-tight text-gray-100 mb-4">
          واحة الرضوان التعليمية
        </h1>
        <p className="text-olive-900 text-shadow-soft text-[1.8rem] md:text-[2.4rem] lg:text-[3.2rem] mb-12 tablet:mb-16">
          علمٌ يُزهر، وإيمانٌ يُثمر
        </p>

        <div className="grid w-fit grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Button variant="primary" size="medium" className="w-full sm:w-auto">
            تصفح الدورات
          </Button>

          {!!session?.user ? (
            <Button variant="secondary" size="medium" href="/dashboard" revert className="w-full sm:w-auto">
              لوحة التحكم
            </Button>
          ) : (
            <SignupModal
              trigger={
                <Button variant="secondary" size="medium" revert className="w-full sm:w-auto">
                  سجل الآن
                </Button>
              }
            />
          )}
        </div>
      </div>

      <SectionDivider startColor="#D2DBC8" endColor="#2E4238" />
    </section>
  );
}
