"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, ModalContent, ModalTitle } from "@/components/ui/Modal";
import AddChildForm from "@/components/dashboard/parent/AddChildForm";
import ItemCard from "@/components/ui/ItemCard";
import Button from "@/components/ui/Button";

export function AddChildWrapper({
  children,
}: {
  children: (openModal: () => void) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children(() => setIsOpen(true))}
      <AddChildModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
}

export function AddChildCard() {
  return (
    <ItemCard
      shape="square"
      index={0}
      className="border-olive-300 hover:border-olive-500 hover:bg-olive-50/20 h-full min-h-[35rem] cursor-pointer border-2 border-dashed transition-all"
    >
      <AddChildWrapper>
        {(openModal) => (
          <button
            type="button"
            onClick={openModal}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-6 py-12 text-center focus:outline-hidden"
          >
            <div className="bg-olive-100 text-olive-700 flex h-20 w-20 items-center justify-center rounded-full shadow-sm">
              <Plus size={40} />
            </div>
            <span className="text-olive-700 text-3xl font-bold">
              إضافة طفل جديد
            </span>
            <p className="max-w-[24rem] text-2xl leading-relaxed text-gray-500">
              أضف بيانات طفلك للبدء بالتسجيل في الحلقات والدورات بسهولة.
            </p>
          </button>
        )}
      </AddChildWrapper>
    </ItemCard>
  );
}

export function AddChildButton({ className }: { className?: string }) {
  return (
    <AddChildWrapper>
      {(openModal) => (
        <Button className={className} onClick={openModal}>
          إضافة طفل جديد الآن
        </Button>
      )}
    </AddChildWrapper>
  );
}

function AddChildModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalContent className="tablet-sm:max-w-full tablet-sm:[&>div,&>form]:px-4 tablet-sm:[&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem] max-w-4xl [&>div,&>form]:px-8 [&>div,&>form]:last:p-[2rem_2rem_3rem_2rem]">
        <ModalTitle className="text-olive-700 text-center font-bold">
          إضافة طفل جديد
        </ModalTitle>
        <div className="p-0">
          <AddChildForm onSuccess={() => setIsOpen(false)} />
        </div>
      </ModalContent>
    </Modal>
  );
}
