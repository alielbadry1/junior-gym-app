import ExcelJS from "exceljs";

export type ImportState = {
  status: "idle" | "done";
  successCount: number;
  errorCount: number;
  errors: string[];
};

export const INITIAL_IMPORT_STATE: ImportState = {
  status: "idle",
  successCount: 0,
  errorCount: 0,
  errors: [],
};

export async function rowsToExcelBuffer(
  rows: Record<string, unknown>[],
  sheetName: string,
  headers?: string[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  sheet.columns = cols.map((key) => ({ header: key, key, width: 22 }));
  rows.forEach((r) => sheet.addRow(r));
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function excelHeaders(contentType?: string) {
  return {
    "Content-Type":
      contentType ??
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

/** يحوّل خلية ExcelJS (ممكن تكون نص عادي أو object غني زي rich text/hyperlink) لنص بسيط */
function cellToPlainValue(value: ExcelJS.CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return cellToPlainValue(value.result as ExcelJS.CellValue);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return null;
  }
  return value as string | number;
}

export async function excelBufferToRows(
  buffer: ArrayBuffer
): Promise<Record<string, string | number | null>[]> {
  const workbook = new ExcelJS.Workbook();
  // Cast needed: exceljs bundles its own @types/node copy whose `Buffer`
  // type structurally diverges from this project's (newer) global Buffer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(buffer) as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cellToPlainValue(cell.value) ?? "").trim();
  });

  const rows: Record<string, string | number | null>[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const obj: Record<string, string | number | null> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (!key) return;
      const value = cellToPlainValue(cell.value);
      obj[key] = value;
      if (value !== null && value !== "") hasValue = true;
    });
    if (hasValue) rows.push(obj);
  }
  return rows;
}

export function readCell(
  row: Record<string, string | number | null>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}
