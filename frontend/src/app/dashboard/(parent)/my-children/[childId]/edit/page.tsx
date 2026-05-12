import { getChildById } from "@/actions/user";
import AddChildForm from "@/components/dashboard/parent/AddChildForm";
import { notFound } from "next/navigation";
import { protect } from "@/actions/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  await protect(["parent"]);
  const { childId } = await params;
  
  const child = await getChildById(childId);

  if (!child) {
    return notFound();
  }

  return (
    <div className="px-4 md:px-8 min-[1000px]:px-16 pt-8 md:pt-15 flex flex-col gap-10 h-full overflow-auto pb-20">
      <h3 className="text-olive-700 font-medad text-6xl">
        تعديل بيانات الطفل
      </h3>

      <AddChildForm initialData={child} />
    </div>
  );
}
