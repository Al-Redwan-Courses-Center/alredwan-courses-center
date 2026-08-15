"use client";

import { createEnrollmentRequest } from "@/actions/enrollments";
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
import { EnrollmentRequestCreateBody } from "@/types/entities";
import { ReactNode, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type PaymentMethod = NonNullable<EnrollmentRequestCreateBody["payment_method"]>;

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "نقدًا" },
  { value: "instapay", label: "إنستاباي" },
  { value: "vodafone_cash", label: "فودافون كاش" },
];

interface PurchaseFormInputs {
  child: string;
  payment_method: PaymentMethod;
  notes: string;
}

function renderError(message?: string): ReactNode {
  if (!message) return null;

  return <span className="mt-1 text-2xl text-red-800">{message}</span>;
}

export default function CoursePurchaseModal({
  role,
  courseId,
  coursePrice,
  courseType = "physical",
  childrenOptions = [],
}: {
  role: "parent" | "student";
  courseId: string;
  coursePrice: string;
  courseType?: "physical" | "online";
  childrenOptions?: ParentChildDetail[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<PurchaseFormInputs>({
    defaultValues: {
      child: childrenOptions[0]?.id || "",
      payment_method: "cash",
      notes: "",
    },
  });

  const selectedPaymentMethod = watch("payment_method");
  const hasNoChildren = role === "parent" && childrenOptions.length === 0;

  const onSubmit: SubmitHandler<PurchaseFormInputs> = async (values) => {
    const payload: EnrollmentRequestCreateBody = {
      ...(courseType === "online" ? { online_course: courseId } : { course: courseId }),
      payment_method: values.payment_method,
      notes: values.notes.trim() || undefined,
      ...(role === "parent" ? { child: values.child } : {}),
    };

    const result = await createEnrollmentRequest(payload);

    if (!result.ok) {
      const fieldErrors = result.fieldErrors || {};

      if (fieldErrors.child?.[0]) {
        setError("child", { message: fieldErrors.child[0] });
      }
      if (fieldErrors.payment_method?.[0]) {
        setError("payment_method", { message: fieldErrors.payment_method[0] });
      }
      if (fieldErrors.notes?.[0]) {
        setError("notes", { message: fieldErrors.notes[0] });
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

    toast.success(result.message || "تم إرسال الطلب بنجاح.");
    setIsOpen(false);
    reset({
      child: childrenOptions[0]?.id || "",
      payment_method: "cash",
      notes: "",
    });
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);

        if (open) {
          clearErrors();
          reset({
            child: childrenOptions[0]?.id || "",
            payment_method: "cash",
            notes: "",
          });
        }
      }}
    >
      <ModalTrigger asChild>
        <Button className="w-full" disabled={hasNoChildren}>
          طلب الالتحاق
        </Button>
      </ModalTrigger>

      <ModalContent className="max-h-[90dvh] w-280 overflow-y-auto rounded-[2rem_0]">
        <ModalTitle className="mb-2">تأكيد طلب الإلتحاق</ModalTitle>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 pb-10"
        >
          <ModalDescription className="text-center text-2xl text-gray-600">
            {role === "parent"
              ? "اختر بيانات الطلب للطفل ثم أكد طلب الالتحاق."
              : "أكد بيانات طلب الإلتحاق ثم اضغط تأكيد طلب الالتحاق."}
          </ModalDescription>

          {renderError(errors.root?.serverError?.message)}

          {role === "parent" && (
            <div className="space-y-3">
              <label
                htmlFor="child"
                className="block text-2xl font-bold text-gray-900"
              >
                الطفل
              </label>

              <select
                id="child"
                {...register("child", {
                  validate: (value) => {
                    if (role !== "parent") return true;
                    if (hasNoChildren) {
                      return "لا يوجد أطفال مرتبطون بحسابك.";
                    }

                    return !!value || "يرجى اختيار الطفل.";
                  },
                })}
                className="shadow-soft h-18 w-full rounded-[1.4rem_0] bg-gray-50 px-6 text-2xl focus:outline-none"
              >
                {childrenOptions.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>

              {renderError(errors.child?.message)}
            </div>
          )}

          {hasNoChildren && (
            <p className="rounded-[1.2rem_0] bg-gray-200 px-5 py-4 text-2xl text-gray-600">
              لا يوجد أطفال متاحون للإلتحاق بهذه الدورة حاليًا (إما لا يوجد
              أطفال مرتبطون أو أنهم ملتحقون بالفعل).
            </p>
          )}



          <div className="space-y-3">
            <p className="block text-2xl font-bold text-gray-900">
              طريقة الدفع
            </p>

            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((option, index) => (
                <label
                  key={option.value}
                  className={`shadow-soft flex cursor-pointer items-center gap-3 px-5 py-4 text-2xl ${
                    index % 2 === 0
                      ? "rounded-[1.2rem_0] bg-gray-50"
                      : "rounded-[0_1.2rem] bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register("payment_method", {
                      required: "يرجى اختيار طريقة الدفع.",
                    })}
                    className="accent-olive-500 h-6 w-6"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {selectedPaymentMethod === "cash" && (
              <p className="rounded-[1.2rem_0] bg-olive-100/50 px-5 py-4 text-2xl text-olive-800 font-bold">
                يرجى التوجه للواحة
              </p>
            )}
            {(selectedPaymentMethod === "instapay" ||
              selectedPaymentMethod === "vodafone_cash") && (
              <p className="rounded-[1.2rem_0] bg-olive-100/50 px-5 py-4 text-2xl text-olive-800 font-bold">
                يرجى التواصل مع رقم واتس الواحة: 01233313590
              </p>
            )}

            {renderError(errors.payment_method?.message)}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="notes"
              className="block text-2xl font-bold text-gray-900"
            >
              ملاحظات (اختياري)
            </label>

            <textarea
              id="notes"
              {...register("notes")}
              className="shadow-soft h-40 w-full resize-none rounded-[1.4rem_0] bg-gray-50 px-6 py-4 text-2xl focus:outline-none"
              placeholder="اكتب أي ملاحظة تود إضافتها..."
            />

            {renderError(errors.notes?.message)}
          </div>

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
              disabled={isSubmitting || hasNoChildren}
            >
              تأكيد طلب الالتحاق
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
