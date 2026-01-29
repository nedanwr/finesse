import { useState, useMemo } from "react";
import { InputField } from "../input-field";
import { formatCurrency } from "../../lib/format";
import { calculateInvestment, generateInvestmentSchedule } from "../../lib/calculations";
import { InvestmentGrowthChart, InvestmentBreakdownChart } from "../charts";

interface InvestmentInputs {
  initial: number;
  monthly: number;
  rate: number;
  years: number;
}

export function InvestmentCalculator() {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initial: 10000,
    monthly: 500,
    rate: 8,
    years: 20,
  });

  const results = useMemo(
    () => calculateInvestment(inputs.initial, inputs.monthly, inputs.rate, inputs.years),
    [inputs]
  );

  const growthMultiple =
    results.totalContributions > 0
      ? (results.futureValue / results.totalContributions).toFixed(2)
      : "0";

  const percentFromInterest =
    results.futureValue > 0
      ? ((results.totalInterest / results.futureValue) * 100).toFixed(1)
      : "0";

  // Calculate year-by-year growth for milestones
  const milestones = useMemo(() => {
    const points: { year: number; value: number }[] = [];
    const checkYears = [5, 10, 15, 20, 25, 30, 40, 50].filter((y) => y <= inputs.years);

    for (const year of checkYears) {
      const result = calculateInvestment(inputs.initial, inputs.monthly, inputs.rate, year);
      points.push({ year, value: result.futureValue });
    }

    // Always include final year if not already included
    if (!checkYears.includes(inputs.years) && inputs.years > 0) {
      points.push({ year: inputs.years, value: results.futureValue });
    }

    return points.slice(0, 4); // Show max 4 milestones
  }, [inputs, results.futureValue]);

  // Generate investment growth schedule
  const investmentSchedule = useMemo(() => {
    return generateInvestmentSchedule(inputs.initial, inputs.monthly, inputs.rate, inputs.years);
  }, [inputs.initial, inputs.monthly, inputs.rate, inputs.years]);

  return (
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8 h-full">
      {/* Column 1: Inputs */}
      <div className="space-y-4 lg:overflow-y-auto lg:pr-6 lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal">Investment Details</h2>
        <div className="space-y-3">
          <InputField
            label="Initial Investment"
            value={inputs.initial}
            onChange={(initial) => setInputs((prev) => ({ ...prev, initial }))}
            prefix="$"
          />
          <InputField
            label="Monthly Contribution"
            value={inputs.monthly}
            onChange={(monthly) => setInputs((prev) => ({ ...prev, monthly }))}
            prefix="$"
          />
        </div>

        <div className="pt-3 border-t border-sand">
          <h2 className="text-base font-semibold text-charcoal mb-3">Growth Assumptions</h2>
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Expected Return"
              value={inputs.rate}
              onChange={(rate) => setInputs((prev) => ({ ...prev, rate }))}
              suffix="%"
              decimals={2}
              max={20}
            />
            <InputField
              label="Time Horizon"
              value={inputs.years}
              onChange={(years) => setInputs((prev) => ({ ...prev, years }))}
              suffix="yrs"
              min={1}
              max={50}
            />
          </div>
          <p className="text-xs text-slate mt-2">
            {inputs.rate}% annual return, compounded monthly.
          </p>
        </div>
      </div>

      {/* Column 2: Results */}
      <div className="lg:border-l lg:border-sand lg:pl-6 lg:overflow-y-auto lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal mb-4">Results</h2>

        {/* Primary Result Card */}
        <div className="bg-terracotta rounded-2xl p-5 mb-4">
          <p className="text-xs text-ivory/70 uppercase tracking-wide mb-1">Future Value</p>
          <p className="text-3xl font-serif text-ivory">{formatCurrency(results.futureValue)}</p>
          <p className="text-xs text-ivory/60 mt-1">
            {growthMultiple}x your contributions
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-slate uppercase tracking-wide">Contributions</p>
            <p className="text-base font-serif text-charcoal">
              {formatCurrency(results.totalContributions)}
            </p>
          </div>
          <div className="bg-cream rounded-xl p-3">
            <p className="text-xs text-slate uppercase tracking-wide">Interest Earned</p>
            <p className="text-base font-serif text-charcoal">
              {formatCurrency(results.totalInterest)}
            </p>
          </div>
        </div>

        {/* Growth Milestones */}
        {milestones.length > 1 && (
          <div className="bg-cream rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-charcoal mb-2">Milestones</h3>
            <div className="space-y-1.5 text-sm">
              {milestones.map((milestone) => (
                <div key={milestone.year} className="flex justify-between items-center">
                  <span className="text-slate">Year {milestone.year}</span>
                  <span className="font-medium text-charcoal">
                    {formatCurrency(milestone.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-cream rounded-xl p-4">
          <h3 className="text-sm font-semibold text-charcoal mb-2">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate">Initial</span>
              <span className="text-charcoal">{formatCurrency(inputs.initial)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Monthly</span>
              <span className="text-charcoal">{formatCurrency(inputs.monthly)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Total Contributed</span>
              <span className="text-charcoal">{formatCurrency(results.totalContributions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Interest ({percentFromInterest}%)</span>
              <span className="text-charcoal">{formatCurrency(results.totalInterest)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-sand">
              <span className="font-semibold text-charcoal">Future Value</span>
              <span className="font-semibold text-charcoal">{formatCurrency(results.futureValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Visualizations */}
      <div className="xl:border-l xl:border-sand xl:pl-6 lg:col-span-2 xl:col-span-1 lg:overflow-y-auto lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal mb-4">Visualizations</h2>

        {investmentSchedule.length > 0 && (
          <div className="space-y-4">
            <InvestmentBreakdownChart
              contributions={results.totalContributions}
              interest={results.totalInterest}
            />
            <InvestmentGrowthChart schedule={investmentSchedule} />
          </div>
        )}
      </div>
    </div>
  );
}
