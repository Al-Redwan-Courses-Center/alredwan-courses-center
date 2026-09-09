export const dynamic = "force-dynamic";

import { getUser } from "@/actions/auth";
import { getGeneralMemories } from "@/actions/memories";
import MemoriesClient from "@/components/dashboard/memories/MemoriesClient";

export default async function MemoriesPage() {
  const [initialData, user] = await Promise.all([
    getGeneralMemories(1, 12),
    getUser(),
  ]);

  return (
    <div className="px-16 py-26">
      <div className="font-medad text-olive-300 mb-15 flex flex-col gap-10 text-6xl">
        <span className="text-olive-700">السلام عليكم</span>
        <span>ذكريات المسجد</span>
      </div>

      <MemoriesClient
        initialMemories={initialData.results}
        initialHasMore={Boolean(initialData.next)}
        role={user.role}
      />
    </div>
  );
}
