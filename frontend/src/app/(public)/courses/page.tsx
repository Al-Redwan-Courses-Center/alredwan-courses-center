export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicCourses } from "@/actions/courses";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";

export const metadata: Metadata = {
  title: "الدورات",
};

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const season =
    typeof searchParams.season === "string" ? searchParams.season : undefined;

  const paginatedCourses = await getPublicCourses({
    page,
    search,
    season,
    page_size: 8,
  });

  return (
    <div className="mx-auto max-h-full w-full max-w-[1280px] px-6 md:px-16 pt-10 pb-50">
      <Suspense fallback={null}>
        <DashboardAllCoursesView
          courses={paginatedCourses.results}
          totalCount={paginatedCourses.count}
          totalPages={paginatedCourses.total_pages}
          currentPage={paginatedCourses.current_page}
          linkTo="landing"
        />
      </Suspense>
    </div>
  );
}
