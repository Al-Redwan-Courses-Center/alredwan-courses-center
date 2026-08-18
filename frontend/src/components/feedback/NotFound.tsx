import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="font-messiri text-olive-500 text-9xl font-bold">404</h1>

      <h2 className="text-olive-600 text-3xl font-bold">
        عذراً، هذه الصفحة غير موجودة
      </h2>

      <p className="text-olive-500 max-w-md text-xl">
        يبدو أنك وصلت إلى رابط غير صحيح أو تم حذف الصفحة التي تبحث عنها.
      </p>

      <div className="mt-8">
        <Button href="/" variant="primary" size="medium">
          العودة للرئيسية
        </Button>
      </div>
    </main>
  );
}
