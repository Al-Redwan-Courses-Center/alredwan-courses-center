import PublicCourseCatalog from "@/components/courses/PublicCourseCatalog";
import { Metadata } from "next";
import { Suspense } from "react";
import { getPublicCourses } from "@/actions/courses";
import { getPublicOnlineCourses } from "@/actions/online-courses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "الدورات | واحة الرضوان",
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

  const [paginatedCourses, onlineCourses] = await Promise.all([
    getPublicCourses({
      page,
      search,
      season,
      page_size: 8,
    }),
    getPublicOnlineCourses(),
  ]);

  return (
    <div className="mx-auto max-h-full w-full max-w-[1400px] px-4 pt-10 pb-50 md:px-10">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            جاري التحميل...
          </div>
        }
      >
        <PublicCourseCatalog
          physical={paginatedCourses.results}
          totalCount={paginatedCourses.count}
          totalPages={paginatedCourses.total_pages}
          currentPage={paginatedCourses.current_page}
          online={onlineCourses}
        />
      </Suspense>
    </div>
  );
}
