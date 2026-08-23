"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

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
      <ModalContent className="overflow-hidden rounded-3xl bg-white p-10 sm:max-w-[500px]">
        <ModalHeader className="mb-6">
          <ModalTitle
            className={cn(
              "font-medad text-center text-4xl",
              variant === "danger" ? "text-red-500" : "text-olive-700",
            )}
          >
            {title}
          </ModalTitle>
        </ModalHeader>

        {description && (
          <p className="font-medad mb-10 text-center text-2xl leading-relaxed text-gray-500">
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
              "flex-1 rounded-2xl py-5 text-2xl font-bold shadow-md transition-all active:scale-95",
              variant === "danger"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-olive-300 hover:bg-olive-400 text-white",
            )}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-gray-100 py-5 text-2xl font-bold text-gray-500 transition-all hover:bg-gray-200"
          >
            {cancelText}
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}
