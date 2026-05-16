"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "primary",
}: ConfirmationModalProps) {
  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-[500px] bg-white rounded-3xl p-10 overflow-hidden">
        <ModalHeader className="mb-6">
          <ModalTitle className={cn(
            "text-4xl font-medad text-center",
            variant === "danger" ? "text-red-500" : "text-olive-700"
          )}>
            {title}
          </ModalTitle>
        </ModalHeader>
        
        {description && (
          <p className="text-2xl text-gray-500 text-center mb-10 leading-relaxed font-medad">
            {description}
          </p>
        )}

        <div className="flex gap-6">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 py-5 rounded-2xl text-2xl font-bold transition-all shadow-md active:scale-95",
              variant === "danger" 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-olive-300 text-white hover:bg-olive-400"
            )}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl text-2xl font-bold hover:bg-gray-200 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}
