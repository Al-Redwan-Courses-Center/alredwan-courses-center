import Image from "next/image";
import Image1 from "@/assets/image-grid/image-1.webp";
import Image2 from "@/assets/image-grid/image-2.webp";
import Image3 from "@/assets/image-grid/image-3.webp";
import Image4 from "@/assets/image-grid/image-4.webp";
import Image5 from "@/assets/image-grid/image-5.webp";
import Image6 from "@/assets/image-grid/image-6.webp";
import Image7 from "@/assets/image-grid/image-7.webp";
import Image8 from "@/assets/image-grid/image-8.webp";
import Image9 from "@/assets/image-grid/image-9.webp";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { cn } from "@/lib/utils";

const baseStyles = cn("tablet:border-6 border-[2rem] border-white");

const imagesList = [
  { src: Image1, alt: "Activity Image 1" },
  { src: Image2, alt: "Activity Image 2" },
  { src: Image3, alt: "Activity Image 3" },
  { src: Image4, alt: "Activity Image 4" },
  { src: Image5, alt: "Activity Image 5" },
  { src: Image6, alt: "Activity Image 6" },
  { src: Image7, alt: "Activity Image 7" },
  { src: Image8, alt: "Activity Image 8" },
  { src: Image9, alt: "Activity Image 9" },
];

/**
 * Desktop collage placement. `box` positions the trigger inside the collage,
 * `shape` is the image's border radius (shared with the trigger so the focus
 * ring follows the shape), `image` holds image-only extras.
 */
const collage: {
  box: string;
  shape: string;
  image?: string;
}[] = [
  {
    box: "left-[8.68%] w-[36%]",
    shape: "rounded-[0_32.72%_0_32.72%/0_47.59%_0_47.59%]",
  },
  {
    box: "top-[38.60%] left-[0%] w-[24.76%]",
    shape: "rounded-[44.14%_0_44.14%_0/61.65%_0_61.65%_0]",
  },
  {
    box: "top-[52.94%] left-[18.92%] h-[44.12%] w-[22.5%]",
    shape: "rounded-[42.23%_0_42.23%_0/55.33%_0_55.33%_0]",
    image: "h-full object-cover",
  },
  {
    box: "top-[2.94%] left-[40.98%] w-[20.63%]",
    shape: "rounded-[33.29%_0_33.29%_0/49.94%_0_49.94%_0]",
  },
  {
    box: "top-[37.50%] left-[36.43%] w-[23.34%]",
    shape: "rounded-[38.26%_0_38.26%_0/51.01%_0_51.01%_0]",
    image: "-scale-x-100",
  },
  {
    box: "top-[12.50%] left-[57.20%] w-[23.62%]",
    shape: "rounded-[0_37.80%_0_37.80%/0_50.40%_0_50.40%]",
  },
  {
    box: "top-[53.31%] left-[55.49%] w-[25.9%]",
    shape: "rounded-[33.15%_0_33.15%_0/49.72%_0_49.72%_0]",
  },
  {
    box: "top-[11.03%] left-[72.57%] z-10 w-[22.48%]",
    shape: "rounded-[38.19%_0_38.19%_0/50.92%_0_50.92%_0]",
  },
  {
    box: "top-[30.88%] left-[80.39%] h-[68.01%] w-[19.78%]",
    shape: "rounded-[0_50.28%_0_50.28%/0_37.57%_0_37.57%]",
    image: "h-full object-cover",
  },
];

export default function PictureGrid() {
  return (
    <>
      {/* Desktop Collage View (Visible on screens > 900px) */}
      <div className="tablet:hidden relative grid aspect-[2.58] h-auto w-full">
        {collage.map((item, index) => {
          const img = imagesList[index];

          return (
            <ImageLightbox
              key={img.alt}
              images={imagesList}
              index={index}
              className={cn("absolute", item.box, item.shape)}
            >
              <Image
                src={img.src}
                alt="Activity Image"
                className={cn(
                  baseStyles,
                  "h-auto w-full",
                  item.shape,
                  item.image,
                )}
                draggable="false"
              />
            </ImageLightbox>
          );
        })}
      </div>

      {/* Mobile/Tablet Grid View (Visible on screens <= 900px) */}
      <div className="tablet:grid mobile-lg:grid-cols-2 hidden w-full grid-cols-3 gap-6">
        {imagesList.map((img, index) => (
          <div
            key={index}
            className={cn(
              "relative aspect-square overflow-hidden border-4 border-white bg-white shadow-md",
              index === 8 && "mobile-lg:col-span-2 mobile-lg:aspect-2/1",
              index % 2 === 0
                ? "rounded-tr-[4rem] rounded-bl-[4rem]"
                : "rounded-tl-[4rem] rounded-br-[4rem]",
            )}
          >
            <ImageLightbox
              images={imagesList}
              index={index}
              className="absolute inset-0 h-full w-full focus-visible:ring-offset-0 focus-visible:ring-inset"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                unoptimized
                sizes="(max-width: 900px) 33vw, 50vw"
                className="object-cover"
                draggable="false"
              />
            </ImageLightbox>
          </div>
        ))}
      </div>
    </>
  );
}
