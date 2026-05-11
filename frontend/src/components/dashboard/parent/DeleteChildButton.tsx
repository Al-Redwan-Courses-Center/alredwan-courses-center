"use client";

import { deleteChild } from "@/actions/user";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function DeleteChildButton({ childId, childName }: { childId: string, childName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${childName}؟`)) return;

    setIsDeleting(true);
    const { error } = await deleteChild(childId);

    if (error) {
      toast.error(typeof error === "string" ? error : "حدث خطأ أثناء الحذف");
      setIsDeleting(false);
    } else {
      toast.success("تم حذف الطفل بنجاح");
      router.refresh();
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 transition-colors p-2 disabled:opacity-50"
      title="حذف"
    >
      <Trash2 size={24} />
    </button>
  );
}
