import NavBar from "@/components/nav/NavBar";
import LandingPage from "@/components/landing-page/LandingPage";
import EmailIcon from "@/components/icons/EmailIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import Link from "next/link";
import { toHindiDigits } from "@/utils/toHindiDigits";

export default function Home() {
  return (
    <>
      <NavBar />

      <LandingPage />

      <footer className="px-53 py-18 pb-14">
        <div className="text-olive-500 grid grid-cols-3 grid-rows-[auto_1fr] text-[1.6rem] [&>h3]:mb-9 [&>h3]:text-[1.8rem] [&>h3]:font-bold [&>h3]:not-last-of-type:pr-11">
          <h3>معلومات التواصل</h3>

          <h3>العنوان</h3>

          <h3>روابط سريعة</h3>

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

          <ul className="flex flex-col gap-3 [&_svg]:w-[1.6rem] [&>li]:flex [&>li]:items-center [&>li]:gap-4">
            <li>
              <LocationIcon />
              <span>شارع المعز لدين الله القاهرة، مصر</span>
            </li>
          </ul>

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

        <hr className="mx-auto my-14 w-486 text-gray-300" />

        <p className="text-center text-[1.6rem]">
          © <span>{toHindiDigits(new Date().getFullYear())}</span> واحة الرضوان
          التعليمية. جميع الحقوق محفوظة.
        </p>
      </footer>
    </>
  );
}
