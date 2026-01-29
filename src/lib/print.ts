import type { AmortizationRow, InvestmentGrowthRow } from "./calculations";
import { formatCurrency } from "./format";

function getThemeStyles(isDark: boolean) {
  if (isDark) {
    return {
      bg: "#1a1917",
      cardBg: "#252422",
      text: "#f5f2ed",
      textMuted: "#9a9590",
      border: "#3a3733",
      accent: "#e07a5f",
    };
  }
  return {
    bg: "#faf8f5",
    cardBg: "#f5f2ed",
    text: "#2d2a26",
    textMuted: "#6b6560",
    border: "#e8e4dc",
    accent: "#c45d3e",
  };
}

function generateBaseStyles(colors: ReturnType<typeof getThemeStyles>) {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Instrument Sans", system-ui, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      padding: 40px;
      line-height: 1.5;
    }
    h1 {
      font-family: "DM Serif Display", serif;
      font-size: 28px;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${colors.textMuted};
      margin: 24px 0 12px;
      border-bottom: 1px solid ${colors.border};
      padding-bottom: 8px;
    }
    .date {
      font-size: 12px;
      color: ${colors.textMuted};
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid ${colors.border};
    }
    .row:last-child { border-bottom: none; }
    .label { color: ${colors.textMuted}; font-size: 13px; }
    .value { font-weight: 500; font-size: 13px; text-align: right; }
    .highlight {
      background: ${colors.cardBg};
      padding: 16px;
      border-radius: 12px;
      margin: 16px 0;
    }
    .highlight .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .highlight .value {
      font-family: "DM Serif Display", serif;
      font-size: 32px;
      color: ${colors.accent};
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }
    th {
      text-align: left;
      padding: 8px 12px;
      background: ${colors.cardBg};
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${colors.textMuted};
    }
    th:not(:first-child) { text-align: right; }
    td {
      padding: 6px 12px;
      border-bottom: 1px solid ${colors.border};
    }
    td:not(:first-child) { text-align: right; }
    tr:last-child td { border-bottom: none; }
    @media print {
      body { padding: 20px; }
      @page { margin: 0.5in; }
    }
  `;
}

function printViaIframe(title: string, content: string, isDark: boolean) {
  const colors = getThemeStyles(isDark);
  const styles = generateBaseStyles(colors);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
      <style>${styles}</style>
    </head>
    <body>${content}</body>
    </html>
  `;

  // Create hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for fonts to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    };
  }
}

interface LoanPrintData {
  principal: number;
  rate: number;
  years: number;
  repaymentType: string;
  gracePeriod?: { type: string; months: number };
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function printLoan(data: LoanPrintData, isDark: boolean) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const graceInfo = data.gracePeriod && data.gracePeriod.type !== "None"
    ? `<div class="row"><span class="label">Grace Period</span><span class="value">${data.gracePeriod.months} months (${data.gracePeriod.type})</span></div>`
    : "";

  const scheduleRows = data.schedule.map(row => `
    <tr>
      <td>${row.period}</td>
      <td>${formatCurrency(row.payment)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    </tr>
  `).join("");

  const content = `
    <h1>Loan Analysis</h1>
    <p class="date">Generated ${date}</p>

    <h2>Loan Details</h2>
    <div class="grid">
      <div class="row"><span class="label">Principal</span><span class="value">${formatCurrency(data.principal)}</span></div>
      <div class="row"><span class="label">Interest Rate</span><span class="value">${data.rate}%</span></div>
      <div class="row"><span class="label">Term</span><span class="value">${data.years} years</span></div>
      <div class="row"><span class="label">Repayment Type</span><span class="value">${data.repaymentType}</span></div>
      ${graceInfo}
    </div>

    <h2>Results</h2>
    <div class="highlight">
      <div class="label">Monthly Payment</div>
      <div class="value">${formatCurrency(data.monthlyPayment)}</div>
    </div>
    <div class="grid">
      <div class="row"><span class="label">Total Payment</span><span class="value">${formatCurrency(data.totalPayment)}</span></div>
      <div class="row"><span class="label">Total Interest</span><span class="value">${formatCurrency(data.totalInterest)}</span></div>
    </div>

    ${data.schedule.length > 0 ? `
      <h2>Amortization Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Payment</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>${scheduleRows}</tbody>
      </table>
    ` : ""}
  `;

  printViaIframe("Loan Analysis", content, isDark);
}

interface CustomCostPrint {
  name: string;
  monthlyAmount: number;
}

interface MortgagePrintData {
  homePrice: number;
  downPayment: number;
  loanAmount: number;
  rate: number;
  years: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  customCosts: CustomCostPrint[];
  totalMonthly: number;
  totalCost: number;
  totalInterest: number;
  schedule: AmortizationRow[];
}

