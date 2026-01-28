import { useState, useMemo } from "react";
import { InputField } from "../input-field";
import { ResultCard } from "../result-card";
import { formatCurrency } from "../../lib/format";
import { calculateInvestment } from "../../lib/calculations";

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
    () =>
      calculateInvestment(inputs.initial, inputs.monthly, inputs.rate, inputs.years),
    [inputs]
  );

  const growthMultiple =
    results.totalContributions > 0
      ? (results.futureValue / results.totalContributions).toFixed(1)
      : 0;

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 mb-10">
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
        <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid gap-4">
        <ResultCard
          label="Future Value"
          value={formatCurrency(results.futureValue)}
          highlight
          subtext={`${growthMultiple}x your contributions`}
        />
        <div className="grid grid-cols-2 gap-4">
          <ResultCard
            label="Total Contributions"
            value={formatCurrency(results.totalContributions)}
          />
          <ResultCard
            label="Interest Earned"
            value={formatCurrency(results.totalInterest)}
          />
        </div>
      </div>
    </div>
  );
}
