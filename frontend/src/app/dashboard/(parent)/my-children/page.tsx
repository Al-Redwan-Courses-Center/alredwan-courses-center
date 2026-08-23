export const dynamic = "force-dynamic";

import { Plus } from "lucide-react";
import {
  getChildEnrollmentRequests,
  getChildEnrollments,
  getParentChildren,
} from "@/actions/user";
import { AddChildButton } from "@/components/dashboard/parent/AddChildButtons";
import MyChildrenList from "@/components/dashboard/parent/MyChildrenList";
import type { EnrollmentRequestListItem } from "@/types/entities";

export default async function Page() {
  const myChildren = await getParentChildren();

  if (myChildren.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-6">
        <div className="bg-olive-50 p-10 rounded-full">
          <Plus size={80} className="text-olive-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-olive-700 font-medad text-5xl">
            لا يوجد أطفال مضافون بعد
          </h3>
          <p className="text-gray-600 text-2xl">
            ابدأ بإضافة أطفالك لتتمكن من إلحاقهم بالدورات التدريبية
          </p>
        </div>
        <AddChildButton className="bg-olive-500 hover:bg-olive-600 text-white px-12 py-5 rounded-[0.5rem_2rem] font-bold text-3xl flex items-center gap-4 shadow-lg transition-transform hover:scale-105" />
      </div>
    );
  }

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
    }),
  );

  // Extract enrollment requests mapping for the feed
  const initialRequests: { [childId: string]: EnrollmentRequestListItem[] } =
    {};
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
