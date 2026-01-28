import { useState, useMemo } from "react";
import { InputField } from "../input-field";
import { ResultCard } from "../result-card";
import { formatCurrency, formatCurrencyPrecise } from "../../lib/format";
import { calculateLoanWithGracePeriod, type GracePeriodType } from "../../lib/calculations";

interface LoanInputs {
  principal: number;
  rate: number;
  years: number;
  gracePeriodMonths: number;
  gracePeriodType: GracePeriodType;
}

const graceOptions: { id: GracePeriodType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "interest_only", label: "Interest Only" },
  { id: "no_payment", label: "Full Deferral" },
];

export function LoanCalculator() {
  const [inputs, setInputs] = useState<LoanInputs>({
    principal: 25000,
    rate: 7.5,
    years: 5,
    gracePeriodMonths: 0,
    gracePeriodType: "none",
  });

  const results = useMemo(
    () =>
      calculateLoanWithGracePeriod(
        inputs.principal,
        inputs.rate,
        inputs.years,
        inputs.gracePeriodMonths,
        inputs.gracePeriodType
      ),
    [inputs]
  );

  const hasGracePeriod = inputs.gracePeriodType !== "none" && inputs.gracePeriodMonths > 0;

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 mb-10">
        <InputField
          label="Loan Amount"
          value={inputs.principal}
          onChange={(principal) => setInputs((prev) => ({ ...prev, principal }))}
          prefix="$"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Interest Rate"
            value={inputs.rate}
            onChange={(rate) => setInputs((prev) => ({ ...prev, rate }))}
            suffix="%"
            decimals={2}
            max={30}
          />
          <InputField
            label="Loan Term"
            value={inputs.years}
            onChange={(years) => setInputs((prev) => ({ ...prev, years }))}
            suffix="yrs"
            min={1}
            max={30}
          />
        </div>

        <div className="pt-4 border-t-2 border-sand">
          <label className="block text-sm font-medium text-slate mb-3 tracking-wide uppercase">
            Grace Period
          </label>
          <div className="flex gap-2 mb-4">
            {graceOptions.map((option) => (
              <button
                key={option.id}
                onClick={() =>
                  setInputs((prev) => ({
                    ...prev,
                    gracePeriodType: option.id,
                    gracePeriodMonths: option.id === "none" ? 0 : prev.gracePeriodMonths || 6,
                  }))
                }
                className={`
                  flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    inputs.gracePeriodType === option.id
                      ? "bg-charcoal text-ivory"
                      : "bg-cream text-slate hover:text-charcoal border-2 border-sand"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          {inputs.gracePeriodType !== "none" && (
            <div className="animate-fade-in">
              <InputField
                label="Grace Period Length"
                value={inputs.gracePeriodMonths}
                onChange={(gracePeriodMonths) =>
                  setInputs((prev) => ({ ...prev, gracePeriodMonths }))
                }
                suffix="mo"
                min={1}
                max={24}
              />
              <p className="text-sm text-slate mt-2">
                {inputs.gracePeriodType === "interest_only"
                  ? "You'll pay interest only during this period. Principal payments begin after."
                  : "No payments during this period. Unpaid interest will be added to your loan balance."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <ResultCard
          label="Monthly Payment"
          value={formatCurrencyPrecise(results.monthlyPayment)}
          highlight
          subtext={
            hasGracePeriod
              ? `After ${inputs.gracePeriodMonths}mo grace period`
              : undefined
          }
        />

        {hasGracePeriod && inputs.gracePeriodType === "interest_only" && (
          <ResultCard
            label="During Grace Period"
            value={formatCurrencyPrecise(results.gracePayment)}
            subtext="Interest-only payment"
          />
        )}

        {hasGracePeriod && inputs.gracePeriodType === "no_payment" && (
          <ResultCard
            label="Balance After Grace"
            value={formatCurrency(results.principalAfterGrace)}
            subtext={`+${formatCurrency(results.graceInterest)} capitalized interest`}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <ResultCard
            label="Total Interest"
            value={formatCurrency(results.totalInterest)}
          />
          <ResultCard
            label="Total Payment"
            value={formatCurrency(results.totalPayment)}
          />
        </div>
      </div>
    </div>
  );
}