export function printMortgage(data: MortgagePrintData, isDark: boolean) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const scheduleRows = data.schedule.map(row => `
    <tr>
      <td>${row.period}</td>
      <td>${formatCurrency(row.payment)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    </tr>
  `).join("");

  const content = `
    <h1>Mortgage Analysis</h1>
    <p class="date">Generated ${date}</p>

    <h2>Property & Loan</h2>
    <div class="grid">
      <div class="row"><span class="label">Home Price</span><span class="value">${formatCurrency(data.homePrice)}</span></div>
      <div class="row"><span class="label">Down Payment</span><span class="value">${formatCurrency(data.downPayment)}</span></div>
      <div class="row"><span class="label">Loan Amount</span><span class="value">${formatCurrency(data.loanAmount)}</span></div>
      <div class="row"><span class="label">Interest Rate</span><span class="value">${data.rate}%</span></div>
      <div class="row"><span class="label">Term</span><span class="value">${data.years} years</span></div>
    </div>

    <h2>Monthly Payment</h2>
    <div class="highlight">
      <div class="label">Total Monthly</div>
      <div class="value">${formatCurrency(data.totalMonthly)}</div>
    </div>
    <div class="grid">
      <div class="row"><span class="label">Principal & Interest</span><span class="value">${formatCurrency(data.monthlyPI)}</span></div>
      <div class="row"><span class="label">Property Tax</span><span class="value">${formatCurrency(data.monthlyTax)}</span></div>
      <div class="row"><span class="label">Insurance</span><span class="value">${formatCurrency(data.monthlyInsurance)}</span></div>
      ${data.monthlyHOA > 0 ? `<div class="row"><span class="label">HOA</span><span class="value">${formatCurrency(data.monthlyHOA)}</span></div>` : ""}
      ${data.customCosts.filter(c => c.monthlyAmount > 0).map(c => `<div class="row"><span class="label">${c.name || "Other"}</span><span class="value">${formatCurrency(c.monthlyAmount)}</span></div>`).join("")}
    </div>

    <h2>Totals</h2>
    <div class="grid">
      <div class="row"><span class="label">Total Interest</span><span class="value">${formatCurrency(data.totalInterest)}</span></div>
      <div class="row"><span class="label">Total Cost of Ownership</span><span class="value">${formatCurrency(data.totalCost)}</span></div>
    </div>

    <h2>Amortization Schedule</h2>
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Payment</th>
          <th>Principal</th>
          <th>Interest</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>${scheduleRows}</tbody>
    </table>
  `;

  printViaIframe("Mortgage Analysis", content, isDark);
}

interface InvestmentPrintData {
  initial: number;
  monthly: number;
  rate: number;
  years: number;
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
  schedule: InvestmentGrowthRow[];
}

export function printInvestment(data: InvestmentPrintData, isDark: boolean) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const growthMultiple = data.totalContributions > 0
    ? (data.futureValue / data.totalContributions).toFixed(2)
    : "0";

  const scheduleRows = data.schedule.map(row => `
    <tr>
      <td>${row.year}</td>
      <td>${formatCurrency(row.contributions)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    </tr>
  `).join("");

  const content = `
    <h1>Investment Projection</h1>
    <p class="date">Generated ${date}</p>

    <h2>Investment Details</h2>
    <div class="grid">
      <div class="row"><span class="label">Initial Investment</span><span class="value">${formatCurrency(data.initial)}</span></div>
      <div class="row"><span class="label">Monthly Contribution</span><span class="value">${formatCurrency(data.monthly)}</span></div>
      <div class="row"><span class="label">Expected Return</span><span class="value">${data.rate}%</span></div>
      <div class="row"><span class="label">Time Horizon</span><span class="value">${data.years} years</span></div>
    </div>

    <h2>Results</h2>
    <div class="highlight">
      <div class="label">Future Value</div>
      <div class="value">${formatCurrency(data.futureValue)}</div>
    </div>
    <div class="grid">
      <div class="row"><span class="label">Total Contributions</span><span class="value">${formatCurrency(data.totalContributions)}</span></div>
      <div class="row"><span class="label">Interest Earned</span><span class="value">${formatCurrency(data.totalInterest)}</span></div>
      <div class="row"><span class="label">Growth Multiple</span><span class="value">${growthMultiple}x</span></div>
    </div>

    <h2>Growth Schedule</h2>
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Contributions</th>
          <th>Interest</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>${scheduleRows}</tbody>
    </table>
  `;

  printViaIframe("Investment Projection", content, isDark);
}
