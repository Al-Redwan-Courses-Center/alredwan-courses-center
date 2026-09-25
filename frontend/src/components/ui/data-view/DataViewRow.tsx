"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
} from "react";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import DataViewCellLegacy, {
  DataViewCellIndexContext,
  type DataViewCellLegacyProps,
} from "@/components/ui/data-view/DataViewCell";
import { cn, cva } from "@/lib/utils";

const rowStyles = cva(cn("shadow-soft text-2xl transition-all"), {
  variants: {
    intent: {
      header: cn(
        "bg-olive-100 font-medad mb-6 rounded-[2rem_0] text-4xl text-gray-500",
        // Stacked cards carry their own captions, so the header row is redundant on phones.
        "tablet-sm:hidden",
      ),
      standard: cn("rounded-[0_2rem] bg-gray-50"),
      alternate: cn("rounded-[2rem_0] bg-gray-100"),
    },
  },
});

/** Concatenates the text nodes of a React tree (used to read header captions). */
function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return getNodeText(node.props.children);
  return "";
}

/**
 * One caption per header cell. Uses `Children.map` (not `toArray`) so the
 * indices line up with the ones `DataViewRowLegacy` hands to body cells.
 */
function getHeaderLabels(children: ReactNode): string[] {
  return (
    Children.map(children, (child): string => {
      if (!isValidElement<DataViewCellLegacyProps>(child)) {
        return getNodeText(child).trim();
      }

      return (child.props.label ?? getNodeText(child.props.children)).trim();
    }) ?? []
  );
}

export function DataViewRowLegacy({
  className,
  index,
  children,
}: {
  className?: string;
  index: number;
  children: ReactNode;
}) {
  const { columnSizing } = useContext(DataViewContext);
  const isHeader = index < 0;

  // Tell each cell which column it belongs to so it can show the header
  // caption when the row stacks into a card on phones.
  const content = isHeader
    ? children
    : Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;

        if (child.type === DataViewCellLegacy) {
          const cell = child as ReactElement<DataViewCellLegacyProps>;

          return cloneElement(cell, {
            columnIndex: cell.props.columnIndex ?? i,
          });
        }

        return (
          <DataViewCellIndexContext value={i}>{child}</DataViewCellIndexContext>
        );
      });

  return (
    <div
      className={cn(
        "grid",
        columnSizing,
        rowStyles({
          intent: isHeader
            ? "header"
            : index % 2 === 0
              ? "standard"
              : "alternate",
        }),
        // One stacked card per row on phones (the consumer's className can still override).
        !isHeader && "tablet-sm:h-auto tablet-sm:grid-cols-1 tablet-sm:py-2",
        className,
      )}
    >
      {content}
    </div>
  );
}

export function DataViewHeaderLegacy({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { layout, setHeaderLabels } = useContext(DataViewContext);

  const labels = getHeaderLabels(children);
  const labelsKey = labels.join("\u0000");

  useEffect(() => {
    setHeaderLabels(labelsKey === "" ? [] : labelsKey.split("\u0000"));
  }, [labelsKey, setHeaderLabels]);

  if (layout === "cards") return null;

  return (
    <DataViewRowLegacy className={className} index={-1}>
      {children}
    </DataViewRowLegacy>
  );
}
