import { getLandingPageInstructors } from "@/actions/landing";
import InstructorsRow from "@/components/landing-page/InstructorsRow";
import MiniSectionDivider from "@/components/landing-page/MiniSectionDivider";

export default async function InstructorsSection() {
  const instructors = await getLandingPageInstructors();

  if (instructors.length <= 0) return null;

  return (
    <section
      className="container-wide bg-[linear-gradient(180deg,#f8f9f8_0%,#FFF_100%)]"
      style={{
        paddingBottom: "150px",
      }}
    >
      <div className="title-block">
        <h2>
          طاقم التدريس <span>المتميز</span>
        </h2>
        <p className="mb-37!">
          نخبة من المعلمين المتخصصين والمؤهلين لتقديم أفضل تجربة تعليمية
        </p>
      </div>

      <InstructorsRow instructors={instructors} />

      <MiniSectionDivider />
    </section>
  );
}
