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
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 w-[500px] rounded-[3rem_0] bg-white p-12 shadow-2xl duration-200">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-olive-700 font-medad text-4xl font-bold">
            توليد سجلات الحضور
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <X className="size-8 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-2xl font-semibold text-gray-600">
                تاريخ البداية
              </label>
              <div className="shadow-soft relative flex items-center gap-4 rounded-[0_1.5rem] bg-[#F3F3F5] px-6 py-4">
                <CalendarIcon className="size-6 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full cursor-pointer bg-transparent text-[1.8rem] font-bold text-gray-700 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-2xl font-semibold text-gray-600">
                تاريخ النهاية
              </label>
              <div className="shadow-soft relative flex items-center gap-4 rounded-[0_1.5rem] bg-[#F3F3F5] px-6 py-4">
                <CalendarIcon className="size-6 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full cursor-pointer bg-transparent text-[1.8rem] font-bold text-gray-700 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-xl font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-olive-700 hover:bg-olive-800 h-20 flex-1 text-2xl text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-6 animate-spin" />
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
              className="h-20 border-gray-200 px-8 text-2xl text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
