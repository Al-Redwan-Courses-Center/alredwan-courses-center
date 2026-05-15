import Button from "@/components/ui/Button";
import Link from "next/link";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="container-wide flex min-h-[50vh] flex-col items-center justify-center gap-8 py-40 text-center">
      <h1 className="heading-2">{title}</h1>
      <p className="text-[2rem] text-gray-600">
        هذه الصفحة قيد الإعداد، سنعود إليك قريباً بإذن الله.
      </p>
      <Link href="/">
        <Button size="small">العودة للرئيسية</Button>
      </Link>
    </div>
  );
}
