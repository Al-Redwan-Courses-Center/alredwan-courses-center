import Image, { StaticImageData } from "next/image";
import StatusBadge from "@/components/ui/StatusBadge";

interface CourseHeaderProps {
  courseName: string;
  courseDescription: string;
  courseImage: string | StaticImageData;
  status: string;
}

export default function CourseHeader({
  courseName,
  courseDescription,
  courseImage,
  status,
}: CourseHeaderProps) {
  const getStatusBadge = () => {
    if (status === "active") {
      return <StatusBadge color="green">نشط</StatusBadge>;
    }
    if (status === "completed") {
      return <StatusBadge color="gray">مكتمل</StatusBadge>;
    }
    return null;
  };

  return (
    <>
      {/* Course Header Image */}
      <div className="relative h-96 w-full sm:h-48 md:h-72">
        <Image
          src={courseImage}
          alt={courseName}
          fill
          className="object-cover"
          draggable={false}
        />

        {/* Status Badge Overlay */}
        <div className="absolute top-8 right-8 sm:top-4 sm:right-4 md:top-6 md:right-6">
          {getStatusBadge()}
        </div>
      </div>

      {/* Course Name & Description */}
      <div className="p-12 sm:p-6 md:p-8">
        <h1 className="text-olive-700 mb-6 text-6xl font-bold sm:mb-4 sm:text-3xl md:mb-5 md:text-4xl">
          {courseName}
        </h1>

        <p className="mb-8 text-3xl leading-relaxed text-gray-600 sm:mb-5 sm:text-lg md:mb-6 md:text-2xl">
          {courseDescription}
        </p>
      </div>
    </>
  );
}
