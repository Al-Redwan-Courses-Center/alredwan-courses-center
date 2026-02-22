import DefaultUser from "@/assets/images/default-user.svg";
import { cn } from "@/lib/utils";
import Image, { StaticImageData } from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  fallbackSrc?: StaticImageData | string;
  fallbackAlt?: string;
  draggable?: boolean;
  priority?: boolean;
}

export default function Avatar({
  src,
  alt = "User Avatar",
  className,
  imageClassName,
  fallbackClassName,
  fallbackSrc = DefaultUser,
  fallbackAlt = "Default User Illustration",
  draggable = false,
  priority = false,
}: AvatarProps) {
  const hasSrc = typeof src === "string" && src.trim().length > 0;

  return (
    <div
      className={cn(
        "relative aspect-square rounded-full",
        className,
        !hasSrc && fallbackClassName,
      )}
    >
      <Image
        src={hasSrc ? src.trim() : fallbackSrc}
        alt={hasSrc ? alt : fallbackAlt}
        fill
        className={cn("object-cover", imageClassName)}
        draggable={draggable}
        priority={priority}
      />
    </div>
  );
}
