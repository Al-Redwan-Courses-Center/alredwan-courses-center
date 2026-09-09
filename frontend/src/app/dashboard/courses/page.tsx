import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import DashboardAllCoursesView from "@/components/dashboard/DashboardAllCoursesView";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const season =
    typeof searchParams.season === "string" ? searchParams.season : undefined;

  const [{ first_name }, paginatedCourses] = await Promise.all([
    getUser(),
    getAllCourses({
      page,
      search,
      season,
      page_size: 8,
    }),
  ]);

  return (
    <div className="flex flex-col pt-15 min-[1000px]:pt-32">
      <h1 className="dashboard-greeting relative z-60 mb-14 ps-16">
        السلام عليكم يا {first_name}
      </h1>

      <div className="w-full">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-xl text-gray-500">
              جاري التحميل...
            </div>
          }
        >
          <DashboardAllCoursesView
            courses={paginatedCourses.results}
            totalCount={paginatedCourses.count}
            totalPages={paginatedCourses.total_pages}
            currentPage={paginatedCourses.current_page}
            linkTo="dashboard"
          />
        </Suspense>
      </div>
    </div>
  );
}
