import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "../lib/format";
import type { AmortizationRow, InvestmentGrowthRow } from "../lib/calculations";

// Hook to detect if dark mode is active
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Color palette - returns theme-aware colors
function useColors() {
  const isDark = useIsDarkMode();

  return {
    principal: isDark ? "#a8a29e" : "#2d2a26", // stone in dark, charcoal in light
    interest: "#c45d3e", // terracotta works in both
    balance: "#7a9a7a", // sage
    contributions: isDark ? "#a8a29e" : "#2d2a26",
    growth: "#c45d3e",
    tax: "#6b8e6b", // muted green
    insurance: "#8b7355", // tan
    hoa: "#d97b5d", // lighter terracotta
    other: "#9cb89c", // light sage
    text: isDark ? "#a8a29e" : "#6b6560",
    axis: isDark ? "#44403c" : "#e8e4dc",
    tooltip: {
      bg: isDark ? "#292524" : "#faf8f5",
      border: isDark ? "#44403c" : "#e8e4dc",
    },
  };
}

type ChartView = "balance" | "payments";

interface MonthlyCosts {
  tax?: number;
  insurance?: number;
  hoa?: number;
  other?: number;
}

interface BalanceChartProps {
  schedule: AmortizationRow[];
  periodLabel?: string;
  monthlyCosts?: MonthlyCosts;
}

export function BalanceChart({ schedule, periodLabel = "Year", monthlyCosts }: BalanceChartProps) {
  const [view, setView] = useState<ChartView>("balance");
  const COLORS = useColors();

  if (schedule.length === 0) return null;

  const hasMonthlyCosts = monthlyCosts && (
    (monthlyCosts.tax && monthlyCosts.tax > 0) ||
    (monthlyCosts.insurance && monthlyCosts.insurance > 0) ||
    (monthlyCosts.hoa && monthlyCosts.hoa > 0) ||
    (monthlyCosts.other && monthlyCosts.other > 0)
  );

  const balanceData = schedule.map((row) => ({
    period: row.period,
    principal: row.totalPrincipal,
    interest: row.totalInterest,
  }));

  const paymentsData = schedule.map((row) => {
    const monthsPerPeriod = periodLabel === "Year" ? 12 : 1;
    const periodsElapsed = row.period;

    const result: Record<string, number> = {
      period: row.period,
      principal: row.totalPrincipal,
      interest: row.totalInterest,
    };

    if (hasMonthlyCosts) {
      if (monthlyCosts.tax) result.tax = monthlyCosts.tax * monthsPerPeriod * periodsElapsed;
      if (monthlyCosts.insurance) result.insurance = monthlyCosts.insurance * monthsPerPeriod * periodsElapsed;
      if (monthlyCosts.hoa) result.hoa = monthlyCosts.hoa * monthsPerPeriod * periodsElapsed;
      if (monthlyCosts.other) result.other = monthlyCosts.other * monthsPerPeriod * periodsElapsed;
    }

    return result;
  });

  const paymentLines = [
    { key: "principal", name: "Principal", color: COLORS.principal },
    { key: "interest", name: "Interest", color: COLORS.interest },
  ];

  if (hasMonthlyCosts) {
    if (monthlyCosts?.tax) paymentLines.push({ key: "tax", name: "Property Tax", color: COLORS.tax });
    if (monthlyCosts?.insurance) paymentLines.push({ key: "insurance", name: "Insurance", color: COLORS.insurance });
    if (monthlyCosts?.hoa) paymentLines.push({ key: "hoa", name: "HOA", color: COLORS.hoa });
    if (monthlyCosts?.other) paymentLines.push({ key: "other", name: "Other", color: COLORS.other });
  }

  return (
    <div className="bg-cream rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-charcoal">
          {view === "balance" ? "Principal & Interest" : "All Payments"}
        </h3>
        <div className="flex bg-sand rounded-lg p-0.5">
          <button
            onClick={() => setView("balance")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              view === "balance" ? "bg-charcoal text-ivory" : "text-slate hover:text-charcoal"
            }`}
          >
            Balance
          </button>
          <button
            onClick={() => setView("payments")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              view === "payments" ? "bg-charcoal text-ivory" : "text-slate hover:text-charcoal"
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {view === "balance" ? (
            <AreaChart data={balanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.principal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.principal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.interest} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.interest} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.axis }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => `${periodLabel} ${label}`}
                contentStyle={{
                  backgroundColor: COLORS.tooltip.bg,
                  border: `1px solid ${COLORS.tooltip.border}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="principal"
                stroke={COLORS.principal}
                strokeWidth={2}
                fill="url(#principalGradient)"
                name="Principal Paid"
              />
              <Area
                type="monotone"
                dataKey="interest"
                stroke={COLORS.interest}
                strokeWidth={2}
                fill="url(#interestGradient)"
                name="Interest Paid"
              />
            </AreaChart>
          ) : (
            <LineChart data={paymentsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={{ stroke: COLORS.axis }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: COLORS.text }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => `${periodLabel} ${label}`}
                contentStyle={{
                  backgroundColor: COLORS.tooltip.bg,
                  border: `1px solid ${COLORS.tooltip.border}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              {paymentLines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  name={line.name}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {view === "balance" ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.principal }} />
              <span className="text-xs text-slate">Principal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.interest }} />
              <span className="text-xs text-slate">Interest</span>
            </div>
          </>
        ) : (
          paymentLines.map((line) => (
            <div key={line.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
              <span className="text-xs text-slate">{line.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface PaymentBreakdownChartProps {
  principal: number;
  interest: number;
}

export function PaymentBreakdownChart({ principal, interest }: PaymentBreakdownChartProps) {
  const COLORS = useColors();
  const total = principal + interest;
  if (total === 0) return null;

  const data = [
    { name: "Principal", value: principal, color: COLORS.principal },
    { name: "Interest", value: interest, color: COLORS.interest },
  ];

  const principalPercent = ((principal / total) * 100).toFixed(0);
  const interestPercent = ((interest / total) * 100).toFixed(0);

  return (
    <div className="bg-cream rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Total Payment Breakdown</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                backgroundColor: COLORS.tooltip.bg,
                border: `1px solid ${COLORS.tooltip.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.principal }} />
          <span className="text-xs text-slate">Principal ({principalPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.interest }} />
          <span className="text-xs text-slate">Interest ({interestPercent}%)</span>
        </div>
      </div>
    </div>
  );
}

interface InvestmentGrowthChartProps {
  schedule: InvestmentGrowthRow[];
}

export function InvestmentGrowthChart({ schedule }: InvestmentGrowthChartProps) {
  const COLORS = useColors();
  if (schedule.length === 0) return null;

  const data = schedule.map((row) => ({
    year: row.year,
    contributions: row.contributions,
    total: row.balance,
  }));

  return (
    <div className="bg-cream rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Growth Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="contribGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.contributions} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.contributions} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: COLORS.text }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: COLORS.text }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                backgroundColor: COLORS.tooltip.bg,
                border: `1px solid ${COLORS.tooltip.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke={COLORS.growth}
              strokeWidth={2}
              fill="url(#totalGradient)"
              name="Total Value"
            />
            <Area
              type="monotone"
              dataKey="contributions"
              stroke={COLORS.contributions}
              strokeWidth={2}
              fill="url(#contribGradient)"
              name="Contributions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.growth }} />
          <span className="text-xs text-slate">Total Value</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.contributions }} />
          <span className="text-xs text-slate">Contributions</span>
        </div>
      </div>
    </div>
  );
}

interface InvestmentBreakdownChartProps {
  contributions: number;
  interest: number;
}

export function InvestmentBreakdownChart({ contributions, interest }: InvestmentBreakdownChartProps) {
  const COLORS = useColors();
  const total = contributions + interest;
  if (total === 0) return null;

  const data = [
    { name: "Contributions", value: contributions, color: COLORS.contributions },
    { name: "Interest Earned", value: interest, color: COLORS.growth },
  ];

  const contribPercent = ((contributions / total) * 100).toFixed(0);
  const interestPercent = ((interest / total) * 100).toFixed(0);

  return (
    <div className="bg-cream rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Final Value Breakdown</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                backgroundColor: COLORS.tooltip.bg,
                border: `1px solid ${COLORS.tooltip.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.contributions }} />
          <span className="text-xs text-slate">Contributions ({contribPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.growth }} />
          <span className="text-xs text-slate">Interest ({interestPercent}%)</span>
        </div>
      </div>
    </div>
  );
}

