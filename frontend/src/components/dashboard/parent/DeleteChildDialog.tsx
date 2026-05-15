"use client";

import { deleteChild } from "@/actions/parents";
import { ParentChildDetail } from "@/actions/user";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import TrashIcon from "@/components/icons/TrashIcon";

interface DeleteChildDialogProps {
  child: ParentChildDetail;
}

export default function DeleteChildDialog({ child }: DeleteChildDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDeleteChild() {
    setIsDeleting(true);

    const result = await deleteChild(child.id);

    if (result.ok) {
      toast.success(
        result.message || `تم حذف الطفل ${child.first_name} بنجاح.`,
      );
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(
        result.message || "حدث خطأ أثناء حذف الطفل. يرجى المحاولة مرة أخرى.",
      );
    }

    setIsDeleting(false);
  }

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <button
          className="text-red-500 transition-colors hover:text-red-600"
          aria-label="حذف الطفل"
          title={`حذف ${child.first_name}`}
        >
          <TrashIcon className="h-6 w-6" />
        </button>
      </ModalTrigger>

      <ModalContent className="w-280 rounded-[2rem_0]">
        <ModalTitle className="mb-2">تأكيد الحذف</ModalTitle>

        <div className="flex flex-col gap-6 pb-10">
          <ModalDescription className="text-center text-2xl text-gray-600">
            هل أنت متأكد من رغبتك في حذف الطفل{" "}
            <strong>{child.first_name}</strong>؟
          </ModalDescription>

          <p className="rounded-[1.2rem_0] bg-red-100 px-5 py-4 text-2xl text-red-800">
            ⚠️ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات الطفل
            المرتبطة به.
          </p>

          <div className="flex items-center justify-end gap-4">
            <ModalClose asChild>
              <Button
                variant="secondary"
                revert
                size="small"
                className="min-w-40"
                disabled={isDeleting}
              >
                إلغاء
              </Button>
            </ModalClose>

            <Button
              type="button"
              size="small"
              className="h-15 min-w-50 bg-red-600 hover:bg-red-700!"
              loading={isDeleting}
              disabled={isDeleting}
              onClick={handleDeleteChild}
            >
              حذف الطفل
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
