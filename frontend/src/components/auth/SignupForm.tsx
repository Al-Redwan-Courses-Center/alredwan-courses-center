"use client";

import { signUp } from "@/actions/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn, toHindiDigits } from "@/lib/utils";
import { SignupInputs } from "@/types/auth";
import { signIn } from "next-auth/react";
import { FocusEvent, ReactNode, useEffect } from "react";
import {
  FieldErrors,
  FieldValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import toast from "react-hot-toast";

function renderError<T extends FieldValues>(
  errors: FieldErrors<T>,
  field: keyof T,
): ReactNode {
  if (!errors || !errors[field]) return;

  return (
    <span className="text-4xl text-red-800">
      {errors[field].message?.toString()}
    </span>
  );
}

const inputWrapperStyles = cn("flex flex-col gap-4");

const fieldMap: Record<keyof SignupInputs, string> = {
  phone_number1: "رقم الهاتف الأول",
  password: "كلمة المرور",
  re_password: "تأكيد كلمة المرور",
  first_name: "الاسم الأول",
  last_name: "الاسم الأخير",
  dob: "تاريخ الولادة",
  gender: "النوع",
  phone_number2: "رقم الهاتف الأول",
  email: "البريد الإلكتروني",
  identity_number: "نوع الهوية",
  identity_type: "رقم الهوية",
  address: "العنوان",
  location: "الموقع",
};

const onSubmit: SubmitHandler<SignupInputs> = async (data) => {
  const { errors } = await signUp(data);

  if (errors)
    Object.entries(errors)?.forEach(([key, values]) => {
      toast.error(
        `${fieldMap[key as keyof SignupInputs] || key}: ${values.join("\n")}`,
      );
    });
  else {
    toast.success("تم تسجيل حسابك بنجاح!\nسيتم توجيهك بعد قليل");

    setTimeout(async () => {
      const res = await signIn("credentials", {
        phone_number1: data.phone_number1,
        password: data.password,
        redirect: false,
      });

      if (res?.ok) return window.location.replace("/");

      toast.error(res?.error || "حدث خطأ أثناء تسجيل الدخول! حاول مرة أخرى!");
    }, 3000);
  }
};

export default function SignupForm() {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
  } = useForm<SignupInputs>({
    defaultValues: {
      first_name: "مسعد",
      last_name: "محمود",
      phone_number1: "+201234567899",
      dob: "2001-01-01",
      identity_type: "nid",
      password: "Subnautica455",
      re_password: "Subnautica455",
    },

    shouldUnregister: true,
  });

  const genderValue = watch("gender");
  const identityTypeValue = watch("identity_type");

  useEffect(() => {
    setValue("identity_number", "");
    clearErrors("identity_number");
  }, [identityTypeValue, setValue, clearErrors]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto">
      <div className="mb-10 flex w-200 flex-col gap-20">
        {/* 
          MARK: FIRST NAME
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            label="الاسم الأول"
            placeholder="مسعد"
            registerReturn={register("first_name", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              pattern: {
                value: /^[\u0621-\u064A ]+$/,
                message: "مسموح بالحروف العربية فقط",
              },

              onBlur: (e: FocusEvent<HTMLInputElement>) =>
                setValue("first_name", e.target.value.trim(), {
                  shouldValidate: true,
                }),
            })}
            fieldsetStyles={cn("border-2")}
          />

          {renderError<SignupInputs>(errors, "first_name")}
        </div>

        {/* 
          MARK: LAST NAME
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            label="الاسم الأخير"
            placeholder="محمود"
            registerReturn={register("last_name", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              pattern: {
                value: /^[\u0621-\u064A ]+$/,
                message: "مسموح بالحروف العربية فقط",
              },

              onBlur: (e: FocusEvent<HTMLInputElement>) =>
                setValue("last_name", e.target.value.trim(), {
                  shouldValidate: true,
                }),
            })}
            fieldsetStyles={cn("border-2")}
          />

          {renderError<SignupInputs>(errors, "last_name")}
        </div>

        {/* 
          MARK: EMAIL
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            type="email"
            label="البريد الإلكتروني (اختياري)"
            placeholder="test1234@example.com"
            registerReturn={register("email", {
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,6}$/,
                message: "البريد الإلكتروني خاطئ",
              },
            })}
            fieldsetStyles={cn("border-2")}
            inputStyles={cn("[direction:ltr]")}
          />

          {renderError<SignupInputs>(errors, "email")}
        </div>

        {/* 
          MARK: IDENTITY
        */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="nid"
              className={cn(
                "bg-gray-300 py-5 text-4xl",
                identityTypeValue === "nid" && "bg-red-300",
              )}
            >
              الرقم القومي
            </label>
            <label
              htmlFor="passport"
              className={cn(
                "bg-gray-300 py-5 text-4xl",
                identityTypeValue === "passport" && "bg-red-300",
              )}
            >
              جواز السفر
            </label>
            <label
              htmlFor="other"
              className={cn(
                "bg-gray-300 py-5 text-4xl",
                identityTypeValue === "other" && "bg-red-300",
              )}
            >
              أخرى
            </label>

            <input
              type="radio"
              id="nid"
              value="nid"
              {...register("identity_type")}
              hidden
            />
            <input
              type="radio"
              id="passport"
              value="passport"
              {...register("identity_type")}
              hidden
            />
            <input
              type="radio"
              id="other"
              value="other"
              {...register("identity_type")}
              hidden
            />
          </div>

          {(() => {
            switch (identityTypeValue) {
              case "nid": {
                return (
                  <div className={cn(inputWrapperStyles)}>
                    <Input
                      label="الرقم القومي (اختياري)"
                      placeholder="01234567890123"
                      registerReturn={register("identity_number", {
                        pattern: {
                          value: /^\d{14}$/,
                          message: "الرقم القومي خاطئ",
                        },
                      })}
                      fieldsetStyles={cn("border-2")}
                      inputStyles={cn("[direction:ltr]")}
                    />

                    {renderError<SignupInputs>(errors, "identity_number")}
                  </div>
                );
              }

              case "passport": {
                return (
                  <div className={cn(inputWrapperStyles)}>
                    <Input
                      label="رقم جواز السفر (اختياري)"
                      placeholder="01234567890123"
                      registerReturn={register("identity_number", {
                        pattern: {
                          value: /^\d{14}$/,
                          message: "الرقم القومي خاطئ",
                        },
                      })}
                      fieldsetStyles={cn("border-2")}
                      inputStyles={cn("[direction:ltr]")}
                    />

                    {renderError<SignupInputs>(errors, "identity_number")}
                  </div>
                );
              }

              case "other": {
                return (
                  <div className={cn(inputWrapperStyles)}>
                    <Input
                      label="أخرى (اختياري)"
                      placeholder="01234567890123"
                      registerReturn={register("identity_number", {
                        pattern: {
                          value: /^\d{14}$/,
                          message: "الرقم القومي خاطئ",
                        },
                      })}
                      fieldsetStyles={cn("border-2")}
                      inputStyles={cn("[direction:ltr]")}
                    />

                    {renderError<SignupInputs>(errors, "identity_number")}
                  </div>
                );
              }
            }
          })()}
        </div>

        {/* 
          MARK: PHONE 1
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            label="رقم الهاتف الأول"
            placeholder="+201234567890"
            registerReturn={register("phone_number1", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              pattern: {
                value: /^\+[1-9]\d{1,14}$/,
                message: "رقم الهاتف خاطئ",
              },
            })}
            fieldsetStyles={cn("border-2")}
            inputStyles={cn("[direction:ltr]")}
          />

          {renderError<SignupInputs>(errors, "phone_number1")}
        </div>

        {/* 
          MARK: PHONE 2
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            label="رقم الهاتف الثاني (اختياري)"
            placeholder="+201234567890"
            registerReturn={register("phone_number2", {
              pattern: {
                value: /^\+[1-9]\d{1,14}$/,
                message: "رقم الهاتف خاطئ",
              },
            })}
            fieldsetStyles={cn("border-2")}
            inputStyles={cn("[direction:ltr]")}
          />

          {renderError<SignupInputs>(errors, "phone_number2")}
        </div>

        {/* 
          MARK: DOB
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            type="date"
            label="تاريخ الميلاد"
            registerReturn={register("dob", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              validate: (data) => {
                const date = new Date(data);
                const now = new Date();

                if (date.getTime() >= now.getTime())
                  return "غير مسموح بتاريخ في المستقبل";
              },
            })}
            fieldsetStyles={cn("border-2")}
            inputStyles={cn("[direction:ltr]")}
          />

          {renderError<SignupInputs>(errors, "dob")}
        </div>

        {/* 
          MARK: ADDRESS
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            label="العنوان (اختياري)"
            placeholder="مبنى سـ ، شارع صـ ، مدينة عـ"
            registerReturn={register("address", {
              minLength: {
                value: 10,
                message: `العنوان غير مفصل! الحد الأدنى هو ${toHindiDigits(10)} أحرف!`,
              },

              maxLength: {
                value: 255,
                message: `العنوان طويل جداً! الحد الأقصى هو ${toHindiDigits(255)} حرفاً!`,
              },

              onBlur: (e: FocusEvent<HTMLInputElement>) =>
                setValue("address", e.target.value.trim(), {
                  shouldValidate: true,
                }),
            })}
            fieldsetStyles={cn("border-2")}
          />

          {renderError<SignupInputs>(errors, "address")}
        </div>

        {/* 
          MARK: LOCATION
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            label="الموقع (رابط خرائط جووجل) (اختياري)"
            placeholder="https://maps.app.goo.gl/xyzabcedfg"
            registerReturn={register("location", {
              pattern: {
                value:
                  /^https?:\/\/(www\.)?(google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/,
                message: "الرابط غير صحيح",
              },
              onBlur: (e: FocusEvent<HTMLInputElement>) =>
                setValue("location", e.target.value.trim(), {
                  shouldValidate: true,
                }),
            })}
            fieldsetStyles={cn("border-2")}
          />

          {renderError<SignupInputs>(errors, "location")}
        </div>

        {/* 
          MARK: GENDER
        */}
        <div className={cn(inputWrapperStyles)}>
          <label
            htmlFor="male"
            className={cn(
              genderValue === "male" && "bg-red-300",
              "py-5 text-4xl",
            )}
          >
            ذكر
          </label>
          <input
            type="radio"
            id="male"
            value="male"
            hidden
            {...register("gender", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },
            })}
          />

          <label
            htmlFor="female"
            className={cn(
              genderValue === "female" && "bg-red-300",
              "py-5 text-4xl",
            )}
          >
            أنثى
          </label>
          <input
            type="radio"
            id="female"
            value="female"
            hidden
            {...register("gender", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },
            })}
          />

          {renderError<SignupInputs>(errors, "gender")}
        </div>

        {/* 
          MARK: PASSWORD
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            type="password"
            label="كلمة المرور"
            registerReturn={register("password", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              minLength: {
                value: 8,
                message: "كلمة المرور قصيرة جداً!",
              },
            })}
            fieldsetStyles={cn("border-2")}
          />

          {renderError<SignupInputs>(errors, "password")}
        </div>

        {/* 
          MARK: CONFIRM PASSWORD
        */}
        <div className={cn(inputWrapperStyles)}>
          <Input
            type="password"
            label="تأكيد كلمة المرور"
            registerReturn={register("re_password", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              validate: (data) =>
                data === getValues("password") || "كلمات المرور غير متطابقة!",
            })}
            fieldsetStyles={cn("border-2")}
          />

          {renderError<SignupInputs>(errors, "re_password")}
        </div>
      </div>

      <Button type="submit">تسجيل جديد</Button>
    </form>
  );
}
