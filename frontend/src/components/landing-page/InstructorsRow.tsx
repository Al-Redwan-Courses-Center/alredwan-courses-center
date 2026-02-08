import InstructorProfile from "@/assets/instructor-profile.png";
import { LANDING_PAGE_INSTRUCTORS } from "@/dev-data/db";
import { cn, getArabicPlural, toHindiDigits } from "@/lib/utils";
import Image from "next/image";
import { differenceInCalendarYears } from "date-fns";

const straight = cn("rounded-tr-[19rem] rounded-bl-[19rem]");
const reversed = cn("rounded-tl-[19rem] rounded-br-[19rem]");

export default async function InstructorsRow() {
  const {
    data: { instructors },
  }: {
    status: string;
    data: { instructors: (typeof LANDING_PAGE_INSTRUCTORS)[number][] };
  } = await new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          status: "success",
          data: {
            instructors: LANDING_PAGE_INSTRUCTORS,
          },
        }),
      1500,
    ),
  );

  return (
    <div className="tablet:grid-cols-1 tablet:gap-40 grid w-full grid-cols-3 gap-20 text-[1.5rem] text-gray-600">
      {instructors.map(({ instructor }, i) => {
        const joinDate = new Date(instructor.joined_at);
        const yearsOfExp = differenceInCalendarYears(new Date(), joinDate);

        return (
          <div
            key={instructor.id}
            className={cn(
              "shadow-soft relative min-h-151 bg-[linear-gradient(181deg,#FFF_3.72%,#93A494_180.46%)] px-10 py-16",
              i % 2 === 0 ? straight : reversed,
            )}
          >
            <div
              className={cn(
                "absolute bottom-0 left-0 flex w-full justify-end overflow-clip",
                i % 2 === 0 ? straight : reversed,
              )}
              draggable="false"
            >
              <Image
                src={InstructorProfile}
                alt={instructor.name + "Picture"}
                className="relative z-20 w-130 object-cover"
                draggable="false"
              />
            </div>

            <div className="relative z-10 pr-10">
              <div className="mb-30 pr-15">
                <h4 className="text-olive-500 text-[2.8rem] font-bold">
                  {instructor.name}
                </h4>
                <p className="text-beige-500 text-[1.8rem]">
                  {instructor.job_title}
                </p>
              </div>

              <ul>
                {/* <li>{instructor.specialization}</li> */}
                <li>
                  <span className="font-bold">
                    {yearsOfExp > 2 && toHindiDigits(yearsOfExp)}
                  </span>{" "}
                  {getArabicPlural(yearsOfExp, {
                    singular: "سنة",
                    twofer: "سنتين",
                    plural: "سنوات",
                  })}{" "}
                  خبرة
                </li>
                {/* <li className="mt-4 max-w-50 text-[1.2rem]">
                  {instructor.qualification}
                </li> */}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
