import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function fileSlug(title) {
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return `addflix-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${day}`;
}

export function formatReportValue(column, value) {
  if (value == null || value === "") return "";
  if (column.format === "money") return Number(value).toFixed(2);
  if (column.format === "money4") return Number(value).toFixed(4);
  return String(value);
}

export function displayReportValue(column, value) {
  const text = formatReportValue(column, value);
  if (!text) return "—";
  if (column.format === "money" || column.format === "money4") return `$${text}`;
  return text;
}

function summaryValue(item) {
  return typeof item.value === "number" ? item.value.toFixed(item.value % 1 ? 4 : 2).replace(/0+$/, "").replace(/\.$/, "") : String(item.value);
}

export function exportReportExcel({ title, columns, rows, summary }) {
  const sheetRows = [
    [title],
    [`ADD FLIX admin report · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`],
    [],
    ...(summary || []).map((item) => [item.label, typeof item.value === "number" ? item.value : String(item.value)]),
    [],
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => {
      if (column.format && row[column.key] != null && row[column.key] !== "") return Number(row[column.key]);
      return row[column.key] ?? "";
    })),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet["!cols"] = columns.map((column) => ({ wch: Math.min(36, Math.max(12, column.label.length + 4)) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, title.slice(0, 31));
  XLSX.writeFile(book, `${fileSlug(title)}.xlsx`);
}

export function exportReportPdf({ title, columns, rows, summary }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 36, 36);
  doc.setFontSize(9);
  doc.setTextColor(80);
  const line = [
    `ADD FLIX · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    ...(summary || []).map((item) => `${item.label}: ${summaryValue(item)}`),
  ].join("   ");
  doc.text(line, 36, 54, { maxWidth: 770 });
  autoTable(doc, {
    startY: 72,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => displayReportValue(column, row[column.key]))),
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [225, 6, 0], textColor: 255 },
    margin: { left: 36, right: 36 },
  });
  doc.save(`${fileSlug(title)}.pdf`);
}
