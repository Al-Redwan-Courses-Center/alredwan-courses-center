import StarIcon from "@/components/icons/StarIcon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { cn, toHindiDigits } from "@/lib/utils";
import { useState } from "react";

export default function RatingPopover({
  rating,
  disabled = false,
  onSelectRating,
}: {
  rating: number;
  disabled?: boolean;
  onSelectRating: (rating: number) => void;
}) {
  const [isRatingPopoverOpen, setIsRatingPopoverOpen] = useState(false);
  const [currentHoveredStar, setCurrentHoveredStar] = useState<number | null>(
    null,
  );

  return (
    <Popover
      open={isRatingPopoverOpen}
      onOpenChange={(willOpen) => {
        setIsRatingPopoverOpen(willOpen);
      }}
    >
      <PopoverTrigger asChild>
        <button
          className={cn(
            "bg-gray shadow-primary flex h-15 w-4/5 items-center justify-center gap-3 rounded-[1rem_0] bg-gray-100 transition-colors hover:bg-gray-200",
            disabled && "bg-gray-450 pointer-events-none shadow-none!",
          )}
        >
          <StarIcon className="text-beige-500" />
          {toHindiDigits(rating)} / {toHindiDigits(10)}
        </button>
      </PopoverTrigger>

      <PopoverContent className="shadow-primary flex w-fit flex-col items-center gap-2 bg-gray-100">
        <div className="flex items-center">
          {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => {
            return (
              <StarIcon
                key={n}
                onMouseEnter={() => setCurrentHoveredStar(n)}
                onMouseLeave={() => setCurrentHoveredStar(null)}
                onClick={() => {
                  onSelectRating(n);
                  setIsRatingPopoverOpen(false);
                }}
                className={cn(
                  "h-8 w-auto cursor-pointer px-1",
                  (!!currentHoveredStar ? n <= currentHoveredStar : n <= rating)
                    ? "text-beige-500"
                    : "text-gray-500",
                )}
              />
            );
          })}
        </div>
        <span className="text-2xl font-bold">
          {toHindiDigits(currentHoveredStar || rating || "7")} /{" "}
          {toHindiDigits(10)}
        </span>
      </PopoverContent>
    </Popover>
  );
}
