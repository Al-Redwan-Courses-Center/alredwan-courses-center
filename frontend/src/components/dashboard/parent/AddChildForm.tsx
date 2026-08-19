"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { addChild, type ParentChildDetail, updateChild } from "@/actions/user";
import Button from "@/components/ui/Button";
import FieldSetInput from "@/components/ui/FieldSetInput";
import { cn } from "@/lib/utils";

interface AddChildInputs {
  first_name: string;
  last_name: string;
  dob: string;
  gender: "boy" | "girl";
}

export default function AddChildForm({
  initialData,
  onSuccess,
}: {
  initialData?: ParentChildDetail;
  onSuccess?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddChildInputs>({
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      dob: initialData?.dob || "",
      gender: initialData?.gender || "boy",
    },
  });

  const genderValue = watch("gender");

  const onSubmit: SubmitHandler<AddChildInputs> = async (data) => {
    setIsLoading(true);

    // 1. Trimming names and checking for empty values
    const trimmedFirstName = data.first_name.trim();
    const trimmedLastName = data.last_name.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      toast.error("الاسم الأول والاسم الأخير لا يمكن أن يكونا فارغين.");
      setIsLoading(false);
      return;
    }

    // 2. Validate date of birth (Age must be > 0)
    const dobDate = new Date(data.dob);
    const today = new Date();

    // Reset hours, minutes, seconds, ms for date-only comparison
    today.setHours(0, 0, 0, 0);
    dobDate.setHours(0, 0, 0, 0);

    if (dobDate >= today || Number.isNaN(dobDate.getTime())) {
      toast.error("تاريخ الميلاد غير صالح! يجب أن يكون عمر الطفل أكبر من 0.");
      setIsLoading(false);
      return;
    }

    const payload = {
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      dob: data.dob,
      gender: data.gender,
    };

    const result = initialData
      ? await updateChild(initialData.id, payload)
      : await addChild(payload);

    const { error } = result;

    if (error) {
      let errorMessage = initialData
        ? "حدث خطأ أثناء تحديث البيانات"
        : "حدث خطأ أثناء حفظ البيانات";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (typeof error === "object") {
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
      toast.success(
        initialData ? "تم تحديث البيانات بنجاح!" : "تم إضافة الطفل بنجاح!",
      );
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/my-children");
      }
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-2 tablet:grid-cols-1 gap-x-12 tablet:gap-x-6 gap-y-10 tablet:gap-y-6 bg-white/50 p-10 tablet-sm:p-4 rounded-[2rem_0] shadow-soft"
    >
      <div className="flex flex-col gap-2 col-span-1">
        <FieldSetInput
          label="الاسم الأول والثاني"
          placeholder="مثال: محمد أحمد"
          registerReturn={register("first_name", {
            required: "هذا الحقل مطلوب",
          })}
        />
        {errors.first_name && (
          <span className="text-red-800 text-xl px-4">
            {errors.first_name.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 col-span-1">
        <FieldSetInput
          label="الاسم الثالث والرابع"
          placeholder="مثال: علي حسن"
          registerReturn={register("last_name", {
            required: "هذا الحقل مطلوب",
          })}
        />
        {errors.last_name && (
          <span className="text-red-800 text-xl px-4">
            {errors.last_name.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 col-span-1">
        <FieldSetInput
          type="date"
          label="تاريخ الميلاد"
          registerReturn={register("dob", { required: "هذا الحقل مطلوب" })}
        />
        {errors.dob && (
          <span className="text-red-800 text-xl px-4">
            {errors.dob.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 col-span-1">
        <span className="text-2xl font-bold px-3">الجنس</span>
        <div
          className="flex gap-4"
          role="radiogroup"
          aria-label="الجنس"
          aria-disabled={isEditing}
        >
          <div
            role="radio"
            aria-checked={genderValue === "boy"}
            tabIndex={isEditing ? -1 : 0}
            onClick={isEditing ? undefined : () => setValue("gender", "boy")}
            onKeyDown={
              isEditing
                ? undefined
                : (e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setValue("gender", "boy");
                    }
                  }
            }
            className={cn(
              "flex-1 text-center py-4 rounded-lg transition-all text-2xl font-bold outline-hidden focus-visible:ring-2 focus-visible:ring-olive-500",
              isEditing
                ? genderValue === "boy"
                  ? "bg-olive-500 text-white shadow-md cursor-not-allowed"
                  : "bg-gray-100 opacity-40 cursor-not-allowed"
                : genderValue === "boy"
                  ? "bg-olive-500 text-white shadow-md cursor-pointer"
                  : "bg-gray-100 hover:bg-gray-200 cursor-pointer",
            )}
          >
            ولد
          </div>
          <div
            role="radio"
            aria-checked={genderValue === "girl"}
            tabIndex={isEditing ? -1 : 0}
            onClick={isEditing ? undefined : () => setValue("gender", "girl")}
            onKeyDown={
              isEditing
                ? undefined
                : (e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setValue("gender", "girl");
                    }
                  }
            }
            className={cn(
              "flex-1 text-center py-4 rounded-lg transition-all text-2xl font-bold outline-hidden focus-visible:ring-2 focus-visible:ring-olive-500",
              isEditing
                ? genderValue === "girl"
                  ? "bg-olive-500 text-white shadow-md cursor-not-allowed"
                  : "bg-gray-100 opacity-40 cursor-not-allowed"
                : genderValue === "girl"
                  ? "bg-olive-500 text-white shadow-md cursor-pointer"
                  : "bg-gray-100 hover:bg-gray-200 cursor-pointer",
            )}
          >
            بنت
          </div>
        </div>
        <input type="hidden" {...register("gender")} />
      </div>

      <div className="col-span-2 tablet:col-span-1 flex justify-center mt-10 tablet:mt-6">
        <Button
          type="submit"
          loading={isLoading}
          className="w-auto px-20 py-6 text-4xl tablet-sm:w-full tablet-sm:px-12 tablet-sm:py-4 tablet-sm:text-2xl"
        >
          حفظ البيانات
        </Button>
      </div>
    </form>
  );
}
