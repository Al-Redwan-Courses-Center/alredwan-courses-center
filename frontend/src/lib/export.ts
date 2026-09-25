import * as xlsx from "xlsx";

/**
 * Exports an array of objects to an Excel (.xlsx) file.
 * The keys of the objects will be used as the column headers.
 *
 * @param data Array of objects to export
 * @param filename Name of the file (without .xlsx extension)
 */
export function exportToExcel(data: Record<string, any>[], filename: string) {
  // Create a worksheet from the data
  const worksheet = xlsx.utils.json_to_sheet(data);

  // Set Right-to-Left (RTL) direction for Arabic compatibility
  if (!worksheet["!views"]) {
    worksheet["!views"] = [{ rightToLeft: true }];
  }

  // Create a new workbook and append the sheet
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Trigger file download
  xlsx.writeFile(workbook, `${filename}.xlsx`);
}
