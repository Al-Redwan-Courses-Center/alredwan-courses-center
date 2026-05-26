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
      className="border-2 border-dashed border-olive-300 hover:border-olive-500 hover:bg-olive-50/20 transition-all cursor-pointer h-full min-h-[35rem]"
    >
      <AddChildWrapper>
        {(openModal) => (
          <button
            type="button"
            onClick={openModal}
            className="w-full h-full flex flex-col items-center justify-center text-center gap-6 py-12 focus:outline-hidden cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 shadow-sm">
              <Plus size={40} />
            </div>
            <span className="text-3xl font-bold text-olive-700">إضافة طفل جديد</span>
            <p className="text-2xl text-gray-500 max-w-[24rem] leading-relaxed">
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

function AddChildModal({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalContent
        className="max-w-4xl [&>div,&>form]:px-8 [&>div,&>form]:last:p-[2rem_2rem_3rem_2rem] tablet-sm:max-w-full tablet-sm:[&>div,&>form]:px-4 tablet-sm:[&>div,&>form]:last:p-[1.5rem_1.5rem_2rem_1.5rem]"
      >
        <ModalTitle className="text-olive-700 text-center font-bold">إضافة طفل جديد</ModalTitle>
        <div className="p-0">
          <AddChildForm onSuccess={() => setIsOpen(false)} />
        </div>
      </ModalContent>
    </Modal>
  );
}

