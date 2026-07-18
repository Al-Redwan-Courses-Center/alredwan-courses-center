"use client";

import { useState, useRef, useEffect } from "react";
import { cn, toHindiDigits } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";

interface TimePickerPopoverProps {
  value: string; // e.g., "07:00 pm"
  onChange: (value: string) => void;
  trigger: React.ReactNode;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  (i * 5).toString().padStart(2, "0"),
);
const PERIODS = ["am", "pm"];

export default function TimePickerPopover({
  value,
  onChange,
  trigger,
  usePortal = true,
}: TimePickerPopoverProps & { usePortal?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial value
  const initialParts = value.toLowerCase().split(" ");
  const timeParts = initialParts[0].split(":");

  const [selectedHour, setSelectedHour] = useState(parseInt(timeParts[0]) || 7);
  const [selectedMinute, setSelectedMinute] = useState(timeParts[1] || "00");
  const [selectedPeriod, setSelectedPeriod] = useState(initialParts[1] || "pm");

  const handleDone = () => {
    const newValue = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute} ${selectedPeriod}`;
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        usePortal={usePortal}
        className="pointer-events-auto z-[999] w-[280px] overflow-hidden rounded-[2rem] border-none bg-white p-0 shadow-2xl"
      >
        <div className="relative flex h-[250px] items-center justify-center p-6">
          {/* Highlight Center Bar */}
          <div
            className="pointer-events-none absolute inset-x-0 h-16 border-y border-gray-100 bg-gray-50/80"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />

          <div className="flex h-full w-full overflow-hidden">
            {/* Hours Column */}
            <TimeColumn
              items={HOURS}
              selected={selectedHour}
              onSelect={(v) => setSelectedHour(v as number)}
            />

            {/* Minutes Column */}
            <TimeColumn
              items={MINUTES}
              selected={selectedMinute}
              onSelect={(v) => setSelectedMinute(v as string)}
            />

            {/* Periods Column */}
            <TimeColumn
              items={PERIODS}
              selected={selectedPeriod}
              onSelect={(v) => setSelectedPeriod(v as string)}
              isNumeric={false}
            />
          </div>
        </div>

        {/* Done Button */}
        <div className="flex justify-end bg-white p-4">
          <button
            onClick={handleDone}
            className="bg-olive-300 hover:bg-olive-400 rounded-full px-8 py-2 text-xl font-bold text-white shadow-md transition-colors"
          >
            تم
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  items,
  selected,
  onSelect,
  isNumeric = true,
}: {
  items: (string | number)[];
  selected: string | number;
  onSelect: (v: string | number) => void;
  isNumeric?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Initial scroll to selected
  useEffect(() => {
    const idx = items.indexOf(selected);
    if (scrollRef.current && idx !== -1) {
      scrollRef.current.scrollTop = idx * 40;
    }
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []); // Only on mount

  const handleScroll = () => {
    if (!scrollRef.current || !isReady) return;
    const scrollTop = scrollRef.current.scrollTop;
    const idx = Math.round(scrollTop / 40);

    if (items[idx] !== undefined && items[idx] !== selected) {
      onSelect(items[idx]);
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="no-scrollbar pointer-events-auto flex-1 snap-y snap-mandatory overflow-x-hidden overflow-y-auto py-[105px] outline-none"
      style={{
        scrollBehavior: "smooth",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {items.map((item) => (
        <div
          key={item}
          className={cn(
            "pointer-events-auto flex h-[40px] w-full origin-center cursor-ns-resize snap-center items-center justify-center text-2xl font-bold transition-[transform,color] duration-200 select-none",
            selected === item
              ? "scale-125 text-gray-900"
              : "scale-90 text-gray-300",
          )}
          style={{ touchAction: "pan-y" }}
        >
          <span className="inline-block min-w-[40px] text-center">
            {isNumeric ? toHindiDigits(item.toString()) : item}
          </span>
        </div>
      ))}
    </div>
  );
}
