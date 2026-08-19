"use client";

import { Star } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 10,
  editable = false,
  onChange,
  size = "md",
  className,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleRatingClick = (newRating: number) => {
    if (editable && onChange) {
      onChange(newRating);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled =
          hoveredRating !== null
            ? starValue <= hoveredRating
            : starValue <= rating;

        return (
          <button
            key={index}
            type="button"
            disabled={!editable}
            className={cn(
              "transition-all duration-200 focus:outline-none",
              editable
                ? "cursor-pointer hover:scale-110 active:scale-95"
                : "cursor-default",
              isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
            )}
            onMouseEnter={() => editable && setHoveredRating(starValue)}
            onMouseLeave={() => editable && setHoveredRating(null)}
            onClick={() => handleRatingClick(starValue)}
          >
            <Star className={cn(sizes[size])} />
          </button>
        );
      })}
      {!editable && (
        <span className="mr-2 text-sm font-medium text-gray-500">
          ({rating}/{maxRating})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
