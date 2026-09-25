import Image, { type StaticImageData } from "next/image";
import DefaultUser from "@/assets/images/default-user.svg";
import { cn } from "@/lib/utils";

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
        "relative aspect-square shrink-0 overflow-hidden rounded-full",
        className,
        !hasSrc && fallbackClassName,
      )}
    >
      {hasSrc && src.startsWith("http") ? (
        <Image
          src={src.trim()}
          alt={alt}
          fill
          className={cn("object-cover", imageClassName)}
          draggable={draggable}
        />
      ) : (
        <Image
          src={hasSrc ? src.trim() : fallbackSrc}
          alt={hasSrc ? alt : fallbackAlt}
          fill
          className={cn("object-cover", imageClassName)}
          draggable={draggable}
          priority={priority}
        />
      )}
    </div>
  );
}
