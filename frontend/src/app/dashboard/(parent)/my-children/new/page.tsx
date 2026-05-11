import { protect } from "@/actions/auth";
import AddChildForm from "@/components/dashboard/parent/AddChildForm";

export default async function Page() {
  await protect(["parent"]);

  return (
    <div className="px-16 pt-15 flex flex-col gap-10 h-full overflow-auto pb-20">
      <h3 className="text-olive-700 font-medad text-6xl">
        إضافة طفل جديد
      </h3>

      <AddChildForm />
    </div>
  );
}

