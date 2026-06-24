import Image1 from "@/assets/image-grid/image-1.jpg";
import Image2 from "@/assets/image-grid/image-2.jpg";
import Image3 from "@/assets/image-grid/image-3.jpg";
import Image4 from "@/assets/image-grid/image-4.jpg";
import Image5 from "@/assets/image-grid/image-5.jpg";
import Image6 from "@/assets/image-grid/image-6.jpg";
import Image7 from "@/assets/image-grid/image-7.jpg";
import Image8 from "@/assets/image-grid/image-8.jpg";
import Image9 from "@/assets/image-grid/image-9.jpg";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

export default function PictureGrid() {
  return (
    <>
      {/* Desktop Collage View (Visible on screens > 900px) */}
      <div className="relative tablet:hidden grid aspect-[2.58] h-auto w-full">
        <Image
          src={Image1}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute left-[8.68%] h-auto w-[36%] rounded-[0_32.72%_0_32.72%/0_47.59%_0_47.59%]",
          )}
          draggable="false"
        />

        <Image
          src={Image2}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[38.60%] left-[0%] h-auto w-[24.76%] rounded-[44.14%_0_44.14%_0/61.65%_0_61.65%_0]",
          )}
          draggable="false"
        />

        <Image
          src={Image3}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[52.94%] left-[18.92%] h-[44.12%] w-[22.5%] rounded-[42.23%_0_42.23%_0/55.33%_0_55.33%_0] object-cover",
          )}
          draggable="false"
        />

        <Image
          src={Image4}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[2.94%] left-[40.98%] h-auto w-[20.63%] rounded-[33.29%_0_33.29%_0/49.94%_0_49.94%_0]",
          )}
          draggable="false"
        />

        <Image
          src={Image5}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[37.50%] left-[36.43%] h-auto w-[23.34%] -scale-x-100 rounded-[38.26%_0_38.26%_0/51.01%_0_51.01%_0]",
          )}
          draggable="false"
        />

        <Image
          src={Image6}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[12.50%] left-[57.20%] h-auto w-[23.62%] rounded-[0_37.80%_0_37.80%/0_50.40%_0_50.40%]",
          )}
          draggable="false"
        />

        <Image
          src={Image7}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[53.31%] left-[55.49%] h-auto w-[25.9%] rounded-[33.15%_0_33.15%_0/49.72%_0_49.72%_0]",
          )}
          draggable="false"
        />

        <Image
          src={Image8}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[11.03%] left-[72.57%] z-10 h-auto w-[22.48%] rounded-[38.19%_0_38.19%_0/50.92%_0_50.92%_0]",
          )}
          draggable="false"
        />

        <Image
          src={Image9}
          alt="Activity Image"
          className={cn(
            baseStyles,
            "absolute top-[30.88%] left-[80.39%] h-[68.01%] w-[19.78%] rounded-[0_50.28%_0_50.28%/0_37.57%_0_37.57%]",
          )}
          draggable="false"
        />
      </div>

      {/* Mobile/Tablet Grid View (Visible on screens <= 900px) */}
      <div className="hidden tablet:grid grid-cols-3 mobile-lg:grid-cols-2 gap-6 w-full">
        {imagesList.map((img, index) => (
          <div
            key={index}
            className={cn(
              "overflow-hidden bg-white shadow-md border-4 border-white aspect-square relative",
              index === 8 && "mobile-lg:col-span-2 mobile-lg:aspect-2/1",
              index % 2 === 0
                ? "rounded-tr-[4rem] rounded-bl-[4rem]"
                : "rounded-tl-[4rem] rounded-br-[4rem]"
            )}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 900px) 33vw, 50vw"
              className="object-cover"
              draggable="false"
            />
          </div>
        ))}
      </div>
    </>
  );
}
