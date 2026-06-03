"use client";

import { deleteChild } from "@/actions/user";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function DeleteChildButton({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await deleteChild(childId);

    if (error) {
      toast.error(typeof error === "string" ? error : "حدث خطأ أثناء الحذف");
      setIsDeleting(false);
    } else {
      toast.success("تم حذف الطفل بنجاح");
      setIsOpen(false);
      setIsDeleting(false);
      router.refresh();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <button
          className="text-red-600 hover:text-red-800 transition-colors p-2 disabled:opacity-50 cursor-pointer"
          title="حذف"
        >
          <Trash2 size={24} />
        </button>
      </ModalTrigger>

      <ModalContent className="max-w-md [&>div,&>form]:px-4 sm:[&>div,&>form]:px-20 [&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem] sm:[&>div,&>form]:last:p-[2rem_5rem_5rem_5rem]">
        <ModalTitle className="text-red-800 text-center font-bold">تأكيد حذف الطفل</ModalTitle>
        
        <div className="flex flex-col gap-6 text-center py-6 px-2 sm:px-10">
          <p className="text-2xl text-gray-700 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف <strong className="text-gray-900">{childName}</strong>؟
            <br />
            <span className="text-red-600 text-xl font-bold mt-2 block">هذا الإجراء لا يمكن التراجع عنه وسيتم مسح كافة البيانات المتعلقة بالطفل.</span>
          </p>
          
          <div className="flex gap-4 justify-center mt-6">
            <Button
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              variant="secondary"
              className="flex-1 py-4 text-2xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDelete}
              loading={isDeleting}
              loaderThickness="2px"
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 text-2xl border-none shadow-none!"
            >
              تأكيد الحذف
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
