"use client";

import { signUp } from "@/actions/auth";
import Button from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import FieldSetInput from "@/components/ui/FieldSetInput";
import {
  ARABIC_NAME_PATTERN,
  ARABIC_ONLY_MESSAGE,
  getMaxDobForAge,
  validateMinimumAge,
  MINIMUM_ALLOWED_AGE,
} from "@/lib/validation";
import { cn, toHindiDigits } from "@/lib/utils";
import { SignupInputs } from "@/types/auth";
import { signIn } from "next-auth/react";
import { FocusEvent, ReactNode, useState, useEffect } from "react";
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
    <span className="mt-1 text-2xl text-red-800">
      {errors[field].message?.toString()}
    </span>
  );
}

const inputWrapperStyles = cn("flex flex-col gap-2");

const fieldMap: Record<keyof SignupInputs, string> = {
  phone_number1: "رقم الهاتف الأول",
  password: "كلمة المرور",
  re_password: "تأكيد كلمة المرور",
  first_name: "الاسم الأول",
  last_name: "الاسم الأخير",
  dob: "تاريخ الميلاد",
  gender: "النوع",
  role: "نوع الحساب",
  phone_number2: "رقم الهاتف الثاني",
  email: "البريد الإلكتروني",
  identity_number: "رقم الهوية",
  identity_type: "نوع الهوية",
  address: "العنوان",
  location: "الموقع",
};

