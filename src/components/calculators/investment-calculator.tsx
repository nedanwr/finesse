import { useState, useMemo, useCallback } from "react";
import { InputField } from "../input-field";
import { formatCurrency } from "../../lib/format";
import { calculateInvestment, generateInvestmentSchedule } from "../../lib/calculations";
import { InvestmentGrowthChart, InvestmentBreakdownChart, InvestmentStackedChart } from "../charts";
import { ExportControls } from "../export-controls";
import { exportInvestmentCSV, exportInvestmentExcel } from "../../lib/export";
import { printInvestment } from "../../lib/print";

type ContributionFrequency = "monthly" | "yearly";

interface InvestmentInputs {
  initial: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  rate: number;
  years: number;
  inflation: number;
  adjustForInflation: boolean;
}

export function InvestmentCalculator() {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initial: 10000,
    contribution: 500,
    contributionFrequency: "monthly",
    rate: 8,
    years: 20,
    inflation: 3,
    adjustForInflation: false,
  });

  // Convert yearly contribution to monthly if needed
  const monthlyContribution = inputs.contributionFrequency === "yearly"
    ? inputs.contribution / 12
    : inputs.contribution;

  // Effective rate after inflation adjustment
  const effectiveRate = inputs.adjustForInflation
    ? Math.max(0, inputs.rate - inputs.inflation)
    : inputs.rate;

  const results = useMemo(
    () => calculateInvestment(inputs.initial, monthlyContribution, effectiveRate, inputs.years),
    [inputs.initial, monthlyContribution, effectiveRate, inputs.years]
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
      const result = calculateInvestment(inputs.initial, monthlyContribution, effectiveRate, year);
      points.push({ year, value: result.futureValue });
    }

    // Always include final year if not already included
    if (!checkYears.includes(inputs.years) && inputs.years > 0) {
      points.push({ year: inputs.years, value: results.futureValue });
    }

    return points.slice(0, 4); // Show max 4 milestones
  }, [inputs.initial, monthlyContribution, effectiveRate, inputs.years, results.futureValue]);

  // Generate investment growth schedule
  const investmentSchedule = useMemo(() => {
    return generateInvestmentSchedule(inputs.initial, monthlyContribution, effectiveRate, inputs.years);
  }, [inputs.initial, monthlyContribution, effectiveRate, inputs.years]);

  const handleExportCSV = useCallback(() => {
    exportInvestmentCSV({
      initial: inputs.initial,
      monthly: monthlyContribution,
      rate: effectiveRate,
      years: inputs.years,
      futureValue: results.futureValue,
      totalContributions: results.totalContributions,
      totalInterest: results.totalInterest,
      schedule: investmentSchedule,
    });
  }, [inputs, monthlyContribution, effectiveRate, results, investmentSchedule]);

  const handleExportExcel = useCallback(() => {
    exportInvestmentExcel({
      initial: inputs.initial,
      monthly: monthlyContribution,
      rate: effectiveRate,
      years: inputs.years,
      futureValue: results.futureValue,
      totalContributions: results.totalContributions,
      totalInterest: results.totalInterest,
      schedule: investmentSchedule,
    });
  }, [inputs, monthlyContribution, effectiveRate, results, investmentSchedule]);

  const handlePrint = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    printInvestment({
      initial: inputs.initial,
      monthly: monthlyContribution,
      rate: effectiveRate,
      years: inputs.years,
      futureValue: results.futureValue,
      totalContributions: results.totalContributions,
      totalInterest: results.totalInterest,
      schedule: investmentSchedule,
    }, isDark);
  }, [inputs, monthlyContribution, effectiveRate, results, investmentSchedule]);

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate uppercase tracking-wide">
                Contribution
              </label>
              <div className="flex bg-sand rounded-lg p-0.5">
                <button
                  onClick={() => setInputs((prev) => ({ ...prev, contributionFrequency: "monthly" }))}
                  className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                    inputs.contributionFrequency === "monthly"
                      ? "bg-charcoal text-ivory"
                      : "text-slate hover:text-charcoal"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setInputs((prev) => ({ ...prev, contributionFrequency: "yearly" }))}
                  className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                    inputs.contributionFrequency === "yearly"
                      ? "bg-charcoal text-ivory"
                      : "text-slate hover:text-charcoal"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
            <InputField
              label=""
              value={inputs.contribution}
              onChange={(contribution) => setInputs((prev) => ({ ...prev, contribution }))}
              prefix="$"
            />
          </div>
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
              max={50}
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

        {/* Inflation Adjustment */}
        <div className="pt-3 border-t border-sand">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate uppercase tracking-wide">
              Inflation Adjustment
            </label>
            <button
              onClick={() => setInputs((prev) => ({ ...prev, adjustForInflation: !prev.adjustForInflation }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                inputs.adjustForInflation ? "bg-terracotta" : "bg-sand"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-ivory rounded-full shadow transition-transform ${
                  inputs.adjustForInflation ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {inputs.adjustForInflation && (
            <div className="animate-fade-in">
              <InputField
                label="Expected Inflation"
                value={inputs.inflation}
                onChange={(inflation) => setInputs((prev) => ({ ...prev, inflation }))}
                suffix="%"
                decimals={2}
                max={20}
              />
              <p className="text-xs text-slate mt-2">
                Real return: {effectiveRate.toFixed(2)}% ({inputs.rate}% - {inputs.inflation}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Results */}
      <div className="lg:border-l lg:border-sand lg:pl-6 lg:overflow-y-auto lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal mb-4">Results</h2>

        {/* Primary Result Card */}
        <div className="bg-terracotta rounded-2xl p-5 mb-4">
          <p className="text-xs text-ivory/70 uppercase tracking-wide mb-1">
            Future Value {inputs.adjustForInflation && "(Real)"}
          </p>
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
              <span className="text-slate">
                {inputs.contributionFrequency === "yearly" ? "Yearly" : "Monthly"}
              </span>
              <span className="text-charcoal">{formatCurrency(inputs.contribution)}</span>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-charcoal">Visualizations</h2>
          <ExportControls onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onPrint={handlePrint} />
        </div>

        {investmentSchedule.length > 0 && (
          <div className="space-y-4">
            <InvestmentBreakdownChart
              contributions={results.totalContributions}
              interest={results.totalInterest}
            />
            <InvestmentStackedChart schedule={investmentSchedule} />
            <InvestmentGrowthChart schedule={investmentSchedule} />
          </div>
        )}
      </div>
    </div>
  );
}
