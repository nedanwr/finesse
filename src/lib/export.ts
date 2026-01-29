import ExcelJS from "exceljs";
import type { AmortizationRow, InvestmentGrowthRow } from "./calculations";
import { formatCurrency } from "./format";

// ============================================================================
// CSV Export Functions
// ============================================================================

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateLong(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================================================
// Excel Styling
// ============================================================================

const COLORS = {
  charcoal: "FF2d2a26",
  terracotta: "FFc45d3e",
  cream: "FFf5f2ed",
  sand: "FFe8e4dc",
  ivory: "FFfaf8f5",
  white: "FFFFFFFF",
  slate: "FF6b6560",
  sage: "FF7a9a7a",
};

function createWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Finesse Calculator";
  workbook.created = new Date();
  return workbook;
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Loan Export
// ============================================================================

interface LoanExportData {
  principal: number;
  rate: number;
  years: number;
  repaymentType: string;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function exportLoanCSV(data: LoanExportData) {
  const lines: string[] = [];
  lines.push("Loan Calculator Export");
  lines.push(`Generated,${formatDate()}`);
  lines.push("");
  lines.push("Loan Details");
  lines.push(`Principal,${formatCurrency(data.principal)}`);
  lines.push(`Interest Rate,${data.rate}%`);
  lines.push(`Term,${data.years} years`);
  lines.push(`Repayment Type,${data.repaymentType}`);
  lines.push("");
  lines.push("Results");
  lines.push(`Monthly Payment,${formatCurrency(data.monthlyPayment)}`);
  lines.push(`Total Payment,${formatCurrency(data.totalPayment)}`);
  lines.push(`Total Interest,${formatCurrency(data.totalInterest)}`);
  lines.push("");

  if (data.schedule.length > 0) {
    lines.push("Amortization Schedule");
    lines.push("Year,Payment,Principal,Interest,Balance,Total Principal,Total Interest");
    for (const row of data.schedule) {
      lines.push(
        [row.period, formatCurrency(row.payment), formatCurrency(row.principal), formatCurrency(row.interest), formatCurrency(row.balance), formatCurrency(row.totalPrincipal), formatCurrency(row.totalInterest)].map(escapeCSV).join(",")
      );
    }
  }
  downloadCSV(lines.join("\n"), `loan-calculation-${formatDate()}.csv`);
}

export async function exportLoanExcel(data: LoanExportData) {
  const workbook = createWorkbook();

  // Summary Sheet
  const summary = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: COLORS.terracotta.slice(2) } },
  });

  summary.columns = [
    { width: 3 },  // A - margin
    { width: 22 }, // B
    { width: 18 }, // C
    { width: 3 },  // D - margin
    { width: 18 }, // E - for chart
    { width: 18 }, // F
    { width: 18 }, // G
  ];

  // Title area with background
  summary.mergeCells("B2:G2");
  const titleCell = summary.getCell("B2");
  titleCell.value = "Loan Analysis";
  titleCell.font = { size: 24, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };

  summary.getCell("B3").value = `Generated ${formatDateLong()}`;
  summary.getCell("B3").font = { size: 10, italic: true, color: { argb: COLORS.slate.slice(2) } };

  // Main result highlight box
  summary.mergeCells("B5:C7");
  const highlightCell = summary.getCell("B5");
  highlightCell.value = {
    richText: [
      { text: "MONTHLY PAYMENT\n", font: { size: 10, color: { argb: "FFFFFF" } } },
      { text: formatCurrency(data.monthlyPayment), font: { size: 28, bold: true, color: { argb: "FFFFFF" } } },
    ],
  };
  highlightCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.terracotta.slice(2) } };
  highlightCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  highlightCell.border = {
    top: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    left: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    bottom: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    right: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
  };

  // Loan Details Section
  let row = 9;
  summary.mergeCells(`B${row}:C${row}`);
  const detailsHeader = summary.getCell(`B${row}`);
  detailsHeader.value = "LOAN DETAILS";
  detailsHeader.font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  detailsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  detailsHeader.border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  row++;

  const details = [
    ["Principal", formatCurrency(data.principal)],
    ["Interest Rate", `${data.rate}%`],
    ["Term", `${data.years} years`],
    ["Repayment Type", data.repaymentType],
  ];

  for (const [label, value] of details) {
    summary.getCell(`B${row}`).value = label;
    summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
    summary.getCell(`C${row}`).value = value;
    summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
    summary.getCell(`C${row}`).alignment = { horizontal: "right" };
    row++;
  }
  row++;

  // Results Section
  summary.mergeCells(`B${row}:C${row}`);
  const resultsHeader = summary.getCell(`B${row}`);
  resultsHeader.value = "TOTALS";
  resultsHeader.font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  resultsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  resultsHeader.border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  row++;

  const principalPct = ((data.principal / data.totalPayment) * 100).toFixed(1);
  const interestPct = ((data.totalInterest / data.totalPayment) * 100).toFixed(1);

  const results = [
    ["Total Payment", formatCurrency(data.totalPayment)],
    ["Total Interest", formatCurrency(data.totalInterest)],
    ["Principal", `${principalPct}%`],
    ["Interest", `${interestPct}%`],
  ];

  for (const [label, value] of results) {
    summary.getCell(`B${row}`).value = label;
    summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
    summary.getCell(`C${row}`).value = value;
    summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
    summary.getCell(`C${row}`).alignment = { horizontal: "right" };
    row++;
  }

  // Pie Chart Data (hidden, used for chart)
  const chartDataRow = 5;
  summary.getCell(`E${chartDataRow}`).value = "Principal";
  summary.getCell(`F${chartDataRow}`).value = data.principal;
  summary.getCell(`E${chartDataRow + 1}`).value = "Interest";
  summary.getCell(`F${chartDataRow + 1}`).value = data.totalInterest;

  // Hide chart data
  summary.getColumn(5).hidden = false;
  summary.getColumn(6).hidden = false;

  // Add pie chart
  const chart = workbook.addWorksheet("_chartdata");
  chart.state = "hidden";

  // Unfortunately ExcelJS doesn't support pie charts directly in the free version
  // We'll add a visual representation using cells instead

  // Chart title area
  summary.mergeCells("E9:G9");
  summary.getCell("E9").value = "PAYMENT BREAKDOWN";
  summary.getCell("E9").font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell("E9").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell("E9").border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  summary.getCell("E9").alignment = { horizontal: "center" };

  summary.getCell("E11").value = "Principal";
  summary.getCell("E11").font = { size: 9, color: { argb: COLORS.slate.slice(2) } };
  summary.getCell("F11").value = `${principalPct}%`;
  summary.getCell("F11").font = { size: 9, bold: true };
  summary.getCell("F11").alignment = { horizontal: "right" };
  summary.getCell("G11").value = formatCurrency(data.principal);
  summary.getCell("G11").font = { size: 9 };
  summary.getCell("G11").alignment = { horizontal: "right" };

  // Principal bar
  summary.mergeCells("E12:G12");
  summary.getCell("E12").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.charcoal.slice(2) } };
  summary.getRow(12).height = 8;

  summary.getCell("E14").value = "Interest";
  summary.getCell("E14").font = { size: 9, color: { argb: COLORS.slate.slice(2) } };
  summary.getCell("F14").value = `${interestPct}%`;
  summary.getCell("F14").font = { size: 9, bold: true };
  summary.getCell("F14").alignment = { horizontal: "right" };
  summary.getCell("G14").value = formatCurrency(data.totalInterest);
  summary.getCell("G14").font = { size: 9 };
  summary.getCell("G14").alignment = { horizontal: "right" };

  // Interest bar
  summary.mergeCells("E15:G15");
  summary.getCell("E15").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.terracotta.slice(2) } };
  summary.getRow(15).height = 8;

  // Schedule Sheet
  if (data.schedule.length > 0) {
    const schedule = workbook.addWorksheet("Amortization Schedule", {
      properties: { tabColor: { argb: COLORS.sage.slice(2) } },
    });

    schedule.columns = [
      { width: 8 },   // Year
      { width: 14 },  // Payment
      { width: 14 },  // Principal
      { width: 14 },  // Interest
      { width: 16 },  // Balance
      { width: 16 },  // Total Principal
      { width: 16 },  // Total Interest
    ];

    // Header row
    const headerRow = schedule.getRow(1);
    headerRow.values = ["Year", "Payment", "Principal", "Interest", "Balance", "Total Principal", "Total Interest"];
    headerRow.font = { size: 10, bold: true, color: { argb: COLORS.white.slice(2) } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.charcoal.slice(2) } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    // Data rows
    data.schedule.forEach((item, index) => {
      const dataRow = schedule.getRow(index + 2);
      dataRow.values = [
        item.period,
        formatCurrency(item.payment),
        formatCurrency(item.principal),
        formatCurrency(item.interest),
        formatCurrency(item.balance),
        formatCurrency(item.totalPrincipal),
        formatCurrency(item.totalInterest),
      ];
      dataRow.font = { size: 9, color: { argb: COLORS.charcoal.slice(2) } };
      dataRow.alignment = { horizontal: "right" };
      dataRow.getCell(1).alignment = { horizontal: "center" };

      if (index % 2 === 0) {
        dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.ivory.slice(2) } };
      }
    });

    // Add borders to all cells
    const lastRow = data.schedule.length + 1;
    for (let r = 1; r <= lastRow; r++) {
      for (let c = 1; c <= 7; c++) {
        schedule.getCell(r, c).border = {
          top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
        };
      }
    }

    // Freeze header row
    schedule.views = [{ state: "frozen", ySplit: 1 }];
  }

  await downloadWorkbook(workbook, `loan-analysis-${formatDate()}.xlsx`);
}

