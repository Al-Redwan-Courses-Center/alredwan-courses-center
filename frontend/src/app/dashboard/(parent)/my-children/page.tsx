import { getParentChildren } from "@/actions/user";
import ChildRow from "@/components/dashboard/parent/ChildRow";
import { Fragment } from "react/jsx-runtime";

export default async function Page() {
  const myChildren = await getParentChildren();

  return (
    <div className="max-h-[calc(100dvh-10%)] overflow-auto px-6 pt-8 pb-9">
      {myChildren.map((c, i) => (
        <Fragment key={c.id}>
          <ChildRow child={c} index={i} />

          {i + 1 < myChildren.length && (
            <div className="bg-olive-100 mx-auto my-10 h-px w-2/3" />
          )}
        </Fragment>
      ))}
    </div>
  );
}
