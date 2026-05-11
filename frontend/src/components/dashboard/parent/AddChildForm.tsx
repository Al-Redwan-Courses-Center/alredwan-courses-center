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

export default function AddChildForm({ initialData }: { initialData?: ParentChildDetail }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddChildInputs>({
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      dob: initialData?.dob || "",
      gender: initialData?.gender || "boy"
    }
  });

  const genderValue = watch("gender");

  const onSubmit: SubmitHandler<AddChildInputs> = async (data) => {
    setIsLoading(true);
    
    const result = initialData 
      ? await updateChild(initialData.id, data)
      : await addChild(data);
    
    const { error } = result;
    
    if (error) {
      let errorMessage = initialData ? "حدث خطأ أثناء تحديث البيانات" : "حدث خطأ أثناء حفظ البيانات";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (typeof error === "object") {
        // DRF returns errors as { field: [messages] }
        errorMessage = Object.entries(error)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("\n");
      }
      toast.error(errorMessage);
      setIsLoading(false);
    } else {
      toast.success(initialData ? "تم تحديث البيانات بنجاح!" : "تم إضافة الطفل بنجاح!");
      router.push("/dashboard/my-children");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-x-12 gap-y-10 bg-white/50 p-10 rounded-[2rem_0] shadow-soft">
      <div className="flex flex-col gap-2">
        <FieldSetInput 
            label="الاسم الأول والثاني" 
            placeholder="مثال: محمد أحمد" 
            registerReturn={register("first_name", { required: "هذا الحقل مطلوب" })}
        />
        {errors.first_name && <span className="text-red-800 text-xl px-4">{errors.first_name.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput 
            label="الاسم الثالث والرابع" 
            placeholder="مثال: علي حسن" 
            registerReturn={register("last_name", { required: "هذا الحقل مطلوب" })}
        />
        {errors.last_name && <span className="text-red-800 text-xl px-4">{errors.last_name.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <FieldSetInput 
            type="date" 
            label="تاريخ الميلاد" 
            registerReturn={register("dob", { required: "هذا الحقل مطلوب" })}
        />
        {errors.dob && <span className="text-red-800 text-xl px-4">{errors.dob.message}</span>}
      </div>

      <div className="flex flex-col gap-4">
          <span className="text-2xl font-bold px-3">الجنس</span>
          <div className="flex gap-4">
              <div 
                onClick={() => setValue("gender", "boy")}
                className={cn(
                  "flex-1 text-center py-4 rounded-lg cursor-pointer transition-all text-2xl font-bold",
                  genderValue === "boy" ? "bg-olive-500 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                ولد
              </div>
              <div 
                onClick={() => setValue("gender", "girl")}
                className={cn(
                  "flex-1 text-center py-4 rounded-lg cursor-pointer transition-all text-2xl font-bold",
                  genderValue === "girl" ? "bg-olive-500 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                بنت
              </div>
          </div>
          <input type="hidden" {...register("gender")} />
      </div>
      
      <div className="col-span-2 flex justify-center mt-10">
          <Button type="submit" loading={isLoading} className="px-20 py-6 text-4xl">
              حفظ البيانات
          </Button>
      </div>
    </form>
  );
}

