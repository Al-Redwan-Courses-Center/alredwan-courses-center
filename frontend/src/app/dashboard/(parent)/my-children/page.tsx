import { getParentChildren, getChildEnrollments, getChildEnrollmentRequests } from "@/actions/user";
import MyChildrenList from "@/components/dashboard/parent/MyChildrenList";
import { EnrollmentRequestListItem } from "@/types/entities";

export default async function Page() {
  const myChildren = await getParentChildren();

  // Fetch enrollments and enrollment requests for all children in parallel
  const childrenData = await Promise.all(
    myChildren.map(async (child) => {
      const [enrollments, enrollmentRequests] = await Promise.all([
        getChildEnrollments(child.id),
        getChildEnrollmentRequests(child.id),
      ]);
      return {
        child,
        enrollments,
        enrollmentRequests,
      };
    })
  );

  // Extract enrollment requests mapping for the feed
  const initialRequests: { [childId: string]: EnrollmentRequestListItem[] } = {};
  childrenData.forEach((item) => {
    initialRequests[item.child.id] = item.enrollmentRequests;
  });

  return (
    <div className="h-full flex flex-col pt-15">
      <MyChildrenList
        initialChildren={myChildren}
        childrenData={childrenData}
        initialRequests={initialRequests}
      />
    </div>
  );
}

