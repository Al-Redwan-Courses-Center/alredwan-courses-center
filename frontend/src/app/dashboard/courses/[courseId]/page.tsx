import { getUser } from "@/actions/auth";
import { getCourseById } from "@/actions/courses";
import {
  getMyEnrollmentRequests,
  getMyEnrollments,
} from "@/actions/enrollments";
import { getParentChildren } from "@/actions/user";
import CourseImage from "@/assets/course-img.jpg";
import CoursePurchaseModal from "@/components/courses/CoursePurchaseModal";
import BookIcon from "@/components/icons/BookIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import InstructorIcon from "@/components/icons/InstructorIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import Button from "@/components/ui/Button";
import {
  formatDate,
  formatTime,
  getArabicPlural,
  toHindiDigits,
} from "@/lib/utils";
import { parseISO } from "date-fns";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [course, user] = await Promise.all([
    getCourseById(courseId),
    getUser(),
  ]);
  const isParent = user.role === "parent";
  const enrollmentRole = isParent ? "parent" : "student";

  const [myEnrollments, myEnrollmentRequests, parentChildren] =
    await Promise.all([
      getMyEnrollments(),
      isParent ? Promise.resolve([]) : getMyEnrollmentRequests(),
      isParent ? getParentChildren() : Promise.resolve([]),
    ]);

  const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

  const enrolledChildNamesInCourse = new Set(
    myEnrollments
      .filter(
        (enrollment) =>
          String(enrollment.course) === String(courseId) &&
          enrollment.participant_type === "child" &&
          !!enrollment.participant_name,
      )
      .map((enrollment) => normalizeName(enrollment.participant_name!)),
  );

  const childrenOptions = parentChildren.filter((child) => {
    const fullName = normalizeName(`${child.first_name} ${child.last_name}`);

    return !enrolledChildNamesInCourse.has(fullName);
  });

  // TODO(enrollment-parent-rules): Replace name-based matching with child-id-based enrollment payload when backend exposes stable child identifiers in enrollments list.

  const hasActiveEnrollment = myEnrollments.some(
    (enrollment) => String(enrollment.course) === String(courseId),
  );

  if (!isParent && hasActiveEnrollment) {
    redirect(`/dashboard/my-courses/${courseId}/lectures`);
  }

  const activeEnrollmentRequest = myEnrollmentRequests.find(
    (request) =>
      String(request.course) === String(courseId) &&
      ["pending", "processing"].includes(request.status),
  );

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center px-16">
        <div className="shadow-soft rounded-[2.5rem_0] bg-gray-50 px-16 py-12 text-center">
          <h2 className="text-olive-500 mb-4 text-5xl font-bold">
            لم نتمكن من تحميل تفاصيل الدورة
          </h2>
          <p className="mb-8 text-2xl text-gray-600">
            حاول مرة أخرى أو ارجع لقائمة الدورات المتاحة.
          </p>
          <Button href="/dashboard/courses" size="small">
            العودة إلى الدورات
          </Button>
        </div>
      </div>
    );
  }

  const lectureCount = course.num_lectures;

  return (
    <main className="h-full overflow-hidden px-16 py-8">
      <div className="grid h-full w-full grid-rows-[auto_1fr] gap-6">
        <div className="flex items-center">
          <Button
            href="/dashboard/courses"
            variant="secondary"
            size="small"
            className="w-fit px-10"
          >
            العودة إلى كل الدورات
          </Button>
        </div>

        <div className="grid min-h-0 grid-rows-[1fr_1fr] gap-8">
          <section className="shadow-soft grid h-full min-h-0 grid-cols-[1fr_1fr] gap-8 rounded-[3.2rem_0] bg-[linear-gradient(164deg,#EDF0ED_12.23%,#F8F9F8_88.43%)] p-8">
            <div className="relative min-h-95 overflow-hidden rounded-[2.2rem_0] bg-gray-200">
              <Image
                src={course.image || CourseImage}
                alt={course.name}
                fill
                className="object-cover"
                draggable="false"
                priority
              />
            </div>

            <div className="flex min-h-0 flex-col overflow-y-auto pe-2">
              <div className="mb-5 flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <span
                    key={tag.id}
                    className={`bg-gray-100 px-4 py-2 text-xl ${
                      index % 2 === 0 ? "rounded-[1rem_0]" : "rounded-[0_1rem]"
                    }`}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <h1 className="text-olive-500 mb-4 text-6xl leading-tight font-bold">
                {course.name}
              </h1>

              <p className="mb-7 line-clamp-4 text-[2rem] text-gray-600">
                {course.description}
              </p>

              <div className="[&_svg]:text-olive-500 mb-8 grid grid-cols-2 gap-4 text-[1.7rem] font-semibold [&_svg]:h-8 [&_svg]:w-auto">
                <div className="flex items-center gap-2 rounded-[1.2rem_0] bg-gray-100 px-4 py-3">
                  <CalendarIcon />
                  <span>تبدأ: {formatDate(parseISO(course.start_date))}</span>
                </div>

                <div className="flex items-center gap-2 rounded-[0_1.2rem] bg-gray-100 px-4 py-3">
                  <BookIcon />
                  <span>
                    {toHindiDigits(lectureCount)}{" "}
                    {getArabicPlural(lectureCount, {
                      singular: "محاضرة",
                      twofer: "محاضرتان",
                      plural: "محاضرات",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-[0_1.2rem] bg-gray-100 px-4 py-3">
                  <PeopleIcon />
                  <span>
                    المتاح: {toHindiDigits(course.available_spots)} /{" "}
                    {toHindiDigits(course.capacity)}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-[1.2rem_0] bg-gray-100 px-4 py-3">
                  <InstructorIcon />
                  <span>المعلم: {course.instructor.name}</span>
                </div>
              </div>

              <div className="mt-auto rounded-[2rem_0] bg-white px-6 py-5 shadow-inner">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xl text-gray-600">رسوم الدورة</p>
                    <p className="text-olive-500 text-5xl font-bold">
                      {toHindiDigits(course.price)} جنيه
                    </p>
                  </div>

                  <p className="text-right text-[1.4rem] text-gray-600">
                    احجز مكانك الآن قبل اكتمال العدد
                  </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-4">
                  {activeEnrollmentRequest ? (
                    <Button className="w-full" disabled>
                      طلبك قيد المراجعة
                    </Button>
                  ) : (
                    <CoursePurchaseModal
                      role={enrollmentRole}
                      courseId={courseId}
                      coursePrice={course.price}
                      childrenOptions={childrenOptions}
                    />
                  )}

                  <Button
                    href="/contact-us"
                    variant="secondary"
                    revert
                    className="w-full"
                  >
                    تواصل للاستفسار
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid h-full min-h-0 grid-cols-2 gap-8">
            <div className="shadow-soft flex min-h-0 flex-col rounded-[0_2.5rem] bg-gray-50 p-8">
              <h2 className="text-olive-500 mb-6 text-4xl font-bold">
                لماذا هذه الدورة؟
              </h2>

              <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto pe-2 text-[1.9rem] text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-olive-500 text-3xl">•</span>
                  <span>شرح مبسط ومناسب للفئة العمرية المستهدفة.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-olive-500 text-3xl">•</span>
                  <span>برنامج منظم على مدار الموسم الدراسي بشكل واضح.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-olive-500 text-3xl">•</span>
                  <span>متابعة مباشرة من المعلم مع عدد محدود من المقاعد.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-olive-500 text-3xl">•</span>
                  <span>محتوى عملي يركز على التطبيق والمراجعة المستمرة.</span>
                </li>
              </ul>
            </div>

            <div className="shadow-soft flex min-h-0 flex-col rounded-[2.5rem_0] bg-gray-50 p-8">
              <h2 className="text-olive-500 mb-6 text-4xl font-bold">
                المواعيد والتفاصيل
              </h2>

              <div className="mb-6 rounded-[1.5rem_0] bg-white p-5 shadow-inner">
                <p className="mb-2 text-xl text-gray-600">فترة الدورة</p>
                <p className="text-[1.8rem] font-bold text-gray-900">
                  {formatDate(parseISO(course.start_date))}
                  {course.end_date
                    ? ` - ${formatDate(parseISO(course.end_date))}`
                    : " (مستمرة)"}
                </p>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pe-2">
                {course.schedules.length ? (
                  course.schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="rounded-[1.2rem_0] bg-white px-5 py-4 shadow-inner"
                    >
                      <div className="mb-2 flex items-center gap-2 text-[1.6rem] font-bold text-gray-900">
                        <CalendarIcon className="text-olive-500 h-7 w-auto" />
                        <span>{schedule.weekday_display}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[1.5rem] text-gray-600">
                        <ClockIcon className="text-olive-500 h-7 w-auto" />
                        <span>
                          {String(formatTime(schedule.start_time) || "--:--")} -{" "}
                          {String(formatTime(schedule.end_time) || "--:--")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem_0] bg-white px-5 py-4 text-[1.5rem] text-gray-600 shadow-inner">
                    سيتم تحديد جدول المحاضرات وتحديثه قريبًا.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
