import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import HeroBG from "@/assets/hero-bg.svg";
import SectionDivider from "@/components/landing-page/SectionDivider";
import Button from "@/components/ui/Button";
import { getServerSession } from "next-auth";
import Image from "next/image";

export default async function HeroSection() {
  const session = await getServerSession(authConfig);

  return (
    <section className="tablet:h-[60dvh] relative flex h-[calc(100dvh-6.5rem)] items-center justify-center bg-[linear-gradient(6deg,#D2DBC8_3.29%,#557767_188.07%)]">
      <Image
        src={HeroBG}
        alt="Hero Background"
        priority
        className="absolute right-0 bottom-0 max-w-4/5 object-cover"
        draggable="false"
      />

      <div className="relative -top-25 z-10 mr-auto">
        <h1 className="font-medad text-shadow-primary text-[7.2rem] leading-none text-gray-100">
          واحة الرضوان التعليمية
        </h1>
        <p className="text-olive-900 text-shadow-soft tablet:mb-16 mb-32 text-[3.2rem]">
          علمٌ يُزهر، وإيمانٌ يُثمر
        </p>

        <div className="grid w-fit grid-cols-2 gap-6">
          <Button variant="primary" size="medium" href="/courses">
            تصفح الدورات
          </Button>

          {!!session?.user ? (
            <Button variant="secondary" size="medium" href="/dashboard">
              لوحة التحكم
            </Button>
          ) : (
            <Button variant="secondary" size="medium" href="/signup">
              سجل الآن
            </Button>
          )}
        </div>
      </div>

      <SectionDivider startColor="#D2DBC8" endColor="#2E4238" />
    </section>
  );
}
