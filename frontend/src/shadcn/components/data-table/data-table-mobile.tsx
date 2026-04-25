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
    <Accordion type="single" collapsible className="space-y-3">
      {rows.map((row, index) => {
        const rowData = row.original;

        return (
          <AccordionItem
            key={row.id}
            value={row.id}
            className="overflow-hidden rounded-[1.2rem] border-none bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <AccordionTrigger
              className={`data-[state=open]:bg-olive-200/50 [&>svg]:text-olive-500 flex-row-reverse gap-3 px-6 py-4 text-[1.55rem] font-bold text-gray-800 hover:no-underline [&>svg]:transition-transform ${index % 2 === 0 ? "bg-gray-50/80" : "bg-white"} `}
            >
              <span className="flex flex-1 items-center justify-between gap-3">
                <span>
                  {mobileConfig?.renderTitle
                    ? mobileConfig.renderTitle(rowData, index)
                    : `${index + 1}`}
                </span>
                {mobileConfig?.renderSubtitle && (
                  <span className="text-[1.25rem] font-normal text-gray-500">
                    {mobileConfig.renderSubtitle(rowData)}
                  </span>
                )}
              </span>
            </AccordionTrigger>

            <AccordionContent className="px-6 pt-3 pb-5">
              <div className="space-y-4">
                {mobileConfig?.renderContent ? (
                  mobileConfig.renderContent(rowData)
                ) : (
                  <div className="space-y-3">
                    {row.getVisibleCells().map((cell) => {
                      const header = cell.column.columnDef.header;
                      if (typeof header !== "string") return null;

                      return (
                        <div
                          key={cell.id}
                          className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 text-[1.4rem] last:border-none last:pb-0"
                        >
                          <span className="font-bold text-gray-500">
                            {header} :
                          </span>
                          <span className="text-gray-800">
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

                {mobileConfig?.renderActions && (
                  <div className="border-t border-gray-100 pt-3">
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
