import { ChildCardInfo } from "@/types/dashboard";
import { cn, toHindiDigits } from "@/lib/utils";
import Image from "next/image";
import Button from "@/components/ui/Button";
import DefaultUser from "@/assets/images/default-user.svg";

interface ChildrenListProps {
  childrenList: ChildCardInfo[];
  onViewChildDashboard: (childId: string) => void;
  isLoading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="shadow-primary tablet:p-6 mobile:p-5 flex flex-col items-center rounded-[1.8rem_0] bg-white p-8">
      <div className="bg-olive-200 tablet:h-32 tablet:w-32 mobile:h-28 mobile:w-28 mb-6 h-40 w-40 animate-pulse rounded-full" />
      <div className="bg-olive-200 tablet:w-40 mobile:w-36 mb-3 h-6 w-48 animate-pulse rounded" />
      <div className="tablet:w-28 mobile:w-24 mb-6 h-4 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export default function ChildrenList({
  childrenList,
  onViewChildDashboard,
  isLoading = false,
}: ChildrenListProps) {
  if (isLoading) {
    return (
      <section className="tablet:mb-12 mobile:mb-10 mb-16">
        <h2 className="text-olive-700 tablet:mb-6 tablet:text-3xl mobile:mb-5 mobile:text-3xl mb-8 text-4xl font-bold">
          أبنائي
        </h2>

        <div className="tablet:grid-cols-2 tablet:gap-6 mobile:grid-cols-1 mobile:gap-5 grid grid-cols-3 gap-8">
          <LoadingSkeleton />
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (childrenList.length === 0) {
    return (
      <section className="tablet:mb-12 mobile:mb-10 mb-16">
        <h2 className="text-olive-700 tablet:mb-6 tablet:text-3xl mobile:mb-5 mobile:text-3xl mb-8 text-4xl font-bold">
          أبنائي
        </h2>

        <div className="tablet:py-16 mobile:py-12 flex flex-col items-center justify-center rounded-xl bg-gray-50 py-20">
          <div className="text-olive-300 tablet:mb-5 mobile:mb-4 mb-6">
            <svg
              width="12rem"
              height="12rem"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="tablet:h-40 tablet:w-40 mobile:h-32 mobile:w-32"
            >
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                fill="currentColor"
              />
            </svg>
          </div>

          <h3 className="text-olive-600 tablet:text-3xl mobile:text-3xl mb-4 text-4xl font-bold">
            لا يوجد أبناء مسجلين
          </h3>
          <p className="tablet:text-xl mobile:text-lg text-center text-2xl text-gray-600">
            يمكنك إضافة أبنائك من خلال التواصل مع إدارة المركز
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="tablet:mb-12 mobile:mb-10 mb-16">
      <h2 className="text-olive-700 tablet:mb-6 tablet:text-3xl mobile:mb-5 mobile:text-3xl mb-8 text-4xl font-bold">
        أبنائي
      </h2>

      <div
        className={cn(
          "grid gap-6",
          "grid-cols-4",
          "tablet:grid-cols-2 tablet:gap-5",
          "mobile:grid-cols-1 mobile:gap-4",
        )}
      >
        {childrenList.map((child) => {
          const birthDate = new Date(child.dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          return (
            <article
              key={child.id}
              className={cn(
                "shadow-primary group flex flex-col items-center rounded-[1.8rem_0] bg-white",
                "p-8 transition-shadow hover:shadow-lg",
                "tablet:p-6",
                "mobile:p-5",
              )}
            >
              {/* Avatar */}
              <div className="border-olive-300 tablet:h-32 tablet:w-32 mobile:h-28 mobile:w-28 relative mb-6 h-40 w-40 overflow-hidden rounded-full border-4">
                <Image
                  src={child.image || DefaultUser}
                  alt={
                    child.image
                      ? `${child.first_name} ${child.last_name}`
                      : "Default User"
                  }
                  fill
                  className="object-cover"
                  draggable={false}
                />

                {child.is_active && (
                  <div className="absolute right-2 bottom-2">
                    <div className="tablet:h-5 tablet:w-5 mobile:h-4 mobile:w-4 h-6 w-6 rounded-full border-4 border-white bg-green-500" />
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-olive-700 tablet:text-2xl mobile:text-2xl mb-2 text-center text-3xl font-bold">
                {child.first_name} {child.last_name}
              </h3>

              {/* Age */}
              <p className="tablet:text-lg mobile:text-base mb-2 text-xl text-gray-600">
                العمر: {toHindiDigits(age)} سنة
              </p>

              {/* Code */}
              {child.child_code && (
                <p className="tablet:mb-5 tablet:text-base mobile:mb-4 mobile:text-sm mb-6 text-lg text-gray-500">
                  الكود: {toHindiDigits(child.child_code)}
                </p>
              )}

              {/* Stats */}
              <div className="tablet:mb-6 tablet:space-y-3 mobile:mb-5 mobile:space-y-3 mb-8 w-full space-y-4">
                <div className="tablet:p-3 mobile:p-3 flex items-center justify-between rounded-lg bg-green-50 p-4">
                  <span className="tablet:text-lg mobile:text-base text-xl font-semibold text-green-700">
                    الدورات النشطة
                  </span>
                  <span className="font-medad tablet:text-2xl mobile:text-2xl text-3xl font-bold text-green-700">
                    {toHindiDigits(child.active_courses_count)}
                  </span>
                </div>

                {child.pending_enrollments_count > 0 && (
                  <div className="tablet:p-3 mobile:p-3 flex items-center justify-between rounded-lg bg-amber-50 p-4">
                    <span className="tablet:text-lg mobile:text-base text-xl font-semibold text-amber-700">
                      تسجيلات معلقة
                    </span>
                    <span className="font-medad tablet:text-2xl mobile:text-2xl text-3xl font-bold text-amber-700">
                      {toHindiDigits(child.pending_enrollments_count)}
                    </span>
                  </div>
                )}

                <div className="tablet:p-3 mobile:p-3 flex items-center justify-between rounded-lg bg-blue-50 p-4">
                  <span className="tablet:text-lg mobile:text-base text-xl font-semibold text-blue-700">
                    نسبة الحضور
                  </span>
                  <span className="font-medad tablet:text-2xl mobile:text-2xl text-3xl font-bold text-blue-700">
                    {toHindiDigits(child.attendance_percentage.toFixed(0))}٪
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="small"
                onClick={() => onViewChildDashboard(child.id)}
                className="w-full"
              >
                عرض لوحة التحكم
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
