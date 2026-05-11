"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import FieldSetInput from "@/components/ui/FieldSetInput";
import Button from "@/components/ui/Button";
import { changePassword } from "@/actions/auth";
import toast from "react-hot-toast";

interface ChangePasswordInputs {
  current_password: string;
  new_password: string;
  re_new_password: string;
}

export default function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ChangePasswordInputs>();

  const newPassword = watch("new_password");

  const onSubmit: SubmitHandler<ChangePasswordInputs> = async (data) => {
    setIsLoading(true);
    const { error } = await changePassword(data);
    
    if (error) {
      let errorMessage = "حدث خطأ أثناء تغيير كلمة المرور";
      if (typeof error === "object") {
        errorMessage = Object.entries(error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("\n");
      }
      toast.error(errorMessage);
      setIsLoading(false);
    } else {
      toast.success("تم تغيير كلمة المرور بنجاح!");
      reset();
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-8 bg-white/50 p-10 rounded-[2rem_0] shadow-soft border border-white/40">
      <h4 className="text-3xl font-bold text-olive-800 mb-2">تغيير كلمة المرور</h4>
      
      <div className="flex flex-col gap-2">
        <FieldSetInput 
            type="password"
            label="كلمة المرور الحالية" 
            registerReturn={register("current_password", { required: "هذا الحقل مطلوب" })}
        />
        {errors.current_password && <span className="text-red-800 text-xl px-4">{errors.current_password.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput 
            type="password"
            label="كلمة المرور الجديدة" 
            registerReturn={register("new_password", { 
              required: "هذا الحقل مطلوب",
              minLength: { value: 8, message: "يجب أن تكون 8 أحرف على الأقل" }
            })}
        />
        {errors.new_password && <span className="text-red-800 text-xl px-4">{errors.new_password.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput 
            type="password"
            label="تأكيد كلمة المرور الجديدة" 
            registerReturn={register("re_new_password", { 
              required: "هذا الحقل مطلوب",
              validate: (value) => value === newPassword || "كلمات المرور غير متطابقة"
            })}
        />
        {errors.re_new_password && <span className="text-red-800 text-xl px-4">{errors.re_new_password.message}</span>}
      </div>
      
      <div className="flex justify-start mt-4">
          <Button 
            type="submit" 
            loading={isLoading} 
            className="px-16 py-5 text-2xl"
          >
            تحديث كلمة المرور
          </Button>
      </div>
    </form>
  );
}
