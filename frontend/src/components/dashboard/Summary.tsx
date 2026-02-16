import React from "react";

type SummaryItem = {
  id: string;
  label: string;
  value: number | string;
  suffix?: string;
  icon?: React.ReactNode;
};

interface SummaryProps {
  items: SummaryItem[];
}

const Summary: React.FC<SummaryProps> = ({ items }) => {
  return (
    <section aria-label="Summary statistics" className="container-wide">
      <div className="tablet:h-auto mobile:h-auto relative h-48 w-full rounded-br-2xl rounded-bl-2xl bg-linear-to-b from-zinc-100 to-stone-50 shadow-[inset_0px_4px_5.9px_0px_rgba(0,0,0,0.25)]">
        <div className="tablet:relative tablet:flex-col tablet:gap-6 tablet:py-8 mobile:relative mobile:flex-col mobile:gap-6 mobile:py-6 absolute inset-0 flex items-center justify-around gap-0 px-8">
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && (
                <div className="border-olive-100 tablet:hidden mobile:hidden h-36 w-px origin-top rotate-0 border-l" />
              )}
              <article className="flex items-center gap-6">
                <span
                  aria-hidden
                  className="text-olive-700 flex h-12 w-12 items-center justify-center"
                >
                  {item.icon}
                </span>
                <div className="flex flex-col items-start gap-4">
                  <header>
                    <h3 className="text-olive-500 tablet:text-xl mobile:text-lg font-['El_Messiri'] text-2xl font-bold">
                      {item.label}
                    </h3>
                  </header>
                  <p className="tablet:text-xl mobile:text-lg font-['El_Messiri'] text-2xl font-bold text-zinc-600">
                    <strong>
                      {item.value}
                      {item.suffix ?? ""}
                    </strong>
                  </p>
                </div>
              </article>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Summary;
