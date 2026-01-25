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

const baseStyles = cn("border-[2rem] border-white");

export default function PictureGrid() {
  return (
    <div className="tablet:origin-top-left tablet:scale-40 tablet:h-120 tablet:-left-[3.5%] relative grid h-272 w-full">
      <Image
        src={Image1}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute left-61 h-auto w-253 rounded-[0_21rem]",
        )}
        draggable="false"
      />

      <Image
        src={Image2}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-105 left-0 h-auto w-174 rounded-[20rem_0]",
        )}
        draggable="false"
      />

      <Image
        src={Image3}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-144 left-133 h-120 w-158 rounded-[16.6rem_0] object-cover",
        )}
        draggable="false"
      />

      <Image
        src={Image4}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-8 left-288 h-auto w-145 rounded-[12rem_0]",
        )}
        draggable="false"
      />

      <Image
        src={Image5}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-102 left-256 h-auto w-164 -scale-x-100 rounded-[15.6rem_0]",
        )}
        draggable="false"
      />

      <Image
        src={Image6}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-34 left-402 h-auto w-166 rounded-[0_15.6rem]",
        )}
        draggable="false"
      />

      <Image
        src={Image7}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-145 left-390 h-auto w-182 rounded-[15rem_0]",
        )}
        draggable="false"
      />

      <Image
        src={Image8}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-30 left-510 z-10 h-auto w-158 rounded-[15rem_0]",
        )}
        draggable="false"
      />

      <Image
        src={Image9}
        alt="Activity Image"
        className={cn(
          baseStyles,
          "absolute top-84 left-565 h-185 w-139 rounded-[0_17.375rem]",
        )}
        draggable="false"
      />
    </div>
  );
}
