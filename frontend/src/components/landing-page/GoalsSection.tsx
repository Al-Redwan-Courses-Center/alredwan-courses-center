import Button from "@/components/ui/Button";

export default function GoalsSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#D1DAC7_0%,#FFF_100%)]">
      <div className="shadow-soft flex flex-col items-center rounded-tr-[19rem] rounded-bl-[19rem] px-32 py-24">
        <h2 className="font-medad text-olive-500 text-shadow-soft mb-12 text-[6.4rem]">
          واحة الرضوان التعليمية
        </h2>

        <p className="mb-36 text-center text-4xl text-gray-500">
          نُقدّم تعليمًا متكاملًا يجمع بين حفظ القرآن وتعلّم السنة، وبين العلوم
          الحديثة كالرياضيات والبرمجة واللغات، بأساليب مبتكرة تُلهم العقل وتُهذب
          الروح.
        </p>

        <div className="grid w-163 grid-cols-2 gap-9 *:px-0">
          <Button variant="primary" href="/contact-us">
            اتصل بنا الآن
          </Button>
          <Button variant="secondary" href="/courses">
            تعرف على مناهجنا
          </Button>
        </div>
      </div>
    </section>
  );
}
