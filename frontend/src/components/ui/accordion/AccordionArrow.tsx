import { cn } from "@/lib/utils";

interface AccordionArrowProps {
  isOpen: boolean;
  className?: string;
}

function AccordionArrow({ isOpen, className }: AccordionArrowProps) {
  return (
    <div
      className={cn(
        "relative h-6 w-0 origin-top-left overflow-hidden transition-transform",
        isOpen ? "rotate-0" : "-rotate-90",
        className,
      )}
    >
      <div className="absolute left-[4.43px] top-[8.59px] h-2 w-4 bg-gray-500" />
    </div>
  );
}

export default AccordionArrow;
