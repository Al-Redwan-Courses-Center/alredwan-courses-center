import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
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
    title: "متابعة مستمرة",
    content: "نوفر متابعة مستمرة لتقدم الطلاب مع تقارير دورية لأولياء الأمور",
    icon: HandshakeIcon,
  },
  {
    title: "دورات متنوعة",
    content:
      "نقدم باقة واسعة من البرامج التعليمية في العلوم الإسلامية، والقرآن، واللغات، والمهارات الحياتية",
    icon: BookIcon,
  },
  {
    title: "مرونة وتكامل",
    content:
      "جداول دراسية مرنة تتناسب مع أوقات أطفالكم مع تقارير شاملة لأولياء الأمور",
    icon: CalendarIcon,
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
        "bg-olive-300 flex items-start text-gray-100 shadow-inner w-full text-right",
        reversed
          ? "rounded-tl-[10rem] tablet:rounded-tl-[5rem] rounded-br-[10rem] tablet:rounded-br-[5rem] pr-12 pt-12 pb-12 pl-18 tablet:p-8"
          : "rounded-tr-[10rem] tablet:rounded-tr-[5rem] rounded-bl-[10rem] tablet:rounded-bl-[5rem] pr-18 pt-16 pb-12 pl-12 tablet:p-8",
      )}
    >
      <div className="flex gap-6 items-start w-full">
        <Icon className="drop-shadow-primary h-12 w-12 shrink-0 mt-1" />
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl md:text-3xl font-semibold leading-tight">{title}</h3>
          <p className="text-[1.5rem] md:text-[1.6rem] leading-relaxed opacity-90">
            {content}
          </p>
        </div>
      </div>
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
          reversed={i % 4 === 1 || i % 4 === 2}
        />
      ))}
    </div>
  );
}
