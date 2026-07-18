export const dynamic = "force-dynamic";

import { getInstructors } from "@/actions/admin-instructors";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { toHindiDigits, cn } from "@/lib/utils";
import { Instructor } from "@/types/entities/instructors";

export default async function Page() {
  const instructors = await getInstructors();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-32 px-16 py-32">
      <div className="border-olive-100 flex flex-col items-start justify-between gap-16 border-b pb-24 md:flex-row md:items-center">
        <div>
          <h1 className="font-medad text-olive-800 text-4xl tracking-tight">
            قائمة المعلمين
          </h1>
          <p className="text-olive-400 mt-4">
            إدارة وتوجيه الكادر التعليمي في المركز
          </p>
        </div>
      </div>

      {/* Grid Container with fixed responsive logic for Tailwind 4 / custom breakpoints */}
      <div className="grid grid-cols-1 gap-20 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {instructors.map((instructor: Instructor, index: number) => (
          <ItemCard
            key={instructor.id}
            index={index}
            shape="leaf"
            className="h-full"
            cardHeader={
              <div className="bg-olive-50 relative grid h-40 w-full place-items-center overflow-hidden">
                <Avatar
                  src={instructor.image_url}
                  alt={instructor.name}
                  className="z-10 h-28 w-28 border-4 border-white shadow-md"
                />
                {/* Decorative background shape */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-olive-100)_0%,transparent_70%)] opacity-30" />
              </div>
            }
            cardFooter={
              <div className="flex justify-center px-24 pb-24">
                <Button
                  href={`/dashboard/instructors/${instructor.id}`}
                  variant="primary"
                  size="small"
                  className="min-w-[16rem] rounded-xl px-32 text-[1.2rem] whitespace-nowrap"
                >
                  عرض الملف الشخصي
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-4 py-8">
              <div className="flex items-start justify-between">
                <h3 className="text-olive-900 text-[1.6rem] leading-tight font-bold">
                  {instructor.name}
                </h3>
                <span
                  className={cn(
                    "h-4 w-4 rounded-full",
                    instructor.type === "supervisor"
                      ? "bg-amber-400"
                      : "bg-emerald-400",
                  )}
                />
              </div>

              <div className="text-olive-600 flex items-center gap-2">
                <PeopleIcon className="h-auto w-6" />
                <span className="text-[1.2rem] font-medium">
                  {instructor.type_display}
                </span>
              </div>

              {instructor.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {instructor.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={tag.id}
                      className={cn(
                        "bg-gray-100 px-4 py-1 text-[1rem] text-gray-600",
                        i % 2 === 0
                          ? "rounded-[0.8rem_0]"
                          : "rounded-[0_0.8rem]",
                      )}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-4 line-clamp-2 text-[1.1rem] leading-relaxed text-gray-500">
                {instructor.bio ||
                  "لا توجد نبذة شخصية متاحة حالياً لهذا المعلم."}
              </p>
            </div>
          </ItemCard>
        ))}
      </div>
    </div>
  );
}
