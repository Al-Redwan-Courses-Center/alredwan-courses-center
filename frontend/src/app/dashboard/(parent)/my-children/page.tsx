import ChildRow from "@/components/dashboard/parent/ChildRow";
import { getMyChildren } from "@/dev-data/db";
import { Fragment } from "react/jsx-runtime";

export default function Page() {
  const myChildren = getMyChildren();

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
