import {
  AreaChart,
  Area,
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

// Color palette
const COLORS = {
  principal: "#2d2a26", // charcoal
  interest: "#c45d3e", // terracotta
  balance: "#7a9a7a", // sage
  contributions: "#2d2a26",
  growth: "#c45d3e",
};

interface BalanceChartProps {
  schedule: AmortizationRow[];
  periodLabel?: string;
}

export function BalanceChart({ schedule, periodLabel = "Year" }: BalanceChartProps) {
  if (schedule.length === 0) return null;

  const data = schedule.map((row) => ({
    period: row.period,
    balance: row.balance,
    principal: row.totalPrincipal,
    interest: row.totalInterest,
  }));

  return (
    <div className="bg-cream rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Balance Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.balance} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.balance} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: "#6b6560" }}
              tickLine={false}
              axisLine={{ stroke: "#e8e4dc" }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: "#6b6560" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `${periodLabel} ${label}`}
              contentStyle={{
                backgroundColor: "#faf8f5",
                border: "1px solid #e8e4dc",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={COLORS.balance}
              strokeWidth={2}
              fill="url(#balanceGradient)"
              name="Remaining Balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface PaymentBreakdownChartProps {
  principal: number;
  interest: number;
}

export function PaymentBreakdownChart({ principal, interest }: PaymentBreakdownChartProps) {
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
                backgroundColor: "#faf8f5",
                border: "1px solid #e8e4dc",
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
              tick={{ fontSize: 12, fill: "#6b6560" }}
              tickLine={false}
              axisLine={{ stroke: "#e8e4dc" }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: "#6b6560" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                backgroundColor: "#faf8f5",
                border: "1px solid #e8e4dc",
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
                backgroundColor: "#faf8f5",
                border: "1px solid #e8e4dc",
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

interface MortgageCostChartProps {
  principal: number;
  interest: number;
  tax: number;
  insurance: number;
  hoa?: number;
  other?: number;
}

export function MortgageCostChart({
  principal,
  interest,
  tax,
  insurance,
  hoa = 0,
  other = 0,
}: MortgageCostChartProps) {
  const total = principal + interest + tax + insurance + hoa + other;
  if (total === 0) return null;

  const data = [
    { name: "Principal", value: principal, color: "#2d2a26" },
    { name: "Interest", value: interest, color: "#c45d3e" },
    { name: "Property Tax", value: tax, color: "#7a9a7a" },
    { name: "Insurance", value: insurance, color: "#6b6560" },
    ...(hoa > 0 ? [{ name: "HOA", value: hoa, color: "#d97b5d" }] : []),
    ...(other > 0 ? [{ name: "Other", value: other, color: "#9cb89c" }] : []),
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
                backgroundColor: "#faf8f5",
                border: "1px solid #e8e4dc",
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
