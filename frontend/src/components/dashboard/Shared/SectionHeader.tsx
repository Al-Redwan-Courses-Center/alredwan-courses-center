import { toHindiDigits } from "@/lib/utils";

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <header className="mobile:mb-4 mb-6">
      <h2 className="tablet:text-3xl mobile:text-2xl text-olive-700 text-4xl font-bold">
        {title}
        {count !== undefined && (
          <span className="bg-olive-100 text-olive-700 tablet:mr-3 tablet:rounded-[0.6rem_0] tablet:px-4 tablet:py-1.5 tablet:text-base mobile:mr-2 mobile:rounded-[0.5rem_0] mobile:px-3 mobile:py-1 mobile:text-sm mr-4 inline-block rounded-[0.8rem_0] px-5 py-2 text-2xl font-bold">
            {toHindiDigits(count)} طلب
          </span>
        )}
      </h2>
    </header>
  );
}

export default SectionHeader;
