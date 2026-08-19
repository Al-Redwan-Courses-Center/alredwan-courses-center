import { differenceInCalendarYears } from "date-fns";
import Image from "next/image";
import InstructorProfile from "@/assets/instructor-profile.png";
import { cn, getArabicPlural, toHindiDigits } from "@/lib/utils";
import type { LandingPageInstructor } from "@/types/entities";

const straight = cn("rounded-[0_19rem]");
const reversed = cn("rounded-[19rem_0]");

interface InstructorsRowProps {
  instructors: LandingPageInstructor[];
}

export default function InstructorsRow({ instructors }: InstructorsRowProps) {
  if (instructors.length <= 0) return null;

  return (
    <div className="tablet:gap-40 laptop:grid-cols-1 laptop:px-55 desktop-sm:grid-cols-2 desktop-sm:gap-y-40 grid w-full grid-cols-3 gap-20 text-[1.5rem] text-gray-600">
      {instructors.slice(0, 3).map(({ instructor }, i) => {
        const joinDate = new Date(instructor.joined_date);
        const yearsOfExp = differenceInCalendarYears(new Date(), joinDate);

        return (
          <div
            key={instructor.id}
            className={cn(
              "shadow-soft mobile-lg:px-5 relative min-h-151 bg-[linear-gradient(181deg,#FFF_3.72%,#93A494_180.46%)] px-10 py-16",
              i % 2 === 0 ? straight : reversed,
            )}
          >
            <div
              className={cn(
                "absolute bottom-0 left-0 flex w-full justify-end overflow-clip rounded-t-none!",
                i % 2 === 0 ? straight : reversed,
              )}
              draggable="false"
            >
              <Image
                src={InstructorProfile}
                alt={instructor.name + "Picture"}
                className="mobile-lg:-left-30 relative z-20 w-130 object-cover"
                draggable="false"
              />
            </div>

            <div className="relative z-10 pr-10">
              <div className="mb-30 pr-15">
                <h4 className="text-olive-500 max-w-85 text-[2.8rem] font-bold">
                  {instructor.name}
                </h4>
                <p className="text-beige-500 max-w-80 text-[1.8rem]">
                  {instructor.bio}
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
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
