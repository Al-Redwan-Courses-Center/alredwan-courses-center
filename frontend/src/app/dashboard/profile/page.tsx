import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ملفي الشخصي",
};

export default function Page() {
  return (
    <div className="content-center py-150 text-center text-8xl font-bold">
      Profile Page
    </div>
  );
}
