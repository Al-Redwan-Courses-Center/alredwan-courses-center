"use client";

import NotepadIcon from "@/components/icons/NotepadIcon";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AddNoteModal({
  name,
  uniqueId,
  onSave,
  notes = "",
  disabled = false,
}: {
  name: string;
  uniqueId: string;
  onSave: (n: string) => void;
  notes?: string;
  disabled?: boolean;
}) {
  const [note, setNote] = useState(notes);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);

        if (open) {
          setNote(notes || "");
        }
      }}
    >
      <ModalTrigger asChild>
        <button
          disabled={disabled}
          className={cn(disabled && "pointer-events-none")}
        >
          <NotepadIcon className={cn(disabled && "text-gray-450")} />
        </button>
      </ModalTrigger>

      <ModalContent className="h-[50dvh] w-[35dvw]">
        <ModalTitle>أضف ملاحظات إلى {name}</ModalTitle>

        <div className="flex flex-col gap-5">
          <h3 className="text-4xl">الملاحظات:</h3>

          <textarea
            name="notes"
            id={`notes-${uniqueId}`}
            className="mb-auto h-2/3 w-full bg-gray-300 p-5 text-3xl"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex items-center gap-7 self-end">
            <ModalClose asChild>
              <Button variant="secondary" size="small">
                إلغاء
              </Button>
            </ModalClose>
            <Button
              size="small"
              onClick={() => {
                if (disabled) return;

                onSave(note);
                setIsOpen(false);
                toast.success("تمت إضافة الملاحظات بنجاح!", {
                  duration: 5000,
                });
              }}
            >
              حفظ
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
