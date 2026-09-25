import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import ImageLightbox from "@/components/ui/ImageLightbox";

/**
 * Hero of the public course pages.
 *
 * Desktop keeps the full-bleed `object-cover` hero with the title overlaid on
 * a gradient. On `tablet` and below the image becomes a 4:3 box with a blurred
 * cover copy behind an `object-contain` copy (so nothing is cropped) and the
 * title block moves under the image. Tapping the image opens it in a lightbox.
 */
export default function PublicCourseHero({
  imageSrc,
  imageAlt,
  children,
}: {
  imageSrc: string | StaticImageData;
  imageAlt: string;
  /** Tags, title and meta rendered over (desktop) or under (mobile) the image. */
  children: ReactNode;
}) {
  return (
    <section>
      <div className="tablet:aspect-[4/3] tablet:h-auto tablet:max-h-[60vh] tablet:bg-olive-900 relative h-[50vh] w-full overflow-hidden lg:h-[60vh]">
        {/* Blurred backdrop so the contained image never sits on a flat colour (mobile only). */}
        <Image
          src={imageSrc}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="tablet:block hidden scale-110 object-cover opacity-70 blur-2xl"
          draggable="false"
        />

        <ImageLightbox
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="100vw"
            className="tablet:object-contain object-cover"
            draggable="false"
            priority
          />
        </ImageLightbox>

        {/* Desktop overlay: the gradient and text never intercept taps on the image. */}
        <div className="tablet:hidden pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 text-white lg:p-20 [&_a]:pointer-events-auto">
          <div className="container mx-auto">{children}</div>
        </div>
      </div>

      {/* Mobile title block under the image. */}
      <div className="tablet:block bg-olive-900 hidden px-6 py-8 text-white">
        <div className="container mx-auto">{children}</div>
      </div>
    </section>
  );
}