// ============================================================================
// Mortgage Export
// ============================================================================

interface MortgageExportData {
  homePrice: number;
  downPayment: number;
  loanAmount: number;
  rate: number;
  years: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyOther: number;
  totalMonthly: number;
  totalCost: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function exportMortgageCSV(data: MortgageExportData) {
  const lines: string[] = [];
  lines.push("Mortgage Calculator Export");
  lines.push(`Generated,${formatDate()}`);
  lines.push("");
  lines.push("Property Details");
  lines.push(`Home Price,${formatCurrency(data.homePrice)}`);
  lines.push(`Down Payment,${formatCurrency(data.downPayment)}`);
  lines.push(`Loan Amount,${formatCurrency(data.loanAmount)}`);
  lines.push(`Interest Rate,${data.rate}%`);
  lines.push(`Term,${data.years} years`);
  lines.push("");
  lines.push("Monthly Costs");
  lines.push(`Principal & Interest,${formatCurrency(data.monthlyPI)}`);
  lines.push(`Property Tax,${formatCurrency(data.monthlyTax)}`);
  lines.push(`Insurance,${formatCurrency(data.monthlyInsurance)}`);
  lines.push(`HOA,${formatCurrency(data.monthlyHOA)}`);
  lines.push(`Other Costs,${formatCurrency(data.monthlyOther)}`);
  lines.push(`Total Monthly,${formatCurrency(data.totalMonthly)}`);
  lines.push("");
  lines.push("Totals");
  lines.push(`Total Interest,${formatCurrency(data.totalInterest)}`);
  lines.push(`Total Cost,${formatCurrency(data.totalCost)}`);
  lines.push("");

  if (data.schedule.length > 0) {
    lines.push("Amortization Schedule");
    lines.push("Year,Payment,Principal,Interest,Balance,Total Principal,Total Interest");
    for (const row of data.schedule) {
      lines.push(
        [row.period, formatCurrency(row.payment), formatCurrency(row.principal), formatCurrency(row.interest), formatCurrency(row.balance), formatCurrency(row.totalPrincipal), formatCurrency(row.totalInterest)].map(escapeCSV).join(",")
      );
    }
  }
  downloadCSV(lines.join("\n"), `mortgage-calculation-${formatDate()}.csv`);
}

export async function exportMortgageExcel(data: MortgageExportData) {
  const workbook = createWorkbook();

  const summary = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: COLORS.terracotta.slice(2) } },
  });

  summary.columns = [
    { width: 3 },
    { width: 22 },
    { width: 18 },
    { width: 3 },
    { width: 22 },
    { width: 18 },
  ];

  // Title
  summary.mergeCells("B2:F2");
  summary.getCell("B2").value = "Mortgage Analysis";
  summary.getCell("B2").font = { size: 24, bold: true, color: { argb: COLORS.charcoal.slice(2) } };

  summary.getCell("B3").value = `Generated ${formatDateLong()}`;
  summary.getCell("B3").font = { size: 10, italic: true, color: { argb: COLORS.slate.slice(2) } };

  // Main highlight
  summary.mergeCells("B5:C7");
  const highlightCell = summary.getCell("B5");
  highlightCell.value = {
    richText: [
      { text: "TOTAL MONTHLY\n", font: { size: 10, color: { argb: "FFFFFF" } } },
      { text: formatCurrency(data.totalMonthly), font: { size: 28, bold: true, color: { argb: "FFFFFF" } } },
    ],
  };
  highlightCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.terracotta.slice(2) } };
  highlightCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  highlightCell.border = {
    top: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    left: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    bottom: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    right: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
  };

  // Property Details
  let row = 9;
  summary.mergeCells(`B${row}:C${row}`);
  summary.getCell(`B${row}`).value = "PROPERTY & LOAN";
  summary.getCell(`B${row}`).font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell(`B${row}`).border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  row++;

  const propDetails = [
    ["Home Price", formatCurrency(data.homePrice)],
    ["Down Payment", formatCurrency(data.downPayment)],
    ["Loan Amount", formatCurrency(data.loanAmount)],
    ["Interest Rate", `${data.rate}%`],
    ["Term", `${data.years} years`],
  ];

  for (const [label, value] of propDetails) {
    summary.getCell(`B${row}`).value = label;
    summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
    summary.getCell(`C${row}`).value = value;
    summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
    summary.getCell(`C${row}`).alignment = { horizontal: "right" };
    row++;
  }
  row++;

  // Monthly Breakdown section header
  summary.mergeCells(`B${row}:C${row}`);
  summary.getCell(`B${row}`).value = "MONTHLY BREAKDOWN";
  summary.getCell(`B${row}`).font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell(`B${row}`).border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  row++;

  // Monthly costs with visual bars
  const monthlyCosts: [string, number, string][] = [
    ["Principal & Interest", data.monthlyPI, COLORS.charcoal],
    ["Property Tax", data.monthlyTax, COLORS.sage],
    ["Insurance", data.monthlyInsurance, COLORS.slate],
  ];
  if (data.monthlyHOA > 0) monthlyCosts.push(["HOA", data.monthlyHOA, "FFd97b5d"]);
  if (data.monthlyOther > 0) monthlyCosts.push(["Other", data.monthlyOther, "FF9cb89c"]);

  for (const [label, value, color] of monthlyCosts) {
    const pct = ((value / data.totalMonthly) * 100).toFixed(1);
    summary.getCell(`B${row}`).value = label;
    summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
    summary.getCell(`C${row}`).value = `${formatCurrency(value)} (${pct}%)`;
    summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
    summary.getCell(`C${row}`).alignment = { horizontal: "right" };
    row++;

    // Color bar
    summary.mergeCells(`B${row}:C${row}`);
    summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.slice(2) } };
    summary.getRow(row).height = 6;
    row++;
  }
  row++;

  // Visual breakdown on right side
  summary.mergeCells("E5:F5");
  summary.getCell("E5").value = "COST BREAKDOWN";
  summary.getCell("E5").font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell("E5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell("E5").border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  summary.getCell("E5").alignment = { horizontal: "center" };

  let chartRow = 7;
  for (const [label, value, color] of monthlyCosts) {
    const pct = ((value / data.totalMonthly) * 100).toFixed(0);

    // Color indicator
    summary.getCell(`E${chartRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.slice(2) } };
    summary.getCell(`E${chartRow}`).border = {
      top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
      left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
      bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
      right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    };
    summary.getCell(`F${chartRow}`).value = `${label}: ${pct}%`;
    summary.getCell(`F${chartRow}`).font = { size: 9, color: { argb: COLORS.charcoal.slice(2) } };
    chartRow++;
  }

  // Totals
  summary.mergeCells(`E${chartRow + 1}:F${chartRow + 1}`);
  summary.getCell(`E${chartRow + 1}`).value = "TOTALS OVER LOAN TERM";
  summary.getCell(`E${chartRow + 1}`).font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`E${chartRow + 1}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell(`E${chartRow + 1}`).border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  chartRow += 2;

  summary.getCell(`E${chartRow}`).value = "Total Interest";
  summary.getCell(`E${chartRow}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
  summary.getCell(`F${chartRow}`).value = formatCurrency(data.totalInterest);
  summary.getCell(`F${chartRow}`).font = { size: 10, bold: true };
  summary.getCell(`F${chartRow}`).alignment = { horizontal: "right" };
  chartRow++;

  summary.getCell(`E${chartRow}`).value = "Total Cost";
  summary.getCell(`E${chartRow}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
  summary.getCell(`F${chartRow}`).value = formatCurrency(data.totalCost);
  summary.getCell(`F${chartRow}`).font = { size: 12, bold: true, color: { argb: COLORS.terracotta.slice(2) } };
  summary.getCell(`F${chartRow}`).alignment = { horizontal: "right" };

  // Schedule Sheet
  if (data.schedule.length > 0) {
    const schedule = workbook.addWorksheet("Amortization Schedule", {
      properties: { tabColor: { argb: COLORS.sage.slice(2) } },
    });

    schedule.columns = [
      { width: 8 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
    ];

    const headerRow = schedule.getRow(1);
    headerRow.values = ["Year", "Payment", "Principal", "Interest", "Balance", "Total Principal", "Total Interest"];
    headerRow.font = { size: 10, bold: true, color: { argb: COLORS.white.slice(2) } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.charcoal.slice(2) } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    data.schedule.forEach((item, index) => {
      const dataRow = schedule.getRow(index + 2);
      dataRow.values = [
        item.period,
        formatCurrency(item.payment),
        formatCurrency(item.principal),
        formatCurrency(item.interest),
        formatCurrency(item.balance),
        formatCurrency(item.totalPrincipal),
        formatCurrency(item.totalInterest),
      ];
      dataRow.font = { size: 9, color: { argb: COLORS.charcoal.slice(2) } };
      dataRow.alignment = { horizontal: "right" };
      dataRow.getCell(1).alignment = { horizontal: "center" };

      if (index % 2 === 0) {
        dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.ivory.slice(2) } };
      }
    });

    const lastRow = data.schedule.length + 1;
    for (let r = 1; r <= lastRow; r++) {
      for (let c = 1; c <= 7; c++) {
        schedule.getCell(r, c).border = {
          top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
        };
      }
    }

    schedule.views = [{ state: "frozen", ySplit: 1 }];
  }

  await downloadWorkbook(workbook, `mortgage-analysis-${formatDate()}.xlsx`);
}

// ============================================================================
// Investment Export
// ============================================================================

interface InvestmentExportData {
  initial: number;
  monthly: number;
  rate: number;
  years: number;
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
  schedule: InvestmentGrowthRow[];
}

export function exportInvestmentCSV(data: InvestmentExportData) {
  const lines: string[] = [];
  lines.push("Investment Calculator Export");
  lines.push(`Generated,${formatDate()}`);
  lines.push("");
  lines.push("Investment Details");
  lines.push(`Initial Investment,${formatCurrency(data.initial)}`);
  lines.push(`Monthly Contribution,${formatCurrency(data.monthly)}`);
  lines.push(`Expected Return,${data.rate}%`);
  lines.push(`Time Horizon,${data.years} years`);
  lines.push("");
  lines.push("Results");
  lines.push(`Future Value,${formatCurrency(data.futureValue)}`);
  lines.push(`Total Contributions,${formatCurrency(data.totalContributions)}`);
  lines.push(`Total Interest Earned,${formatCurrency(data.totalInterest)}`);
  lines.push("");

  if (data.schedule.length > 0) {
    lines.push("Growth Schedule");
    lines.push("Year,Contributions,Interest Earned,Balance");
    for (const row of data.schedule) {
      lines.push(
        [row.year, formatCurrency(row.contributions), formatCurrency(row.interest), formatCurrency(row.balance)].map(escapeCSV).join(",")
      );
    }
  }
  downloadCSV(lines.join("\n"), `investment-projection-${formatDate()}.csv`);
}

export async function exportInvestmentExcel(data: InvestmentExportData) {
  const workbook = createWorkbook();

  const summary = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: COLORS.terracotta.slice(2) } },
  });

  summary.columns = [
    { width: 3 },
    { width: 22 },
    { width: 18 },
    { width: 3 },
    { width: 22 },
    { width: 18 },
  ];

  // Title
  summary.mergeCells("B2:F2");
  summary.getCell("B2").value = "Investment Projection";
  summary.getCell("B2").font = { size: 24, bold: true, color: { argb: COLORS.charcoal.slice(2) } };

  summary.getCell("B3").value = `Generated ${formatDateLong()}`;
  summary.getCell("B3").font = { size: 10, italic: true, color: { argb: COLORS.slate.slice(2) } };

  // Main highlight
  summary.mergeCells("B5:C7");
  const highlightCell = summary.getCell("B5");
  highlightCell.value = {
    richText: [
      { text: "FUTURE VALUE\n", font: { size: 10, color: { argb: "FFFFFF" } } },
      { text: formatCurrency(data.futureValue), font: { size: 28, bold: true, color: { argb: "FFFFFF" } } },
    ],
  };
  highlightCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.terracotta.slice(2) } };
  highlightCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  highlightCell.border = {
    top: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    left: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    bottom: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
    right: { style: "medium", color: { argb: COLORS.terracotta.slice(2) } },
  };

  // Growth multiple box
  const growthMultiple = data.totalContributions > 0 ? (data.futureValue / data.totalContributions).toFixed(2) : "0";
  summary.mergeCells("E5:F7");
  const growthCell = summary.getCell("E5");
  growthCell.value = {
    richText: [
      { text: "GROWTH MULTIPLE\n", font: { size: 10, color: { argb: COLORS.charcoal.slice(2) } } },
      { text: `${growthMultiple}x`, font: { size: 28, bold: true, color: { argb: COLORS.terracotta.slice(2) } } },
    ],
  };
  growthCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  growthCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  growthCell.border = {
    top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
  };

  // Investment Details
  let row = 9;
  summary.mergeCells(`B${row}:C${row}`);
  summary.getCell(`B${row}`).value = "INVESTMENT DETAILS";
  summary.getCell(`B${row}`).font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell(`B${row}`).border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  row++;

  const details = [
    ["Initial Investment", formatCurrency(data.initial)],
    ["Monthly Contribution", formatCurrency(data.monthly)],
    ["Expected Return", `${data.rate}%`],
    ["Time Horizon", `${data.years} years`],
  ];

  for (const [label, value] of details) {
    summary.getCell(`B${row}`).value = label;
    summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
    summary.getCell(`C${row}`).value = value;
    summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
    summary.getCell(`C${row}`).alignment = { horizontal: "right" };
    row++;
  }
  row++;

  // Results breakdown
  summary.mergeCells(`B${row}:C${row}`);
  summary.getCell(`B${row}`).value = "VALUE BREAKDOWN";
  summary.getCell(`B${row}`).font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell(`B${row}`).border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  row++;

  const contribPct = ((data.totalContributions / data.futureValue) * 100).toFixed(1);
  const interestPct = ((data.totalInterest / data.futureValue) * 100).toFixed(1);

  // Contributions
  summary.getCell(`B${row}`).value = "Contributions";
  summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
  summary.getCell(`C${row}`).value = `${formatCurrency(data.totalContributions)} (${contribPct}%)`;
  summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`C${row}`).alignment = { horizontal: "right" };
  row++;

  summary.mergeCells(`B${row}:C${row}`);
  summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.charcoal.slice(2) } };
  summary.getRow(row).height = 8;
  row++;

  // Interest
  summary.getCell(`B${row}`).value = "Interest Earned";
  summary.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.slate.slice(2) } };
  summary.getCell(`C${row}`).value = `${formatCurrency(data.totalInterest)} (${interestPct}%)`;
  summary.getCell(`C${row}`).font = { size: 10, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell(`C${row}`).alignment = { horizontal: "right" };
  row++;

  summary.mergeCells(`B${row}:C${row}`);
  summary.getCell(`B${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.terracotta.slice(2) } };
  summary.getRow(row).height = 8;

  // Legend on right side
  summary.mergeCells("E9:F9");
  summary.getCell("E9").value = "BREAKDOWN LEGEND";
  summary.getCell("E9").font = { size: 11, bold: true, color: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell("E9").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.cream.slice(2) } };
  summary.getCell("E9").border = { bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } } };
  summary.getCell("E9").alignment = { horizontal: "center" };

  summary.getCell("E11").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.charcoal.slice(2) } };
  summary.getCell("E11").border = {
    top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
  };
  summary.getCell("F11").value = `Contributions: ${contribPct}%`;
  summary.getCell("F11").font = { size: 9, color: { argb: COLORS.charcoal.slice(2) } };

  summary.getCell("E12").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.terracotta.slice(2) } };
  summary.getCell("E12").border = {
    top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
    right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
  };
  summary.getCell("F12").value = `Interest: ${interestPct}%`;
  summary.getCell("F12").font = { size: 9, color: { argb: COLORS.charcoal.slice(2) } };

  // Schedule Sheet
  if (data.schedule.length > 0) {
    const schedule = workbook.addWorksheet("Growth Schedule", {
      properties: { tabColor: { argb: COLORS.sage.slice(2) } },
    });

    schedule.columns = [
      { width: 8 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    const headerRow = schedule.getRow(1);
    headerRow.values = ["Year", "Contributions", "Interest", "Balance"];
    headerRow.font = { size: 10, bold: true, color: { argb: COLORS.white.slice(2) } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.charcoal.slice(2) } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    data.schedule.forEach((item, index) => {
      const dataRow = schedule.getRow(index + 2);
      dataRow.values = [
        item.year,
        formatCurrency(item.contributions),
        formatCurrency(item.interest),
        formatCurrency(item.balance),
      ];
      dataRow.font = { size: 9, color: { argb: COLORS.charcoal.slice(2) } };
      dataRow.alignment = { horizontal: "right" };
      dataRow.getCell(1).alignment = { horizontal: "center" };

      if (index % 2 === 0) {
        dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.ivory.slice(2) } };
      }
    });

    const lastRow = data.schedule.length + 1;
    for (let r = 1; r <= lastRow; r++) {
      for (let c = 1; c <= 4; c++) {
        schedule.getCell(r, c).border = {
          top: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          left: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          bottom: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
          right: { style: "thin", color: { argb: COLORS.sand.slice(2) } },
        };
      }
    }

    schedule.views = [{ state: "frozen", ySplit: 1 }];
  }

  await downloadWorkbook(workbook, `investment-projection-${formatDate()}.xlsx`);
}
