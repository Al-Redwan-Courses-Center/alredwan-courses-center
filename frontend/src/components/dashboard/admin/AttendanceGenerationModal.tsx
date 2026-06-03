"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Loader2, Calendar as CalendarIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import { generateAttendances } from "@/actions/admin-attendances";

interface AttendanceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AttendanceGenerationModal({
  isOpen,
  onClose,
  onSuccess,
}: AttendanceGenerationModalProps) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await generateAttendances(startDate, endDate);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Failed to generate records");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[500px] rounded-[3rem_0] bg-white p-12 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-4xl font-bold text-olive-700 font-medad">توليد سجلات الحضور</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <X className="size-8 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-2xl font-semibold text-gray-600 block">تاريخ البداية</label>
              <div className="relative shadow-soft bg-[#F3F3F5] rounded-[0_1.5rem] flex items-center gap-4 px-6 py-4">
                <CalendarIcon className="size-6 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-[1.8rem] font-bold text-gray-700 cursor-pointer w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-2xl font-semibold text-gray-600 block">تاريخ النهاية</label>
              <div className="relative shadow-soft bg-[#F3F3F5] rounded-[0_1.5rem] flex items-center gap-4 px-6 py-4">
                <CalendarIcon className="size-6 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-[1.8rem] font-bold text-gray-700 cursor-pointer w-full"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xl font-semibold text-center border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-olive-700 hover:bg-olive-800 text-white h-20 text-2xl"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin size-6" />
                  <span>جاري التوليد...</span>
                </div>
              ) : (
                "توليد السجلات الآن"
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="px-8 h-20 text-2xl border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
