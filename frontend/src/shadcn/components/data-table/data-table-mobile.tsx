"use client";

import { Table as TanStackTable, flexRender } from "@tanstack/react-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { DataTableMobileSkeleton } from "./data-table-skeletons";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type {
  DataTableMobileConfig,
  DataTableMobileContentItem,
} from "./types";
import Loader from "@/components/ui/Loader";

interface DataTableMobileViewProps<TData> {
  table: TanStackTable<TData>;
  mobileConfig?: DataTableMobileConfig<TData>;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  loadingRowsCount?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function DataTableMobileView<TData>({
  table,
  mobileConfig,
  isLoading = false,
  isFetchingMore = false,
  loadingRowsCount = 4,
  onLoadMore,
  hasMore = false,
}: DataTableMobileViewProps<TData>) {
  const rows = table.getRowModel().rows;
  const loadMoreRef = useIntersectionObserver({
    enabled: Boolean(onLoadMore && hasMore && !isLoading && !isFetchingMore),
    onIntersect: () => onLoadMore?.(),
  });

  if (isLoading) {
    return <DataTableMobileSkeleton count={loadingRowsCount} />;
  }

  if (!rows.length) {
    return (
      <p className="py-12 text-center text-[1.6rem] text-gray-500">
        لا توجد نتائج
      </p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      dir="rtl"
      className="w-full space-y-[1.1rem]"
    >
      {rows.map((row, index) => {
        const rowData = row.original;
        const defaultContentItems: DataTableMobileContentItem[] = [];
        row.getVisibleCells().forEach((cell) => {
          const header = cell.column.columnDef.header;
          if (typeof header !== "string" || !header.trim()) return;

          defaultContentItems.push({
            key: cell.id,
            label: header,
            value: flexRender(cell.column.columnDef.cell, cell.getContext()),
          });
        });

        const contentItems =
          mobileConfig?.getContentItems?.(rowData) ?? defaultContentItems;

        return (
          <AccordionItem key={row.id} value={row.id} variant="figma-mobile">
            <AccordionTrigger variant="figma-mobile">
              <div className="ml-2 flex flex-1 items-center justify-between gap-4">
                <span className="truncate text-[1.45rem] leading-5 font-medium text-[#58635c]">
                  {mobileConfig?.renderTitle
                    ? mobileConfig.renderTitle(rowData, index)
                    : `${index + 1}- المحاضرة`}
                </span>
                {mobileConfig?.renderSubtitle && (
                  <span className="shrink-0 text-[1.1rem] leading-5 font-medium text-[#768077]">
                    {mobileConfig.renderSubtitle(rowData)}
                  </span>
                )}
              </div>
            </AccordionTrigger>

            <AccordionContent variant="figma-mobile">
              <div className="flex flex-col gap-[10px]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {contentItems.map((item, itemIndex) => (
                    <div
                      key={item.key ?? `${row.id}-mobile-item-${itemIndex}`}
                      className="inline-flex min-w-0 items-center justify-start gap-2"
                    >
                      <span className="shrink-0 text-[1.35rem] font-semibold whitespace-nowrap text-[#58635c]">
                        {item.label} :
                      </span>
                      <span className="truncate text-[1.35rem] font-normal text-[#58635c]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {mobileConfig?.renderActions && (
                  <div className="flex items-center justify-center pt-2">
                    {mobileConfig.renderActions(rowData)}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}

      {isFetchingMore && (
        <div className="flex items-center justify-center py-6">
          <div className="h-10 w-10">
            <Loader />
          </div>
        </div>
      )}

      {hasMore && onLoadMore && !isFetchingMore && (
        <div ref={loadMoreRef} aria-hidden="true" className="h-px w-full" />
      )}
    </Accordion>
  );
}