export default function SignupForm() {
  const [countryCode, setCountryCode] = useState("20");
  const [showCountryCodeList, setShowCountryCodeList] = useState(false);
  const dobMaxDate = getMaxDobForAge(MINIMUM_ALLOWED_AGE);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupInputs>({
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number1: "",
      dob: "",
      role: "student",
      gender: "male",
      password: "",
      re_password: "",
    },

    shouldUnregister: true,
  });

  const genderValue = watch("gender");
  const roleValue = watch("role");
  // const identityTypeValue = watch("identity_type");

  // DEBUG: Log role changes in real-time
  useEffect(() => {
    console.log("[SIGNUP DEBUG] Role field changed:", roleValue);
  }, [roleValue]);

  // useEffect(() => {
  //   setValue("identity_number", "");
  //   clearErrors("identity_number");
  // }, [identityTypeValue, setValue, clearErrors]);

  const onSubmit: SubmitHandler<SignupInputs> = async (data) => {
    // DEBUG: Log raw form submission data
    console.log("[SIGNUP DEBUG] ===== FORM SUBMISSION START =====");
    console.log("[SIGNUP DEBUG] Raw form data:", {
      ...data,
      password: "[REDACTED]",
      re_password: "[REDACTED]",
    });
    console.log("[SIGNUP DEBUG] Role value in data object:", data.role);
    console.log("[SIGNUP DEBUG] roleValue from watch():", roleValue);
    console.log("[SIGNUP DEBUG] countryCode:", countryCode);

    const formattedData = {
      ...data,
      phone_number1: `+${countryCode + data.phone_number1.replace(/^0+/, "")}`,
      phone_number2: data.phone_number2
        ? `+${countryCode + data.phone_number2.replace(/^0+/, "")}`
        : undefined,
    };

    // DEBUG: Log formatted data before API call
    console.log("[SIGNUP DEBUG] Formatted data before API call:", {
      ...formattedData,
      password: "[REDACTED]",
      re_password: "[REDACTED]",
    });
    console.log("[SIGNUP DEBUG] Role in formatted data:", formattedData.role);

    const { errors: apiErrors } = await signUp(formattedData);

    if (apiErrors)
      Object.entries(apiErrors)?.forEach(([key, values]) => {
        toast.error(
          `${fieldMap[key as keyof SignupInputs] || key}: ${values.join("\n")}`,
        );
      });
    else {
      toast.success("تم تسجيل حسابك بنجاح!\nسيتم توجيهك بعد قليل", {
        duration: 5000,
      });

      setTimeout(async () => {
        const res = await signIn("credentials", {
          phone_number1: formattedData.phone_number1,
          password: formattedData.password,
          redirect: false,
        });

        if (res?.ok) return window.location.replace("/dashboard");
        toast.error(res?.error || "حدث خطأ أثناء تسجيل الدخول! حاول مرة أخرى!");
      }, 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="tablet:grid-cols-1 grid grid-cols-2 gap-x-12 gap-y-8">
        {/* 
          MARK: FIRST NAME
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            label="الاسم الأول"
            placeholder="مسعد"
            registerReturn={register("first_name", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              pattern: {
                value: ARABIC_NAME_PATTERN,
                message: ARABIC_ONLY_MESSAGE,
              },

              onBlur: (e: FocusEvent<HTMLInputElement>) =>
                setValue("first_name", e.target.value.trim(), {
                  shouldValidate: true,
                }),
            })}
          />
          {renderError<SignupInputs>(errors, "first_name")}
        </div>

        {/* 
          MARK: LAST NAME
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            label="الاسم الأخير"
            placeholder="محمود"
            registerReturn={register("last_name", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              pattern: {
                value: ARABIC_NAME_PATTERN,
                message: ARABIC_ONLY_MESSAGE,
              },

              onBlur: (e: FocusEvent<HTMLInputElement>) =>
                setValue("last_name", e.target.value.trim(), {
                  shouldValidate: true,
                }),
            })}
          />
          {renderError<SignupInputs>(errors, "last_name")}
        </div>

        {/* 
          MARK: PHONE 1
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            label="رقم الهاتف"
            placeholder="01234567890"
            button={
              <DropdownMenu
                open={showCountryCodeList}
                onOpenChange={setShowCountryCodeList}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative -top-2 rounded-lg p-2 text-3xl transition-colors hover:bg-gray-300"
                    dir="ltr"
                  >
                    +{countryCode}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="relative z-1000 w-fit min-w-0 bg-gray-100 px-5">
                  <ul className="w-fit text-center text-3xl [direction:ltr] [&>li]:w-full [&>li]:py-5 [&>li]:not-last:border-b">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setCountryCode("20");
                          setShowCountryCodeList(false);
                        }}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-300"
                      >
                        +20
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setCountryCode("1");
                          setShowCountryCodeList(false);
                        }}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-300"
                      >
                        +1
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setCountryCode("44");
                          setShowCountryCodeList(false);
                        }}
                        className="rounded-lg p-2 transition-colors hover:bg-gray-300"
                      >
                        +44
                      </button>
                    </li>
                  </ul>
                </DropdownMenuContent>
              </DropdownMenu>
            }
            registerReturn={register("phone_number1", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },
              pattern: {
                value: /^[0-9]{10,14}$/,
                message: "رقم الهاتف غير صحيح",
              },
            })}
          />
          {renderError<SignupInputs>(errors, "phone_number1")}
        </div>

        {/* 
          MARK: PHONE 2
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            label="رقم الهاتف الثاني (اختياري)"
            placeholder="01234567890"
            registerReturn={register("phone_number2", {
              pattern: {
                value: /^[0-9]{10,14}$/,
                message: "رقم الهاتف غير صحيح",
              },
            })}
            inputStyles={cn("[direction:ltr]")}
          />
          {renderError<SignupInputs>(errors, "phone_number2")}
        </div>

        {/* 
          MARK: EMAIL
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            type="email"
            label="البريد الإلكتروني (اختياري)"
            placeholder="test1234@example.com"
            registerReturn={register("email", {
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
                message: "البريد الإلكتروني خاطئ",
              },
            })}
            inputStyles={cn("[direction:ltr]")}
          />
          {renderError<SignupInputs>(errors, "email")}
        </div>

        {/* 
          MARK: DOB
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            type="date"
            label="تاريخ الميلاد"
            max={dobMaxDate}
            registerReturn={register("dob", {
              required: {
                value: true,
                message: "هذا الحقل إجباري",
              },

              validate: (value) =>
                validateMinimumAge(value, MINIMUM_ALLOWED_AGE),
            })}
            inputStyles={cn("[direction:ltr]")}
          />
          {renderError<SignupInputs>(errors, "dob")}
        </div>

        {/* 
          MARK: GENDER
        */}
        <div className={cn(inputWrapperStyles)}>
          <fieldset className="shadow-soft flex h-full items-center justify-around rounded-[2rem_0] bg-gray-50 px-10 py-4">
            <legend className="ms-5 px-3 text-2xl font-bold">النوع</legend>
            <div className="flex w-full gap-5">
              <label
                htmlFor="male"
                className={cn(
                  "flex-1 cursor-pointer rounded-lg py-2 text-center text-3xl transition-colors",
                  genderValue === "male"
                    ? "bg-olive-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300",
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
                  required: { value: true, message: "هذا الحقل إجباري" },
                })}
              />

              <label
                htmlFor="female"
                className={cn(
                  "flex-1 cursor-pointer rounded-lg py-2 text-center text-3xl transition-colors",
                  genderValue === "female"
                    ? "bg-olive-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300",
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
                  required: { value: true, message: "هذا الحقل إجباري" },
                })}
              />
            </div>
          </fieldset>
          {renderError<SignupInputs>(errors, "gender")}
        </div>

        {/* 
          MARK: ROLE
        */}
        <div className={cn(inputWrapperStyles)}>
          <fieldset className="shadow-soft flex h-full items-center justify-around rounded-[2rem_0] bg-gray-50 px-10 py-4">
            <legend className="ms-5 px-3 text-2xl font-bold">نوع الحساب</legend>
            <div className="flex w-full gap-5">
              <label
                htmlFor="student"
                className={cn(
                  "flex-1 cursor-pointer rounded-lg py-2 text-center text-3xl transition-colors",
                  roleValue === "student"
                    ? "bg-olive-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300",
                )}
              >
                طالب
              </label>
              <input
                type="radio"
                id="student"
                value="student"
                hidden
                {...register("role", {
                  required: { value: true, message: "هذا الحقل إجباري" },
                })}
              />

              <label
                htmlFor="parent"
                className={cn(
                  "flex-1 cursor-pointer rounded-lg py-2 text-center text-3xl transition-colors",
                  roleValue === "parent"
                    ? "bg-olive-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300",
                )}
              >
                ولي أمر
              </label>
              <input
                type="radio"
                id="parent"
                value="parent"
                hidden
                {...register("role", {
                  required: { value: true, message: "هذا الحقل إجباري" },
                })}
              />
            </div>
          </fieldset>
          {renderError<SignupInputs>(errors, "role")}
        </div>

        {/* 
          MARK: ADDRESS
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
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
          />
          {renderError<SignupInputs>(errors, "address")}
        </div>

        {/* 
          MARK: LOCATION
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
            label="الموقع (رابط خرائط جوجل) (اختياري)"
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
          />
          {renderError<SignupInputs>(errors, "location")}
        </div>

        {/* 
          MARK: PASSWORD
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
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
          />
          {renderError<SignupInputs>(errors, "password")}
        </div>

        {/* 
          MARK: CONFIRM PASSWORD
        */}
        <div className={cn(inputWrapperStyles)}>
          <FieldSetInput
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
          />
          {renderError<SignupInputs>(errors, "re_password")}
        </div>
      </div>

      {/* 
        MARK: IDENTITY (Commented out)
      */}
      {/* 
      <div className="flex flex-col gap-2 mt-8">
        <div className="flex items-center justify-between">
          ... identity radio buttons ...
        </div>
        {identityTypeValue && (
          <div className={cn(inputWrapperStyles)}>
            <FieldSetInput ... />
          </div>
        )}
      </div>
      */}

      <div className="mt-12 flex justify-center">
        <Button type="submit" className="tablet:w-auto w-1/2 py-6 text-4xl">
          إنشاء الحساب
        </Button>
      </div>
    </form>
  );
}
