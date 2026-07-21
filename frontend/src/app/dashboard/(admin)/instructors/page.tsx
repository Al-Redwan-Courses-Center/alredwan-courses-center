export const dynamic = "force-dynamic";

import { getInstructors } from "@/actions/admin-instructors";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import ItemCard from "@/components/ui/ItemCard";
import PeopleIcon from "@/components/icons/PeopleIcon";
import { cn } from "@/lib/utils";
import { Instructor } from "@/types/entities/instructors";

export default async function Page() {
  const instructors = await getInstructors();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-16 py-32 flex flex-col gap-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-16 border-b border-olive-100 pb-24">
        <div>
          <h1 className="text-[3rem] font-medad text-olive-800 tracking-tight">قائمة المعلمين</h1>
          <p className="text-olive-400 mt-4 text-[1.8rem]">إدارة وتوجيه الكادر التعليمي في المركز</p>
        </div>
      </div>

      {/* Grid Container with fixed responsive logic for Tailwind 4 / custom breakpoints */}
      <div className="grid gap-20 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {instructors.map((instructor: Instructor, index: number) => (
          <ItemCard
            key={instructor.id}
            index={index}
            shape="leaf"
            className="h-full"
            cardHeader={
              <div className="relative h-60 w-full overflow-hidden bg-olive-50 grid place-items-center">
                <Avatar 
                  src={instructor.image_url} 
                  alt={instructor.name} 
                  className="h-44 w-44 border-4 border-white shadow-md z-10" 
                />
                {/* Decorative background shape */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-olive-100)_0%,transparent_70%)] opacity-30" />
              </div>
            }
            cardFooter={
              <div className="flex justify-center pb-24 px-24">
                <Button 
                  href={`/dashboard/instructors/${instructor.id}`}
                  variant="primary" 
                  size="small" 
                  className="rounded-xl text-[1.6rem] px-32 min-w-[16rem] whitespace-nowrap"
                >
                  عرض الملف الشخصي
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-4 py-8">
              <div className="flex justify-between items-start">
                <h3 className="text-[2.4rem] font-bold text-olive-900 leading-tight">
                  {instructor.name}
                </h3>
                <span className={cn(
                  "h-5 w-5 rounded-full mt-2",
                  instructor.type === 'supervisor' ? "bg-amber-400" : "bg-emerald-400"
                )} />
              </div>
              
              <div className="flex items-center gap-2 text-olive-600">
                <PeopleIcon className="h-auto w-8" />
                <span className="text-[1.6rem] font-medium">{instructor.type_display}</span>
              </div>

              {instructor.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {instructor.tags.slice(0, 3).map((tag, i) => (
                     <span 
                     key={tag.id} 
                     className={cn(
                       "bg-gray-100 px-4 py-2 text-[1.4rem] text-gray-600",
                       i % 2 === 0 ? "rounded-[1rem_0]" : "rounded-[0_1rem]"
                     )}
                   >
                     {tag.name}
                   </span>
                  ))}
                </div>
              )}
              
              <p className="mt-4 text-[1.5rem] text-gray-500 line-clamp-3 leading-relaxed">
                {instructor.bio || "لا توجد نبذة شخصية متاحة حالياً لهذا المعلم."}
              </p>
            </div>
          </ItemCard>
        ))}
      </div>
    </div>
  );
}
