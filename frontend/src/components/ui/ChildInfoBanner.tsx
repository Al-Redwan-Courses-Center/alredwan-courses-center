import { ReactNode } from "react";

interface ChildInfoBannerProps {
  childFirstName: string;
  childLastName: string;
}

export default function ChildInfoBanner({
  childFirstName,
  childLastName,
}: ChildInfoBannerProps) {
  return (
    <div className="mb-8 rounded-xl border border-purple-200 bg-purple-50 p-6">
      <p className="text-2xl text-purple-700 sm:text-xl">
        <strong>عرض دورة:</strong> {childFirstName} {childLastName}
      </p>
    </div>
  );
}
