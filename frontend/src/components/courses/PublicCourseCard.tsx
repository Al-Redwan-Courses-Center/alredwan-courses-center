import { Book, Calendar, BookOpen, Users } from "lucide-react";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shadcn/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/components/ui/accordion";
import { cn, formatDate, getArabicPlural, toHindiDigits } from "@/lib/utils";
import { CourseListItem } from "@/types/entities";
import { parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export default function PublicCourseCard({
  course,
  index,
  linkTo = "landing",
}: {
  course: CourseListItem;
  index: number;
  linkTo?: "dashboard" | "landing";
}) {
  const startDate = parseISO(course.start_date);
  const lectureCount = course.num_lectures;
  const isCourseImageValid = course.image?.startsWith("https");

  const isEven = index % 2 === 0;
  const targetHref =
    linkTo === "dashboard"
      ? `/dashboard/courses/${course.id}`
      : `/courses/${course.id}`;

  return (
    <>
      <div className="block w-full md:hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value={`course-${course.id}`}
            className="overflow-hidden rounded-[1rem] border-none bg-[#F5F5F5]"
          >
            <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
              <div className="flex w-full items-center gap-4 text-right">
                <div className="relative flex h-[3.5rem] w-[3.5rem] shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#007D79]">
                  {!!course.image && isCourseImageValid ? (
                    <Image
                      src={course.image}
                      fill
                      alt=""
                      className="object-cover opacity-50"
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-white" />
                  )}
                </div>
                <span className="line-clamp-2 flex-1 text-[1.2rem] leading-tight font-bold text-[#000000]">
                  {course.name}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pt-1 pb-5">
              <p className="mb-4 line-clamp-2 text-right text-[1.1rem] leading-relaxed text-[#727272]">
                {course.description}
              </p>

              <ul className="flex flex-col gap-3 text-[1.1rem] text-[#727272] [&_svg]:h-[1.2rem] [&_svg]:w-[1.2rem] [&_svg]:text-[#007D79] [&>li]:flex [&>li]:items-center [&>li]:gap-2">
                <li>
                  <Calendar />
                  <span>
                    البداية:{" "}
                    <span className="text-[#000000]">
                      {formatDate(startDate)}
                    </span>
                  </span>
                </li>
                <li>
                  <Book />
                  <span>
                    <span className="text-[#000000]">
                      {toHindiDigits(lectureCount)}
                    </span>{" "}
                    {getArabicPlural(lectureCount, {
                      singular: "محاضرة",
                      twofer: "محاضرتان",
                      plural: "محاضرات",
                    })}
                  </span>
                </li>
                <li>
                  <Users />
                  <span>
                    الأماكن المتاحة:{" "}
                    <span className="font-bold text-[#000000]">
                      {toHindiDigits(course.available_spots)}
                    </span>{" "}
                    من {toHindiDigits(course.capacity)}
                  </span>
                </li>
              </ul>

              <div className="mt-5 flex justify-center">
                <Button
                  asChild
                  className="h-[3rem] w-full max-w-[20rem] rounded-[0.56rem] bg-[#727272] text-[1.2rem] text-white hover:bg-gray-600"
                >
                  <Link href={targetHref}>عرض الكورس</Link>
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ── Desktop View (Leaf Card) ────────────────────────────────── */}
      <Card
        className={cn(
          "group hidden h-[37.4rem] flex-col overflow-hidden border-none bg-white transition-all hover:-translate-y-1 md:flex",
          "shadow-[4.9px_4.2px_10.3px_rgba(0,0,0,0.03)] hover:shadow-[4.9px_8px_15px_rgba(0,0,0,0.06)]",
          isEven
            ? "rounded-[13.8rem_0_13.8rem_13.8rem]"
            : "rounded-[0_13.8rem_13.8rem_13.8rem]",
        )}
      >
        <CardHeader className="p-0">
          <div className="relative flex h-[14.5rem] w-full items-center justify-center overflow-hidden bg-[#007D79] px-6 text-center text-white">
            {!!course.image && isCourseImageValid ? (
              <Image
                src={course.image}
                fill
                alt={course.name}
                draggable="false"
                className="object-cover opacity-40 mix-blend-overlay transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <BookOpen className="absolute top-[-20px] right-[-20px] h-32 w-32 opacity-10" />
            )}
            <span className="relative z-10 text-[1.6rem] leading-tight font-bold">
              {course.name}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex grow flex-col px-8 py-5">
          <h3 className="mb-2 line-clamp-1 text-center text-[1.28rem] font-bold text-[#000000]">
            {course.name}
          </h3>

          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            {course.tags.length > 0 ? (
              course.tags.map((tag, i) => (
                <span
                  className="inline-block rounded-full bg-[#F5F5F5] px-3 py-0.5 text-[0.9rem] text-[#727272]"
                  key={i}
                >
                  {tag.name}
                </span>
              ))
            ) : (
              <span className="inline-block rounded-full bg-[#F5F5F5] px-3 py-0.5 text-[0.9rem] text-[#727272]">
                عام
              </span>
            )}
          </div>

          <ul className="mt-auto flex flex-col gap-[0.8rem] text-[0.85rem] leading-[1.14rem] [&_svg]:h-[1rem] [&_svg]:w-[1rem] [&_svg]:text-[#007D79] [&>li]:flex [&>li]:items-center [&>li]:gap-2">
            <li>
              <Calendar />
              <span className="text-[#727272]">
                يبدأ:{" "}
                <span className="text-[#000000]">{formatDate(startDate)}</span>
              </span>
            </li>

            <li>
              <Book />
              <span className="text-[#727272]">
                <span className="text-[#000000]">
                  {toHindiDigits(lectureCount)}
                </span>{" "}
                {getArabicPlural(lectureCount, {
                  singular: "محاضرة",
                  twofer: "محاضرتان",
                  plural: "محاضرات",
                })}
              </span>
            </li>

            <li>
              <Users />
              <span className="text-[#727272]">
                الأماكن المتاحة:{" "}
                <span className="font-bold text-[#000000]">
                  {toHindiDigits(course.available_spots)}
                </span>{" "}
                من {toHindiDigits(course.capacity)}
              </span>
            </li>
          </ul>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-3 px-8 pt-0 pb-5">
          <Button
            asChild
            className="h-[3rem] w-full max-w-[24.4rem] rounded-[0.56rem] bg-[#000000] px-4 text-[1.2rem] text-white hover:bg-gray-800"
          >
            <Link href={targetHref}>عرض التفاصيل</Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
