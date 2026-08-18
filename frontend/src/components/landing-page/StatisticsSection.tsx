import StatisticsRow from "@/components/landing-page/StatisticsRow";

export default function StatisticsSection() {
  return (
    <section className="container-wide bg-[linear-gradient(180deg,#D2DBC8_0%,#FFF_100%)]">
      <div className="title-block">
        <h2>إنجازتنا بالأرقام</h2>
        <p>نفخر بما حققناه من نجاحات مع طلابنا عبر السنوات</p>
      </div>

      <StatisticsRow />
    </section>
  );
}
