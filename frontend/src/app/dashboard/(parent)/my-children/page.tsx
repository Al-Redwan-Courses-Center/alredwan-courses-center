import { getParentChildren } from "@/actions/user";
import MyChildrenList from "@/components/dashboard/parent/MyChildrenList";

export default async function Page() {
  const myChildren = await getParentChildren();

  return (
    <div className="h-[calc(100dvh-10rem)] overflow-hidden pt-24">
      <MyChildrenList initialChildren={myChildren} />
    </div>
  );
}
