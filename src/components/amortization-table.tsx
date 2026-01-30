import { useState } from "react";
import { formatCurrency } from "../lib/format";
import type { AmortizationRow } from "../lib/calculations";

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  periodLabel?: string;
}

export function AmortizationTable({ schedule, periodLabel = "Year" }: AmortizationTableProps) {
  const [expanded, setExpanded] = useState(false);
  const displayRows = expanded ? schedule : schedule.slice(0, 5);
  const hasMore = schedule.length > 5;

  if (schedule.length === 0) return null;

  return (
    <div className="bg-cream rounded-2xl p-4 overflow-hidden">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Amortization Schedule</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-sand">
              <th className="text-left py-2 px-2 text-slate font-medium">{periodLabel}</th>
              <th className="text-right py-2 px-2 text-slate font-medium">Principal</th>
              <th className="text-right py-2 px-2 text-slate font-medium">Interest</th>
              <th className="text-right py-2 px-2 text-slate font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.period} className="border-b border-sand/50">
                <td className="py-2 px-2 text-charcoal">{row.period}</td>
                <td className="py-2 px-2 text-right text-charcoal">
                  {formatCurrency(row.principal)}
                </td>
                <td className="py-2 px-2 text-right text-slate">
                  {formatCurrency(row.interest)}
                </td>
                <td className="py-2 px-2 text-right text-charcoal font-medium">
                  {formatCurrency(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-terracotta hover:text-terracotta-dark font-medium transition-colors"
        >
          {expanded ? "Show less" : `Show all ${schedule.length} ${periodLabel.toLowerCase()}s`}
        </button>
      )}
    </div>
  );
}
