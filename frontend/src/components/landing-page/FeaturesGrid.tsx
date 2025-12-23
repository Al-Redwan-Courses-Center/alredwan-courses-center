import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import GraduationHatIcon from "@/components/icons/GraduationHatIcon";
import HandshakeIcon from "@/components/icons/HandshakeIcon";
import MosqueIcon from "@/components/icons/MosqueIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import TechnologyIcon from "@/components/icons/TechnologyIcon";
import cn from "@/utils/cn";

const cardStyles = cn(
  "bg-olive-300 [&>svg]:drop-shadow-primary flex flex-col items-center justify-center px-15 py-12 text-gray-100 shadow-inner [&_h3]:text-3xl [&_h3]:leading-0 [&_h3]:font-semibold [&_p]:text-[1.6rem] [&>svg]:mb-5",
);
const straight = cn("rounded-tr-[10rem] rounded-bl-[10rem]");
const reversed = cn("rounded-tl-[10rem] rounded-br-[10rem] [&_p]:pr-10");

const contentContainerStyles = cn("mb-10 flex w-full items-center gap-10");

export default function FeaturesGrid() {
  return (
    <div className="grid w-full grid-cols-4 grid-rows-2 gap-13">
      <div className={cn(cardStyles, straight)}>
        <div className={cn(contentContainerStyles)}>
          <CheckBadgeIcon />
          <h3>منهج معتمد ومتطور</h3>
        </div>

        <p>
          مناهج حديثة ومعتمدة تواكب أحدث طرق التعليم العالمية مع الحفاظ على
          القيم الإسلامية
        </p>
      </div>

      <div className={cn(cardStyles, reversed)}>
        <div className={cn(contentContainerStyles)}>
          <MosqueIcon />
          <h3>بيئة إسلامية أصيلة</h3>
        </div>

        <p>
          نوفر بيئة تعليمية متميزة تجمع بين الأصالة الإسلامية و الحداثة
          التعليمية
        </p>
      </div>

      <div className={cn(cardStyles, straight)}>
        <div className={cn(contentContainerStyles)}>
          <CheckBadgeIcon />
          <h3>منهج معتمد ومتطور</h3>
        </div>

        <p>
          مناهج حديثة ومعتمدة تواكب أحدث طرق التعليم العالمية مع الحفاظ على
          القيم الإسلامية
        </p>
      </div>

      <div className={cn(cardStyles, reversed)}>
        <div className={cn(contentContainerStyles)}>
          <GraduationHatIcon />
          <h3>مدرسين مؤهلين</h3>
        </div>

        <p>
          نخبة من المعلمين المؤهلين و المتخصصين في مجالاتهم مع خبرة عملية واسعة
        </p>
      </div>

      <div className={cn(cardStyles, reversed)}>
        <div className={cn(contentContainerStyles)}>
          <TechnologyIcon />
          <h3>تقنيات حديثة</h3>
        </div>

        <p>
          استخدام أحدث التقنيات التعليمية و الوسائل التفاعلية لضمان تجربة
          تعليمية ممتعة
        </p>
      </div>

      <div className={cn(cardStyles, straight)}>
        <div className={cn(contentContainerStyles)}>
          <PeopleIcon width="3.2rem" />
          <h3>مجتمع تعليمي متكامل</h3>
        </div>

        <p>
          نبني مجتمعاً تعليمياً يشارك فيه الطلاب و أولياء الأمور في رحلة التعلم
        </p>
      </div>

      <div className={cn(cardStyles, reversed)}>
        <div className={cn(contentContainerStyles)}>
          <TechnologyIcon />
          <h3>تقنيات حديثة</h3>
        </div>

        <p>
          استخدام أحدث التقنيات التعليمية و الوسائل التفاعلية لضمان تجربة
          تعليمية ممتعة
        </p>
      </div>

      <div className={cn(cardStyles, straight)}>
        <div className={cn(contentContainerStyles)}>
          <HandshakeIcon />
          <h3>متابعة مستمرة</h3>
        </div>

        <p>نوفر متابعة مستمرة لتقدم الطلاب مع تقارير دورية لأولياء الأمور</p>
      </div>
    </div>
  );
}
