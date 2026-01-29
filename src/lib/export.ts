import type { AmortizationRow, InvestmentGrowthRow } from "./calculations";
import { formatCurrency } from "./format";

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

  // Header section
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

  // Amortization schedule
  if (data.schedule.length > 0) {
    lines.push("Amortization Schedule");
    lines.push("Year,Payment,Principal,Interest,Remaining Balance,Total Principal Paid,Total Interest Paid");
    for (const row of data.schedule) {
      lines.push([
        row.period,
        formatCurrency(row.payment),
        formatCurrency(row.principal),
        formatCurrency(row.interest),
        formatCurrency(row.balance),
        formatCurrency(row.totalPrincipal),
        formatCurrency(row.totalInterest),
      ].map(escapeCSV).join(","));
    }
  }

  downloadCSV(lines.join("\n"), `loan-calculation-${formatDate()}.csv`);
}

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

  // Header section
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
  lines.push("Totals Over Loan Term");
  lines.push(`Total Interest,${formatCurrency(data.totalInterest)}`);
  lines.push(`Total Cost,${formatCurrency(data.totalCost)}`);
  lines.push("");

  // Amortization schedule
  if (data.schedule.length > 0) {
    lines.push("Amortization Schedule");
    lines.push("Year,Payment,Principal,Interest,Remaining Balance,Total Principal Paid,Total Interest Paid");
    for (const row of data.schedule) {
      lines.push([
        row.period,
        formatCurrency(row.payment),
        formatCurrency(row.principal),
        formatCurrency(row.interest),
        formatCurrency(row.balance),
        formatCurrency(row.totalPrincipal),
        formatCurrency(row.totalInterest),
      ].map(escapeCSV).join(","));
    }
  }

  downloadCSV(lines.join("\n"), `mortgage-calculation-${formatDate()}.csv`);
}

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

  // Header section
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

  // Growth schedule
  if (data.schedule.length > 0) {
    lines.push("Growth Schedule");
    lines.push("Year,Contributions,Interest Earned,Balance");
    for (const row of data.schedule) {
      lines.push([
        row.year,
        formatCurrency(row.contributions),
        formatCurrency(row.interest),
        formatCurrency(row.balance),
      ].map(escapeCSV).join(","));
    }
  }

  downloadCSV(lines.join("\n"), `investment-projection-${formatDate()}.csv`);
}

export function printPage() {
  window.print();
}
