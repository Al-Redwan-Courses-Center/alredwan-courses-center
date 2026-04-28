"use client";

import { Table as TanStackTable, flexRender } from "@tanstack/react-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { DataTableMobileSkeleton } from "./data-table-skeletons";
import type { DataTableMobileConfig } from "./types";

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
    <Accordion type="single" collapsible className="space-y-[0.8rem]">
      {rows.map((row, index) => {
        const rowData = row.original;

        return (
          <AccordionItem
            key={row.id}
            value={row.id}
            /* Figma: bg-zinc-100, shadow, rounded-tr-[20px] rounded-bl-[20px] */
            className="overflow-hidden rounded-tr-[20px] rounded-bl-[20px] border-none bg-zinc-100 shadow-[7px_6px_14.6px_0px_rgba(0,0,0,0.08)]"
          >
            <AccordionTrigger className="flex-row-reverse gap-4 px-6 py-[1.15rem] text-[1.5rem] font-medium text-[#1F1F1F] hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-zinc-200/60 [&>svg]:h-[1.6rem] [&>svg]:w-[1.6rem] [&>svg]:shrink-0 [&>svg]:text-gray-500">
              <span className="flex flex-1 items-center justify-between gap-3">
                {/* Title */}
                <span>
                  {mobileConfig?.renderTitle
                    ? mobileConfig.renderTitle(rowData, index)
                    : `${index + 1}`}
                </span>
                {/* Subtitle badge */}
                {mobileConfig?.renderSubtitle && (
                  <span className="bg-olive-200/60 text-olive-700 rounded-full px-3 py-0.5 text-[1.2rem] font-normal">
                    {mobileConfig.renderSubtitle(rowData)}
                  </span>
                )}
              </span>
            </AccordionTrigger>

            {/* Expanded content — white card inside the gray shell */}
            <AccordionContent className="px-0 pt-0 pb-0">
              <div className="bg-white px-6 py-5">
                {mobileConfig?.renderContent ? (
                  mobileConfig.renderContent(rowData)
                ) : (
                  /* Default: key–value list of all visible cells */
                  <div className="space-y-4">
                    {row.getVisibleCells().map((cell) => {
                      const header = cell.column.columnDef.header;
                      if (typeof header !== "string") return null;
                      return (
                        <div
                          key={cell.id}
                          className="flex items-center justify-between gap-4 border-b border-gray-100 pb-[1rem] text-[1.4rem] last:border-none last:pb-0"
                        >
                          <span className="font-semibold text-gray-500">
                            {header}
                          </span>
                          <span className="text-[#1F1F1F]">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Row actions */}
                {mobileConfig?.renderActions && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
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
