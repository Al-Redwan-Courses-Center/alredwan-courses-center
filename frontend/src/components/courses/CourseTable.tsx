"use client";

import FourSquares from "@/components/icons/FourSquares";
import InfoIcon from "@/components/icons/InfoIcon";
import TableIcon from "@/components/icons/TableIcon";
import Table from "@/components/ui/table/Table";
import TableBody from "@/components/ui/table/TableBody";
import TableCell from "@/components/ui/table/TableCell";
import TableFilter from "@/components/ui/table/TableFilter";
import { TablePagination } from "@/components/ui/table/TablePagination";
import { TableHeader, TableRow } from "@/components/ui/table/TableRow";
import TableSearch from "@/components/ui/table/TableSearch";
import TableSort from "@/components/ui/table/TableSort";
import { Course, MOCK_COURSES } from "@/dev-data/courses";
import { cn, toHindiDigits } from "@/lib/utils";
import { useState } from "react";
import { motion } from "motion/react";

const toggleButtonStyles = cn(
  "grid aspect-square h-auto w-[2.6rem] place-items-center rounded-[0.5rem_0] py-3",
);

const toggleSvgStyles = cn(
  "h-full w-auto drop-shadow-[0_1px_2.4px_rgba(0,0,0,0.25)]",
);

export default function CourseTable() {
  const [view, setView] = useState("cards");

  return (
    <>
      <div className="absolute top-25 left-110 z-100 flex w-fit items-center gap-11 rounded-[1rem_0] bg-gray-100 p-2 text-gray-100 shadow-[0_1px_4.3px_0_rgba(0,0,0,0.25)_inset,0_3px_6.7px_0_rgba(0,0,0,0.07)_inset]">
        <button
          className={cn(
            toggleButtonStyles,
            view === "table" && "pointer-events-none relative",
          )}
          onClick={() => setView("table")}
        >
          {view === "table" && (
            <motion.div
              layoutId="toggleActiveBG"
              className="bg-olive-200 absolute h-full w-full rounded-[0.5rem_0]"
            ></motion.div>
          )}
          <TableIcon className={cn(toggleSvgStyles)} />
        </button>

        <button
          className={cn(
            toggleButtonStyles,
            view === "cards" && "pointer-events-none relative",
          )}
          onClick={() => setView("cards")}
        >
          {view === "cards" && (
            <motion.div
              layoutId="toggleActiveBG"
              className="bg-olive-200 absolute h-full w-full rounded-[0.5rem_0] shadow-[1.318px_1.13px_2.749px_0_rgba(0,0,0,0.25)]"
            ></motion.div>
          )}
          <FourSquares className={cn(toggleSvgStyles)} />
        </button>
      </div>

      {view === "cards" ? (
        <Table<Course>
          data={MOCK_COURSES}
          gridLayout={cn(
            "grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,0.5fr)]",
          )}
          filterConfig={{
            test: {
              key: "أ",
              label: "Abc",
            },
          }}
          sortConfig={{
            test: {
              label: "Abc",
              sortFn: (a: Course, b: Course) => 1,
            },
          }}
        >
          <div className="relative z-100 mb-14 flex items-center gap-32">
            <TableSearch />
            <TableSort />
            <TableFilter />
          </div>

          <TableHeader>
            <TableCell>م</TableCell>
            <TableCell>الدورة</TableCell>
            <TableCell>الموسم</TableCell>
            <TableCell>البداية</TableCell>
            <TableCell>النهاية</TableCell>
            <TableCell></TableCell>
          </TableHeader>

          <TableBody
            render={(item: Course, i) => (
              <TableRow index={i} key={item.id}>
                <TableCell>{toHindiDigits(item.id)}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.season?.name}</TableCell>
                <TableCell>{item.start_date}</TableCell>
                <TableCell>
                  {item.end_date ? item.end_date : "غير محدد"}
                </TableCell>
                <TableCell>
                  <div className="[&>button]:text-olive-300 [&>button]:hover:text-olive-700 flex items-center justify-center gap-6 [&>button]:transition-colors">
                    <button>
                      <InfoIcon />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          />

          <TablePagination />
        </Table>
      ) : (
        <h1 className="my-auto text-center text-3xl font-bold">Cards</h1>
      )}
    </>
  );
}
