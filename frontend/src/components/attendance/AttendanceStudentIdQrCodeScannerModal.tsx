"use client";

import { useState } from "react";
import QrCodeScanner from "@/components/attendance/QrCodeScanner";
import QrCodeIcon from "@/components/icons/QrCodeIcon";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export default function AttendanceStudentIdQrCodeScannerModal({
  disabled = false,
  onScan,
}: {
  disabled?: boolean;
  onScan?: (text: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Modal
      open={isModalOpen}
      onOpenChange={(willOpen) => setIsModalOpen(willOpen)}
    >
      <ModalTrigger asChild>
        <button
          className={cn(
            "bg-olive-300 hover:bg-olive-700 rounded-[0.4rem] p-2 text-gray-100 transition-colors",
            disabled && "bg-gray-450 pointer-events-none",
          )}
        >
          <QrCodeIcon />
        </button>
      </ModalTrigger>

      <ModalContent className="h-fit max-h-6/7 w-fit">
        <ModalTitle>مسح الأكواد بالكاميرا</ModalTitle>
        <QrCodeScanner
          autoStart
          isActive={isModalOpen}
          onScan={(text) => {
            console.log(text);
            onScan?.(text);
          }}
        />
      </ModalContent>
    </Modal>
  );
}
