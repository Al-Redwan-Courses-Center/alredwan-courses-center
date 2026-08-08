"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import FieldSetInput from "@/components/ui/FieldSetInput";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { addChild, updateChild, ParentChildDetail } from "@/actions/user";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
      className="tablet:grid-cols-1 tablet:gap-x-6 tablet:gap-y-6 tablet-sm:p-4 shadow-soft grid grid-cols-2 gap-x-12 gap-y-10 rounded-[2rem_0] bg-white/50 p-10"
    >
      <div className="col-span-1 flex flex-col gap-2">
        <FieldSetInput
          label="الاسم الأول والثاني"
          placeholder="مثال: محمد أحمد"
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

      <div className="col-span-1 flex flex-col gap-2">
        <FieldSetInput
          label="الاسم الثالث والرابع"
          placeholder="مثال: علي حسن"
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

      <div className="col-span-1 flex flex-col gap-2">
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

      <div className="col-span-1 flex flex-col gap-4">
        <span className="px-3 text-2xl font-bold">الجنس</span>
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
              "focus-visible:ring-olive-500 flex-1 rounded-lg py-4 text-center text-2xl font-bold outline-hidden transition-all focus-visible:ring-2",
              isEditing
                ? genderValue === "boy"
                  ? "bg-olive-500 cursor-not-allowed text-white shadow-md"
                  : "cursor-not-allowed bg-gray-100 opacity-40"
                : genderValue === "boy"
                  ? "bg-olive-500 cursor-pointer text-white shadow-md"
                  : "cursor-pointer bg-gray-100 hover:bg-gray-200",
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
              "focus-visible:ring-olive-500 flex-1 rounded-lg py-4 text-center text-2xl font-bold outline-hidden transition-all focus-visible:ring-2",
              isEditing
                ? genderValue === "girl"
                  ? "bg-olive-500 cursor-not-allowed text-white shadow-md"
                  : "cursor-not-allowed bg-gray-100 opacity-40"
                : genderValue === "girl"
                  ? "bg-olive-500 cursor-pointer text-white shadow-md"
                  : "cursor-pointer bg-gray-100 hover:bg-gray-200",
            )}
          >
            بنت
          </div>
        </div>
        <input type="hidden" {...register("gender")} />
      </div>

      <div className="tablet:col-span-1 tablet:mt-6 col-span-2 mt-10 flex justify-center">
        <Button
          type="submit"
          loading={isLoading}
          className="tablet-sm:w-full tablet-sm:px-12 tablet-sm:py-4 tablet-sm:text-2xl w-auto px-20 py-6 text-4xl"
        >
          حفظ البيانات
        </Button>
      </div>
    </form>
  );
}
