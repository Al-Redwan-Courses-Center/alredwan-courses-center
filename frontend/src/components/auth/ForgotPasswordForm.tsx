"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import FieldSetInput from "@/components/ui/FieldSetInput";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/actions/auth";
import toast from "react-hot-toast";
import Link from "next/link";

interface ForgotPasswordInputs {
  phone_number1: string;
}

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInputs>();

  const onSubmit: SubmitHandler<ForgotPasswordInputs> = async (data) => {
    setIsLoading(true);
    const { error } = await resetPassword(data);

    if (error) {
      toast.error(
        "حدث خطأ أثناء إرسال طلب إعادة التعيين. تأكد من صحة رقم الهاتف.",
      );
      setIsLoading(false);
    } else {
      setIsSent(true);
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="shadow-soft rounded-[2rem] border border-white/40 bg-white/50 p-10 text-center backdrop-blur-md">
        <h3 className="text-olive-800 mb-4 text-3xl font-bold">
          تم إرسال الطلب!
        </h3>
        <p className="mb-8 text-xl text-gray-600">
          إذا كان الحساب موجوداً، فستصلك رسالة تحتوي على تعليمات إعادة تعيين
          كلمة المرور.
        </p>
        <Button href="/?login=true" className="px-10 py-3">
          العودة لتسجيل الدخول
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="shadow-soft mx-auto flex w-full max-w-md flex-col gap-8 rounded-[2rem] border border-white/40 bg-white/50 p-10 backdrop-blur-md"
    >
      <div className="mb-4 text-center">
        <h3 className="text-olive-800 text-3xl font-bold">نسيت كلمة المرور؟</h3>
        <p className="mt-2 text-xl text-gray-500">
          أدخل رقم الهاتف المسجل وسنرسل لك رابطاً لإعادة التعيين.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput
          label="رقم الهاتف (WhatsApp)"
          placeholder="+201234567890"
          registerReturn={register("phone_number1", {
            required: "هذا الحقل مطلوب",
            pattern: {
              value: /^\+?[1-9]\d{1,14}$/,
              message:
                "يرجى إدخال رقم هاتف صحيح بصيغة E.164 (مثلاً: +201234567890)",
            },
          })}
        />
        {errors.phone_number1 && (
          <span className="px-4 text-xl text-red-800">
            {errors.phone_number1.message}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <Button
          type="submit"
          loading={isLoading}
          className="w-full py-5 text-2xl"
        >
          إرسال رابط التعيين
        </Button>
        <Link
          href="/?login=true"
          className="text-olive-600 hover:text-olive-700 text-center text-xl font-bold"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
