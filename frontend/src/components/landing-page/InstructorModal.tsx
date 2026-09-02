import { type ReactNode, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { LandingPageInstructorDetail } from "@/types/entities";
import Image from "next/image";
import InstructorProfile from "@/assets/instructor-profile.png";
import Logo from "@/assets/logo.svg";

export default function InstructorModal({
  trigger,
  instructor,
}: {
  trigger: ReactNode;
  instructor: LandingPageInstructorDetail;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>{trigger}</ModalTrigger>
      <ModalContent
        className={cn(
          "flex max-h-[92vh] w-[95vw] max-w-4xl flex-col p-6 sm:p-10",
          "overflow-hidden",
        )}
        showCloseButton={true}
      >
        {/* Header Section */}
        <ModalTitle asChild>
          <div className="mb-4 flex shrink-0 flex-col items-center gap-4 text-center sm:items-start sm:text-right">
            <Image
              src={Logo}
              alt="Logo Illustration"
              className="h-auto w-28 sm:w-36"
              draggable={false}
            />
            <div className="flex flex-col gap-1">
              <ModalDescription className="text-muted-foreground text-base sm:text-lg">
                أهلاً بك في واحة الرضوان التعليمية
              </ModalDescription>
              <span className="text-xl font-bold sm:text-2xl">
                المعلمون المتميزون
              </span>
            </div>
          </div>
        </ModalTitle>

        {/* Instructor Name */}
        <div className="mb-6 flex shrink-0 flex-col items-center sm:items-start">
          <h1 className="text-center text-4xl font-extrabold sm:text-right sm:text-6xl md:text-7xl">
            {instructor.name}
          </h1>
        </div>

        {/* Content Body (Image + Bio) */}
        <div className="flex flex-1 flex-col items-center gap-6 overflow-hidden md:flex-row md:items-start">
          {/* Instructor Image - Fixed cropping issue using object-contain / proper framing */}
          <div className="bg-muted/50 border-border relative flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border sm:h-56 sm:w-56 md:h-64 md:w-64">
            <Image
              src={instructor.image_url || InstructorProfile}
              alt={instructor.name + " Picture"}
              width={300}
              height={300}
              className="h-full w-full object-contain object-top"
              draggable="false"
            />
          </div>

          {/* Bio Section with larger font and independent scrolling */}
          <div className="max-h-[40vh] flex-1 overflow-y-auto pr-2 pl-1 md:max-h-[50vh]">
            <p className="text-justify text-4xl leading-relaxed font-medium break-words whitespace-pre-wrap sm:text-3xl md:text-4xl">
              {instructor.bio}
            </p>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
