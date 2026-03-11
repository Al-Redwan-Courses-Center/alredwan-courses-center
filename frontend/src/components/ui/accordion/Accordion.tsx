"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* =======================
   Types
======================= */

interface AccordionContextType {
  openIds: Set<string>;
  toggleItem: (id: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

export function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
}

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpenId?: string | null;
  allowMultiple?: boolean;
}

/* =======================
   Accordion
======================= */

function Accordion({
  defaultOpenId = null,
  allowMultiple = false,
  className,
  children,
  ...props
}: AccordionProps) {
  const [openIds, setOpenIds] = React.useState<Set<string>>(
    defaultOpenId ? new Set([defaultOpenId]) : new Set(),
  );

  function toggleItem(id: string) {
    setOpenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  }

  return (
    <AccordionContext.Provider value={{ openIds, toggleItem }}>
      <section className={cn("flex flex-col", className)} {...props}>
        {children}
      </section>
    </AccordionContext.Provider>
  );
}

export default Accordion;
