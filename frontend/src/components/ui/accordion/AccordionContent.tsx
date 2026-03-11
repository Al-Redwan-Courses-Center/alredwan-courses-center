import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import LabelValue from "../LabelValue";
import ActionButtons from "../ActionButtons";

interface LabelValueConfig {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
  variant?: "default" | "large" | "small";
  indent?: boolean;
}

interface ActionConfig {
  onEdit?: () => void;
  onDelete?: () => void;
  onInfo?: () => void;
}

interface AccordionContentProps {
  rows?: LabelValueConfig[][];
  footerRow?: LabelValueConfig;
  actions?: ActionConfig;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

function AccordionContent({
  rows,
  footerRow,
  actions,
  footer,
  className,
  children,
}: AccordionContentProps) {
  const hasFooterContent = footerRow || actions || footer;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col justify-start gap-4">
        {rows
          ? rows.map((row, idx) => (
              <div
                key={idx}
                className="inline-flex w-full items-center justify-start"
              >
                {row.length === 1 && row[0].indent && (
                  <div className="h-5 w-0" />
                )}
                {row.length > 1 ? (
                  <div className="flex w-full gap-24">
                    {row.map((item, i) => {
                      const { ...itemProps } = item;
                      return <LabelValue key={i} {...itemProps} />;
                    })}
                  </div>
                ) : (
                  (() => {
                    const { ...itemProps } = row[0];
                    return <LabelValue {...itemProps} />;
                  })()
                )}
              </div>
            ))
          : children}
      </div>
      {hasFooterContent && (
        <div className="flex items-center justify-start">
          {footer || (
            <div className="inline-flex w-full items-center justify-between">
              {footerRow && <LabelValue {...footerRow} />}
              {actions && (
                <div className="flex-1">
                  <ActionButtons {...actions} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AccordionContent;
