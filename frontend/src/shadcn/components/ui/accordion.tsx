"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "../../../lib/utils";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> & {
  variant?: "default" | "figma-mobile";
}) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      data-variant={variant}
      className={cn(
        // default: thin bottom border
        "data-[variant=default]:border-b data-[variant=default]:last:border-b-0",
        "data-[variant=figma-mobile]:overflow-hidden",
        "data-[variant=figma-mobile]:rounded-tl-[20px] data-[variant=figma-mobile]:rounded-br-[20px]",
        "data-[variant=figma-mobile]:bg-olive-100 data-[variant=figma-mobile]:border-none",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  variant = "default",
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  variant?: "default" | "figma-mobile";
}) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        data-variant={variant}
        className={cn(
          // shared base
          "flex flex-1 items-center justify-between gap-4 transition-all outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&[data-state=open]>svg]:rotate-180",

          // variant: default
          "data-[variant=default]:rounded-md data-[variant=default]:py-4",
          "data-[variant=default]:text-left data-[variant=default]:text-sm data-[variant=default]:font-medium",
          "data-[variant=default]:hover:underline",

          "data-[variant=figma-mobile]:h-12 data-[variant=figma-mobile]:min-h-12 data-[variant=figma-mobile]:flex-row-reverse data-[variant=figma-mobile]:items-center data-[variant=figma-mobile]:justify-between",
          "data-[variant=figma-mobile]:text-right",
          "data-[variant=figma-mobile]:px-6 data-[variant=figma-mobile]:py-0",
          "data-[variant=figma-mobile]:text-[2rem] data-[variant=figma-mobile]:font-medium data-[variant=figma-mobile]:text-gray-500",
          "data-[variant=figma-mobile]:hover:no-underline",
          "data-[variant=figma-mobile]:bg-olive-100 data-[variant=figma-mobile]:data-[state=open]:bg-olive-100",

          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={cn(
            "pointer-events-none shrink-0 transition-transform duration-200",
            variant === "figma-mobile"
              ? "h-5 w-5 text-gray-500"
              : "text-muted-foreground size-4 translate-y-0.5",
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  variant = "default",
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content> & {
  variant?: "default" | "figma-mobile";
}) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div
        className={cn(
          variant === "figma-mobile" ? "bg-gray-100 p-[2.1rem]" : "pt-0 pb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
