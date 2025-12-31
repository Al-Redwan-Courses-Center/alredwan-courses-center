import ActivitiesSection from "@/components/landing-page/ActivitiesSection";
import CallToActionSection from "@/components/landing-page/CallToActionSection";
import CoursesSection from "@/components/landing-page/CoursesSection";
import GoalsSection from "@/components/landing-page/GoalsSection";
import HeroSection from "@/components/landing-page/HeroSection";
import InstructorsSection from "@/components/landing-page/InstructorsSection";
import StatisticsSection from "@/components/landing-page/StatisticsSection";
import TestimonialsSection from "@/components/landing-page/TestimonialsSection";
import WhyUsSection from "@/components/landing-page/WhyUsSection";

export default function Home() {
  return (
    <main className="tablet:[&>section]:p-28 [&_h2>span]:text-beige-500 [&>section]:px-128 [&>section]:py-28">
      <HeroSection />
      <StatisticsSection />
      <WhyUsSection />
      <InstructorsSection />
      <GoalsSection />
      <ActivitiesSection />
      <CoursesSection />
      <TestimonialsSection />
      <CallToActionSection />
    </main>
  );
}
