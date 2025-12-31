import PictureGrid from "@/components/landing-page/PictureGrid";

export default function ActivitiesSection() {
  return (
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
  );
}
