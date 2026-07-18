"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ParentChildDetail } from "@/actions/user";
import { Modal, ModalContent, ModalTitle } from "@/components/ui/Modal";
import AddChildForm from "@/components/dashboard/parent/AddChildForm";

export default function EditChildButton({
  child,
}: {
  child: ParentChildDetail;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-olive-700 hover:text-olive-900 hover:bg-olive-100/50 flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors focus:outline-hidden"
        title="تعديل"
      >
        <Pencil size={20} />
      </button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="tablet-sm:max-w-full tablet-sm:[&>div,&>form]:px-4 tablet-sm:[&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem] max-w-4xl [&>div,&>form]:px-8 [&>div,&>form]:last:p-[2rem_2rem_3rem_2rem]">
          <ModalTitle className="text-olive-700 text-center font-bold">
            تعديل بيانات الطفل
          </ModalTitle>
          <div className="p-0">
            <AddChildForm
              initialData={child}
              onSuccess={() => setIsOpen(false)}
            />
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
