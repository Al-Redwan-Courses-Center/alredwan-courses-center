import StatisticsRow from "@/components/landing-page/StatisticsRow";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function StatisticsSection() {
  return (
    <section className="container-wide bg-[linear-gradient(180deg,#D2DBC8_0%,#FFF_100%)]">
      <ScrollReveal
        direction="up"
        className="flex w-full flex-col items-center"
      >
        <div className="title-block">
          <h2>إنجازتنا بالأرقام</h2>
          <p>نفخر بما حققناه من نجاحات مع طلابنا عبر السنوات</p>
        </div>
      </ScrollReveal>

      <ScrollReveal
        direction="up"
        delay={0.2}
        className="flex w-full flex-col items-center"
      >
        <StatisticsRow />
      </ScrollReveal>
    </section>
  );
}