interface InvestmentStackedChartProps {
  schedule: InvestmentGrowthRow[];
}

export function InvestmentStackedChart({ schedule }: InvestmentStackedChartProps) {
  const COLORS = useColors();
  if (schedule.length === 0) return null;

  const data = schedule.map((row) => ({
    year: row.year,
    contributions: row.contributions,
    interest: row.interest,
  }));

  return (
    <div className="bg-cream rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Contributions vs Interest</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="contribStackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.contributions} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.contributions} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="interestStackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.growth} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.growth} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: COLORS.text }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: COLORS.text }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                backgroundColor: COLORS.tooltip.bg,
                border: `1px solid ${COLORS.tooltip.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="contributions"
              stackId="1"
              stroke={COLORS.contributions}
              strokeWidth={2}
              fill="url(#contribStackGradient)"
              name="Contributions"
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke={COLORS.growth}
              strokeWidth={2}
              fill="url(#interestStackGradient)"
              name="Interest"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.contributions }} />
          <span className="text-xs text-slate">Contributions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.growth }} />
          <span className="text-xs text-slate">Interest</span>
        </div>
      </div>
    </div>
  );
}

interface CustomCostItem {
  name: string;
  value: number;
}

interface MortgageCostChartProps {
  principal: number;
  interest: number;
  tax: number;
  insurance: number;
  hoa?: number;
  customCosts?: CustomCostItem[];
}

// Extended color palette for custom costs
const CUSTOM_COST_COLORS = [
  "#9cb89c", // light sage
  "#b8a88a", // tan
  "#a89090", // dusty rose
  "#8aa8b8", // steel blue
  "#b8a0c0", // lavender
  "#c0b890", // olive
];

export function MortgageCostChart({
  principal,
  interest,
  tax,
  insurance,
  hoa = 0,
  customCosts = [],
}: MortgageCostChartProps) {
  const COLORS = useColors();
  const customCostsTotal = customCosts.reduce((sum, c) => sum + c.value, 0);
  const total = principal + interest + tax + insurance + hoa + customCostsTotal;
  if (total === 0) return null;

  const data = [
    { name: "Principal", value: principal, color: COLORS.principal },
    { name: "Interest", value: interest, color: COLORS.interest },
    { name: "Property Tax", value: tax, color: COLORS.tax },
    { name: "Insurance", value: insurance, color: COLORS.insurance },
    ...(hoa > 0 ? [{ name: "HOA", value: hoa, color: COLORS.hoa }] : []),
    ...customCosts
      .filter(c => c.value > 0)
      .map((c, idx) => ({
        name: c.name || "Other",
        value: c.value,
        color: CUSTOM_COST_COLORS[idx % CUSTOM_COST_COLORS.length],
      })),
  ];

  return (
    <div className="bg-cream rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Total Cost Breakdown</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                backgroundColor: COLORS.tooltip.bg,
                border: `1px solid ${COLORS.tooltip.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate">
              {item.name} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
