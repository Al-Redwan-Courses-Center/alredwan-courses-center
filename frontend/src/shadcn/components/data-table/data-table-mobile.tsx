"use client";

import { Table as TanStackTable, flexRender } from "@tanstack/react-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { DataTableMobileSkeleton } from "./data-table-skeletons";
import type {
  DataTableMobileConfig,
  DataTableMobileContentItem,
} from "./types";

interface DataTableMobileViewProps<TData> {
  table: TanStackTable<TData>;
  mobileConfig?: DataTableMobileConfig<TData>;
  isLoading?: boolean;
  loadingRowsCount?: number;
}

export function DataTableMobileView<TData>({
  table,
  mobileConfig,
  isLoading = false,
  loadingRowsCount = 4,
}: DataTableMobileViewProps<TData>) {
  const rows = table.getRowModel().rows;

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
      className="w-full space-y-[1.2rem]"
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
          <AccordionItem
            key={row.id}
            value={row.id}
            variant="figma-mobile"
            className="w-full overflow-hidden rounded-[20px] border-none bg-zinc-100"
          >
            <AccordionTrigger
              variant="figma-mobile"
              className="bg-neutral-200/60 px-5 py-4 hover:no-underline"
            >
              <div className="flex flex-1 items-center justify-start gap-4">
                <span className="truncate text-[1.6rem] font-bold text-gray-800">
                  {mobileConfig?.renderTitle
                    ? mobileConfig.renderTitle(rowData, index)
                    : `${index + 1}- المحاضرة`}
                </span>
                {mobileConfig?.renderSubtitle && (
                  <span className="text-[1.1rem] font-medium text-gray-500">
                    {mobileConfig.renderSubtitle(rowData)}
                  </span>
                )}
              </div>
            </AccordionTrigger>

            <AccordionContent variant="figma-mobile" className="p-5">
              <div className="grid grid-cols-2 gap-x-2 gap-y-4 text-right">
                {contentItems.map((item, itemIndex) => {
                  return (
                    <div
                      key={item.key ?? `${row.id}-mobile-item-${itemIndex}`}
                      className="flex items-center justify-start gap-1"
                    >
                      <span className="text-[1.3rem] font-semibold whitespace-nowrap text-gray-900">
                        {item.label} :
                      </span>
                      <span className="truncate text-[1.3rem] font-normal text-gray-900">
                        {item.value}
                      </span>
                    </div>
                  );
                })}

                {mobileConfig?.renderActions && (
                  <div className="flex items-center justify-end">
                    {mobileConfig.renderActions(rowData)}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
