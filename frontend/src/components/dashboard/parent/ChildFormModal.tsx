"use client";

import {
  createChild,
  updateChild,
  type CreateChildPayload,
  type UpdateChildPayload,
  type ChildMutationResult,
} from "@/actions/parents";
import { ParentChildDetail } from "@/actions/user";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import {
  ARABIC_NAME_PATTERN,
  ARABIC_ONLY_MESSAGE,
  getMaxDobForAge,
  validateMinimumAge,
  MINIMUM_ALLOWED_AGE,
} from "@/lib/validation";
import { ReactNode, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ChildFormInputs {
  first_name: string;
  last_name: string;
  dob: string;
  gender: "boy" | "girl";
  phone: string;
  image?: FileList;
}

interface ChildFormModalProps {
  mode: "create" | "edit";
  child?: ParentChildDetail;
  trigger?: ReactNode;
}

function renderError(message?: string): ReactNode {
  if (!message) return null;
  return <span className="mt-1 text-2xl text-red-800">{message}</span>;
}

export default function ChildFormModal({
  mode,
  child,
  trigger,
}: ChildFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dobMaxDate = getMaxDobForAge(MINIMUM_ALLOWED_AGE);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ChildFormInputs>({
    defaultValues: {
      first_name: mode === "edit" && child ? child.first_name : "",
      last_name: mode === "edit" && child ? child.last_name : "",
      dob: mode === "edit" && child ? child.dob : "",
      gender: mode === "edit" && child ? child.gender : "boy",
      phone: mode === "edit" && child ? child.phone || "" : "",
      image: undefined,
    },
  });

  const onSubmit: SubmitHandler<ChildFormInputs> = async (values) => {
    // Get image file if provided
    const imageFile = values.image?.[0];

    let result: ChildMutationResult;

    if (mode === "create") {
      const payload: CreateChildPayload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        dob: values.dob,
        gender: values.gender,
        phone: values.phone.trim() || undefined,
        image: imageFile,
      };

      result = await createChild(payload);
    } else {
      // Edit mode
      if (!child) return;

      const payload: UpdateChildPayload = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        dob: values.dob,
        gender: values.gender,
        phone: values.phone.trim() || undefined,
        image: imageFile,
      };

      result = await updateChild(child.id, payload);
    }

    if (!result.ok) {
      const fieldErrors = result.fieldErrors || {};

      if (fieldErrors.first_name?.[0]) {
        setError("first_name", { message: fieldErrors.first_name[0] });
      }
      if (fieldErrors.last_name?.[0]) {
        setError("last_name", { message: fieldErrors.last_name[0] });
      }
      if (fieldErrors.dob?.[0]) {
        setError("dob", { message: fieldErrors.dob[0] });
      }
      if (fieldErrors.gender?.[0]) {
        setError("gender", { message: fieldErrors.gender[0] });
      }
      if (fieldErrors.phone?.[0]) {
        setError("phone", { message: fieldErrors.phone[0] });
      }
      if (fieldErrors.image?.[0]) {
        setError("image", { message: fieldErrors.image[0] });
      }
      if (fieldErrors.non_field_errors?.[0]) {
        setError("root.serverError", {
          message: fieldErrors.non_field_errors[0],
        });
      } else if (result.message) {
        setError("root.serverError", { message: result.message });
      }

      return;
    }

    toast.success(
      result.message ||
        (mode === "create"
          ? "تم إضافة الطفل بنجاح."
          : "تم تحديث معلومات الطفل بنجاح."),
    );
    setIsOpen(false);
    reset();
    router.refresh();
  };

  const modalTitle =
    mode === "create" ? "إضافة طفل جديد" : "تعديل معلومات الطفل";
  const submitButtonLabel = mode === "create" ? "إضافة الطفل" : "حفظ التغييرات";

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);

        if (open) {
          clearErrors();
          reset({
            first_name: mode === "edit" && child ? child.first_name : "",
            last_name: mode === "edit" && child ? child.last_name : "",
            dob: mode === "edit" && child ? child.dob : "",
            gender: mode === "edit" && child ? child.gender : "boy",
            phone: mode === "edit" && child ? child.phone || "" : "",
            image: undefined,
          });
        }
      }}
    >
      {trigger ? (
        <ModalTrigger asChild>{trigger}</ModalTrigger>
      ) : (
        <ModalTrigger asChild>
          <Button size="small">
            {mode === "create" ? "إضافة طفل" : "تعديل"}
          </Button>
        </ModalTrigger>
      )}

      <ModalContent className="max-h-[90dvh] w-280 overflow-y-auto rounded-[2rem_0]">
        <ModalTitle className="mb-2">{modalTitle}</ModalTitle>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 pb-10"
        >
          <ModalDescription className="text-center text-2xl text-gray-600">
            {mode === "create"
              ? "أدخل معلومات الطفل الجديد"
              : "عدّل معلومات الطفل"}
          </ModalDescription>

          {renderError(errors.root?.serverError?.message)}

          {/* First Name */}
          <div className="space-y-3">
            <label
              htmlFor="first_name"
              className="block text-2xl font-bold text-gray-900"
            >
              الاسم الأول *
            </label>

            <input
              id="first_name"
              type="text"
              placeholder="مثال: محمد"
              {...register("first_name", {
                required: "الاسم الأول مطلوب.",
                minLength: {
                  value: 2,
                  message: "الاسم الأول يجب أن يكون 2 أحرف على الأقل.",
                },
                pattern: {
                  value: ARABIC_NAME_PATTERN,
                  message: ARABIC_ONLY_MESSAGE,
                },
                onBlur: (event) =>
                  setValue("first_name", event.target.value.trim(), {
                    shouldValidate: true,
                  }),
              })}
              className="shadow-soft h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl focus:outline-none"
            />

            {renderError(errors.first_name?.message)}
          </div>

          {/* Last Name */}
          <div className="space-y-3">
            <label
              htmlFor="last_name"
              className="block text-2xl font-bold text-gray-900"
            >
              الاسم الأخير *
            </label>

            <input
              id="last_name"
              type="text"
              placeholder="مثال: أحمد"
              {...register("last_name", {
                required: "الاسم الأخير مطلوب.",
                minLength: {
                  value: 2,
                  message: "الاسم الأخير يجب أن يكون 2 أحرف على الأقل.",
                },
                pattern: {
                  value: ARABIC_NAME_PATTERN,
                  message: ARABIC_ONLY_MESSAGE,
                },
                onBlur: (event) =>
                  setValue("last_name", event.target.value.trim(), {
                    shouldValidate: true,
                  }),
              })}
              className="shadow-soft h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl focus:outline-none"
            />

            {renderError(errors.last_name?.message)}
          </div>

          {/* Date of Birth */}
          <div className="space-y-3">
            <label
              htmlFor="dob"
              className="block text-2xl font-bold text-gray-900"
            >
              تاريخ الميلاد *
            </label>

            <input
              id="dob"
              type="date"
              max={dobMaxDate}
              {...register("dob", {
                required: "تاريخ الميلاد مطلوب.",
                validate: (value) =>
                  validateMinimumAge(value, MINIMUM_ALLOWED_AGE),
              })}
              className="shadow-soft h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl focus:outline-none"
            />

            {renderError(errors.dob?.message)}
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <label
              htmlFor="gender"
              className="block text-2xl font-bold text-gray-900"
            >
              النوع *
            </label>

            <select
              id="gender"
              {...register("gender", {
                required: "النوع مطلوب.",
              })}
              className="shadow-soft h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl focus:outline-none"
            >
              <option value="boy">ولد</option>
              <option value="girl">بنت</option>
            </select>

            {renderError(errors.gender?.message)}
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <label
              htmlFor="phone"
              className="block text-2xl font-bold text-gray-900"
            >
              رقم الهاتف (اختياري)
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="+201234567890"
              {...register("phone", {
                validate: (value) => {
                  if (!value.trim()) return true;
                  // Basic E.164 validation
                  if (!/^\+?[1-9]\d{1,14}$/.test(value.trim())) {
                    return "صيغة رقم الهاتف غير صحيحة.";
                  }
                  return true;
                },
              })}
              className="shadow-soft h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl focus:outline-none"
            />

            {renderError(errors.phone?.message)}
          </div>

          {/* Image */}
          <div className="space-y-3">
            <label
              htmlFor="image"
              className="block text-2xl font-bold text-gray-900"
            >
              صورة الملف الشخصي (اختياري)
            </label>

            <input
              id="image"
              type="file"
              accept="image/*"
              {...register("image")}
              className="shadow-soft file:bg-olive-300 h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl file:me-2 file:rounded-[1rem_0] file:border-0 file:px-4 file:py-2 file:font-bold file:text-gray-100 focus:outline-none"
            />

            {renderError(errors.image?.message)}
          </div>

          {/* Form Actions */}
          <div className="mt-2 flex items-center justify-end gap-4">
            <ModalClose asChild>
              <Button
                variant="secondary"
                revert
                size="small"
                className="min-w-40"
              >
                إلغاء
              </Button>
            </ModalClose>

            <Button
              type="submit"
              size="small"
              className="h-15 min-w-50"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {submitButtonLabel}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
