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
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim().length === 0) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }; 

  const hasSrc = typeof src === "string" && isValidUrl(src);

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
