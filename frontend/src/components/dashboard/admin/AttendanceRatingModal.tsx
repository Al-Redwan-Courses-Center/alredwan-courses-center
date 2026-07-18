"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FieldSetInput from "@/components/ui/FieldSetInput";
import { rateAttendance } from "@/actions/admin-attendances";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: number;
  instructorName: string;
  initialRating?: number;
  initialNotes?: string;
  onSuccess: (updatedAttendance: any) => void;
}

export default function AttendanceRatingModal({
  isOpen,
  onClose,
  attendanceId,
  instructorName,
  initialRating = 0,
  initialNotes = "",
  onSuccess,
}: AttendanceRatingModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await rateAttendance(attendanceId, rating, notes);
    setLoading(false);
    if (result) {
      onSuccess(result);
      onClose();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="sm:max-w-[400px]">
        <ModalHeader>
          <ModalTitle className="text-olive-700">
            تقييم الأداء: {instructorName}
          </ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-20 p-20">
          <div className="flex flex-col items-center gap-10">
            <span className="text-xl text-gray-700">اختر التقييم (1-10)</span>
            <div className="flex flex-row-reverse gap-5">
              {[...Array(10)].map((_, i) => {
                const value = 10 - i;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="transition-transform focus:outline-none active:scale-90"
                  >
                    <Star
                      className={cn(
                        "size-25 transition-colors",
                        rating >= value
                          ? "fill-olive-300 text-olive-300"
                          : "text-gray-300",
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-olive-700 text-3xl font-bold">
              {rating} / 10
            </span>
          </div>

          <FieldSetInput
            label="ملاحظات (اختياري)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أضف أي ملاحظات هنا..."
            fieldsetStyles="w-full"
          />

          <div className="mt-10 flex justify-end gap-10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-30"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={rating === 0}
              className="bg-olive-300 px-30 text-white"
            >
              حفظ التقييم
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
