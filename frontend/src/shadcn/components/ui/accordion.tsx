"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../../lib/utils";

const accordionItemVariants = cva("", {
  variants: {
    variant: {
      default: "border-b last:border-b-0",
      "figma-mobile":
        "mb-4 flex flex-col overflow-hidden rounded-[20px] transition-all duration-300 border " +
        "data-[state=closed]:border-transparent data-[state=closed]:shadow-none " +
        "data-[state=open]:border-[#d8ded8] data-[state=open]:shadow-[0_12px_28px_rgba(0,0,0,0.06)] bg-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const accordionTriggerVariants = cva(
  "flex flex-1 items-center justify-between transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
  {
    variants: {
      variant: {
        default:
          "gap-4 rounded-md py-4 text-left text-sm font-medium hover:underline",
        "figma-mobile":
          "h-[48px] min-h-[48px] bg-[#c8d0cb] px-[24px] py-0 text-right text-[1.45rem] font-medium leading-5 text-[#58635c] duration-300 ease-in-out hover:no-underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const accordionIconVariants = cva(
  "pointer-events-none shrink-0 transition-transform duration-300",
  {
    variants: {
      variant: {
        default: "size-4 translate-y-0.5 text-muted-foreground",
        "figma-mobile": "h-5 w-5 text-[#6f7c73]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const accordionContentVariants = cva(
  "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
  {
    variants: {
      variant: {
        default: "",
        "figma-mobile": "bg-[#EFEFEF]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const accordionContentInnerVariants = cva("", {
  variants: {
    variant: {
      default: "pb-4 pt-0",
      "figma-mobile": "p-[21px]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> &
    VariantProps<typeof accordionItemVariants>
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    data-slot="accordion-item"
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> &
    VariantProps<typeof accordionTriggerVariants>
>(({ className, children, variant, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={cn(accordionTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className={cn(accordionIconVariants({ variant }))} />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> &
    VariantProps<typeof accordionContentVariants>
>(({ className, children, variant, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    data-slot="accordion-content"
    className={cn(accordionContentVariants({ variant }), className)}
    {...props}
  >
    <div className={cn(accordionContentInnerVariants({ variant }))}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
