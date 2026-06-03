import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "نسيت كلمة المرور | واحة الرضوان",
  description: "اطلب رابطاً لإعادة تعيين كلمة المرور الخاصة بك في واحة الرضوان.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50/50 pt-32 pb-20 px-6">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
