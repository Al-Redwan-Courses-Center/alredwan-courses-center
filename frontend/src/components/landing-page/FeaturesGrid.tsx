import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import GraduationHatIcon from "@/components/icons/GraduationHatIcon";
import HandshakeIcon from "@/components/icons/HandshakeIcon";
import MosqueIcon from "@/components/icons/MosqueIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import TechnologyIcon from "@/components/icons/TechnologyIcon";
import { cn } from "@/lib/utils";
import React, { ComponentProps } from "react";

const featureCardsConfig = [
  {
    title: "منهج معتمد ومتطور",
    content:
      "مناهج حديثة ومعتمدة تواكب أحدث طرق التعليم العالمية مع الحفاظ على القيم الإسلامية",
    icon: CheckBadgeIcon,
  },
  {
    title: "بيئة إسلامية أصيلة",
    content:
      "نوفر بيئة تعليمية متميزة تجمع بين الأصالة الإسلامية و الحداثة التعليمية",
    icon: MosqueIcon,
  },
  {
    title: "منهج معتمد ومتطور",
    content:
      "مناهج حديثة ومعتمدة تواكب أحدث طرق التعليم العالمية مع الحفاظ على القيم الإسلامية",
    icon: CheckBadgeIcon,
  },
  {
    title: "مدرسين مؤهلين",
    content:
      "نخبة من المعلمين المؤهلين و المتخصصين في مجالاتهم مع خبرة عملية واسعة",
    icon: GraduationHatIcon,
  },
  {
    title: "تقنيات حديثة",
    content:
      "استخدام أحدث التقنيات التعليمية و الوسائل التفاعلية لضمان تجربة تعليمية ممتعة",
    icon: TechnologyIcon,
  },
  {
    title: "مجتمع تعليمي متكامل",
    content:
      "نبني مجتمعاً تعليمياً يشارك فيه الطلاب و أولياء الأمور في رحلة التعلم",
    icon: PeopleIcon,
  },
  {
    title: "تقنيات حديثة",
    content:
      "استخدام أحدث التقنيات التعليمية و الوسائل التفاعلية لضمان تجربة تعليمية ممتعة",
    icon: TechnologyIcon,
  },
  {
    title: "متابعة مستمرة",
    content: "نوفر متابعة مستمرة لتقدم الطلاب مع تقارير دورية لأولياء الأمور",
    icon: HandshakeIcon,
  },
];

function FeatureCard({
  title,
  content,
  icon: Icon,
  reversed = false,
}: {
  title: string;
  content: string;
  icon: React.FC<ComponentProps<"svg">>;
  reversed?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-olive-300 flex flex-col items-center justify-center px-15 tablet:px-8 py-12 tablet:py-8 text-gray-100 shadow-inner",
        reversed
          ? "rounded-tl-[10rem] tablet:rounded-tl-[5rem] rounded-br-[10rem] tablet:rounded-br-[5rem] [&_p]:pr-10 tablet:[&_p]:pr-4"
          : "rounded-tr-[10rem] tablet:rounded-tr-[5rem] rounded-bl-[10rem] tablet:rounded-bl-[5rem]",
      )}
    >
      <div className="mb-5 flex w-full items-center gap-10">
        <Icon className="drop-shadow-primary mb-5 h-14 w-14" />
        <h3 className="text-3xl font-semibold">{title}</h3>
      </div>

      <p className="text-[1.6rem]">{content}</p>
    </div>
  );
}

export default function FeaturesGrid() {
  return (
    <div className="grid w-full grid-cols-2 mobile-lg:grid-cols-1 gap-13 tablet:gap-8">
      {featureCardsConfig.map((feature, i) => (
        <FeatureCard
          key={i}
          title={feature.title}
          content={feature.content}
          icon={feature.icon}
          reversed={i > 3 ? i % 2 === 0 : i % 2 !== 0}
        />
      ))}
    </div>
  );
}
