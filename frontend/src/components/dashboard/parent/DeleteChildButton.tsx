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
          className="cursor-pointer p-2 text-red-600 transition-colors hover:text-red-800 disabled:opacity-50"
          title="حذف"
        >
          <Trash2 size={24} />
        </button>
      </ModalTrigger>

      <ModalContent className="max-w-md [&>div,&>form]:px-4 [&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem] sm:[&>div,&>form]:px-20 sm:[&>div,&>form]:last:p-[2rem_5rem_5rem_5rem]">
        <ModalTitle className="text-center font-bold text-red-800">
          تأكيد حذف الطفل
        </ModalTitle>

        <div className="flex flex-col gap-6 px-2 py-6 text-center sm:px-10">
          <p className="text-2xl leading-relaxed text-gray-700">
            هل أنت متأكد من رغبتك في حذف{" "}
            <strong className="text-gray-900">{childName}</strong>؟
            <br />
            <span className="mt-2 block text-xl font-bold text-red-600">
              هذا الإجراء لا يمكن التراجع عنه وسيتم مسح كافة البيانات المتعلقة
              بالطفل.
            </span>
          </p>

          <div className="mt-6 flex justify-center gap-4">
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
              className="flex-1 border-none bg-red-600 py-4 text-2xl text-white shadow-none! hover:bg-red-500"
            >
              تأكيد الحذف
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
