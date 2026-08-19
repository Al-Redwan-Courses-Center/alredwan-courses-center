"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { updateProfile } from "@/actions/profile";
import Button from "@/components/ui/Button";
import FieldSetInput from "@/components/ui/FieldSetInput";
import type { UserEntity } from "@/types/auth";

interface ProfileInputs {
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
  address: string;
}

export default function EditProfileForm({ user }: { user: UserEntity }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInputs>({
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email || "",
      dob: user.dob,
      address: user.address || "",
    },
  });

  const onSubmit: SubmitHandler<ProfileInputs> = async (data) => {
    setIsLoading(true);
    const formattedData = {
      ...data,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
    };
    const { error } = await updateProfile(formattedData);

    if (error) {
      let errorMessage = "حدث خطأ أثناء تحديث البيانات";
      if (typeof error === "object") {
        errorMessage = Object.entries(error)
          .map(
            ([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
          )
          .join("\n");
      }
      toast.error(errorMessage);
      setIsLoading(false);
    } else {
      toast.success("تم تحديث ملفك الشخصي بنجاح!");
      router.push("/dashboard/profile");
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="shadow-soft grid grid-cols-1 gap-x-12 gap-y-10 rounded-[2rem_0] bg-white/50 p-10 md:grid-cols-2"
    >
      <div className="flex flex-col gap-2">
        <FieldSetInput
          label="الاسم الأول"
          registerReturn={register("first_name", {
            required: "هذا الحقل مطلوب",
          })}
        />
        {errors.first_name && (
          <span className="px-4 text-xl text-red-800">
            {errors.first_name.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput
          label="الاسم الأخير"
          registerReturn={register("last_name", {
            required: "هذا الحقل مطلوب",
          })}
        />
        {errors.last_name && (
          <span className="px-4 text-xl text-red-800">
            {errors.last_name.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput
          type="email"
          label="البريد الإلكتروني"
          registerReturn={register("email")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput
          type="date"
          label="تاريخ الميلاد"
          registerReturn={register("dob", { required: "هذا الحقل مطلوب" })}
        />
        {errors.dob && (
          <span className="px-4 text-xl text-red-800">
            {errors.dob.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <FieldSetInput label="العنوان" registerReturn={register("address")} />
      </div>

      <div className="mt-10 flex justify-center gap-4 md:col-span-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="px-12 py-5 text-3xl"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          className="px-20 py-5 text-3xl"
        >
          حفظ التعديلات
        </Button>
      </div>
    </form>
  );
}
