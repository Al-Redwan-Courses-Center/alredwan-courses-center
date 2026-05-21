import { getParentChildren } from "@/actions/user";
import MyChildrenList from "@/components/dashboard/parent/MyChildrenList";

export default async function Page() {
  const myChildren = await getParentChildren();
  const sortedChildren = [...myChildren].sort((a, b) => b.age - a.age);

  return (
    <div className="h-[calc(100dvh-10rem)] overflow-hidden pt-24">
      <MyChildrenList initialChildren={sortedChildren} />
    </div>
  );
}
