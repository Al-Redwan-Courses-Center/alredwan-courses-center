"use client";

import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

export default function CopyToClipboardButton({
  resource = "الكود",
  className,
  children,
}: {
  resource?: string;
  className?: string;
  children: string;
}) {
  async function handleCopy() {
    await navigator.clipboard.writeText(children);
    toast.success(`تم نسخ ${resource} بنجاح!`);
  }

  return (
    <Button
      variant="light"
      size="small"
      className={className}
      onClick={handleCopy}
    >
      {children}
    </Button>
  );
}
