import { cn } from "@/lib/utils";
import Image from "next/image";
import DefaultUser from "@/assets/images/default-user.svg";

interface StudentHeaderInfoProps {
  name: string;
  number: number;
  avatar?: string;
  className?: string;
}

function StudentHeaderInfo({
  name,
  number,
  avatar,
  className,
}: StudentHeaderInfoProps) {
  return (
    <div className={cn("flex items-center justify-start gap-3", className)}>
      <div className="flex items-center justify-start gap-2">
        <div className="flex items-center justify-start gap-1.5">
          <div className="h-8 w-8 rounded-full bg-gray-300" />
          <div className="h-4 w-auto justify-start text-xl font-normal text-gray-600">
            {number}-
          </div>
          <Image
            src={avatar || DefaultUser}
            alt={name}
            className="h-10 w-10 rounded-full"
          />
        </div>
        <div className="h-4 w-24 justify-start text-xl font-normal text-gray-600">
          {name}
        </div>
      </div>
    </div>
  );
}
export default StudentHeaderInfo;
