import EmailIcon from "@/components/icons/EmailIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import Link from "next/link";
import SectionDivider from "@/components/landing-page/SectionDivider";
import { toHindiDigits } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="relative bg-[linear-gradient(180deg,#D2DBC8_0%,#FFF_100%)] px-53 py-18 pb-14">
      <SectionDivider
        startColor="#D2DBC8"
        endColor="#2E4238"
        className="tablet:-top-47 -top-112"
      />

      <div className="text-olive-500 tablet:grid-cols-2 tablet:gap-30 grid grid-cols-3 grid-rows-[auto_1fr] text-[1.6rem] [&_h3]:mb-9 [&_h3]:text-[1.8rem] [&_h3]:font-bold [&>div:not(:last-of-type)>h3]:pr-11">
        <div>
          <h3>معلومات التواصل</h3>
          <ul className="flex flex-col gap-3 [&_svg]:w-[1.6rem] [&>li]:flex [&>li]:items-center [&>li]:gap-4">
            <li>
              <EmailIcon />
              <span>info@alredwan.edu</span>
            </li>

            <li>
              <PhoneIcon />
              <span>٢٠١٢٣٤٥٦٧٨٩٠+</span>
            </li>

            <li>
              <WhatsappIcon />
              <span>٢٠١٢٣٤٥٦٧٨٩٠+</span>
            </li>
          </ul>
        </div>

        <div>
          <h3>العنوان</h3>
          <ul className="flex flex-col gap-3 [&_svg]:w-[1.6rem] [&>li]:flex [&>li]:items-center [&>li]:gap-4">
            <li>
              <LocationIcon />
              <span>شارع المعز لدين الله القاهرة، مصر</span>
            </li>
          </ul>
        </div>

        <div className="tablet:pr-11">
          <h3>روابط سريعة</h3>
          <ul className="flex flex-col gap-3 [&_a]:hover:underline [&_svg]:w-[1.6rem] [&>li]:flex [&>li]:items-center [&>li]:gap-4">
            <li>
              <Link href="#">الشروط والأحكام</Link>
            </li>

            <li>
              <Link href="#">سياسة الخصوصية</Link>
            </li>

            <li>
              <Link href="#">الأسئلة الشائعة</Link>
            </li>

            <li>
              <Link href="#">دعم فني</Link>
            </li>
          </ul>
        </div>
      </div>

      <hr className="my-14 w-full self-center text-gray-300" />

      <p className="text-center text-[1.6rem]">
        © <span>{toHindiDigits(new Date().getFullYear())}</span> واحة الرضوان
        التعليمية. جميع الحقوق محفوظة.
      </p>
    </footer>
  );
}
