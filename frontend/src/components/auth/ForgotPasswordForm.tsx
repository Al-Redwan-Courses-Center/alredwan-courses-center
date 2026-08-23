"use client";

import Link from "next/link";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { resetPassword } from "@/actions/auth";
import Button from "@/components/ui/Button";
import FieldSetInput from "@/components/ui/FieldSetInput";

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
      <div className="text-center p-10 bg-white/50 backdrop-blur-md rounded-[2rem] shadow-soft border border-white/40">
        <h3 className="text-3xl font-bold text-olive-800 mb-4">
          تم إرسال الطلب!
        </h3>
        <p className="text-xl text-gray-600 mb-8">
          إذا كان الحساب موجوداً، فستصلك رسالة تحتوي على تعليمات إعادة تعيين كلمة
          المرور.
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
      className="flex flex-col gap-8 bg-white/50 backdrop-blur-md p-10 rounded-[2rem] shadow-soft border border-white/40 w-full max-w-md mx-auto"
    >
      <div className="text-center mb-4">
        <h3 className="text-3xl font-bold text-olive-800">نسيت كلمة المرور؟</h3>
        <p className="text-xl text-gray-500 mt-2">
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
          <span className="text-red-800 text-xl px-4">
            {errors.phone_number1.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <Button
          type="submit"
          loading={isLoading}
          className="w-full py-5 text-2xl"
        >
          إرسال رابط التعيين
        </Button>
        <Link
          href="/?login=true"
          className="text-center text-olive-600 hover:text-olive-700 font-bold text-xl"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
