import { Suspense } from "react";
import { getUser } from "@/actions/auth";
import { getAllCourses } from "@/actions/courses";
import { getAllOnlineCourses } from "@/actions/online-courses";
import PublicCourseCatalog from "@/components/courses/PublicCourseCatalog";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const season =
    typeof searchParams.season === "string" ? searchParams.season : undefined;

  const [{ first_name }, physicalCourses, onlineCourses] = await Promise.all([
    getUser(),
    getAllCourses({
      page,
      search,
      season,
      page_size: 8,
    }),
    getAllOnlineCourses({
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
          <PublicCourseCatalog
            physical={physicalCourses}
            online={onlineCourses}
            linkTo="dashboard"
          />
        </Suspense>
      </div>
    </div>
  );
}
