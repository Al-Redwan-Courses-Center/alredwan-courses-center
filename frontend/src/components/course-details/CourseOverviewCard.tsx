import { StaticImageData } from "next/image";
import CourseHeader from "./CourseHeader";
import CourseDetailsGrid from "./CourseDetailsGrid";
import PaymentInfo from "./PaymentInfo";
import ProgressSection from "./ProgressSection";

interface Instructor {
  user: {
    first_name: string;
    last_name: string;
  };
}

interface CourseOverviewCardProps {
  courseName: string;
  courseDescription: string;
  courseImage: string | StaticImageData;
  coursePrice: number;
  status: string;
  paymentStatus: string;
  instructor?: Instructor;
  numLectures: number;
  startDate: string;
  endDate?: string;
  totalPrice: number;
  amountPaid: number;
  progressPercentage?: number;
  attendanceRate?: number;
}

export default function CourseOverviewCard({
  courseName,
  courseDescription,
  courseImage,
  status,
  paymentStatus,
  instructor,
  numLectures,
  startDate,
  endDate,
  totalPrice,
  amountPaid,
  progressPercentage,
  attendanceRate,
}: CourseOverviewCardProps) {

  return (
      <div className="shadow-primary mb-12 w-full overflow-clip rounded-[1.8rem_0] bg-white sm:mb-8 sm:rounded-[1rem_0] md:mb-10 md:rounded-[1.4rem_0]">
        <CourseHeader
          courseName={courseName}
          courseDescription={courseDescription}
          courseImage={courseImage}
          status={status}
        />

        <CourseDetailsGrid
          instructor={instructor}
          numLectures={numLectures}
          startDate={startDate}
          endDate={endDate}
        />

        <PaymentInfo
          totalPrice={totalPrice}
          amountPaid={amountPaid}
          paymentStatus={paymentStatus}
        />

        <ProgressSection
          progressPercentage={progressPercentage}
          attendanceRate={attendanceRate}
        />
    </div>
  );
}
