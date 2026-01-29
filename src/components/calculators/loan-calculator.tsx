import { useState, useMemo } from "react";
import { InputField } from "../input-field";
import { formatCurrency, formatCurrencyPrecise } from "../../lib/format";
import {
  calculateLoanWithGracePeriod,
  calculateBalloonLoan,
  calculateBulletLoan,
  generateAmortizationSchedule,
  type GracePeriodType,
} from "../../lib/calculations";
import { AmortizationTable } from "../amortization-table";
import { BalanceChart, PaymentBreakdownChart } from "../charts";

type RepaymentType = "standard" | "balloon" | "bullet";

interface LoanInputs {
  principal: number;
  rate: number;
  years: number;
  repaymentType: RepaymentType;
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
    repaymentType: "standard",
    gracePeriodMonths: 0,
    gracePeriodType: "none",
  });

  const standardResults = useMemo(
    () =>
      calculateLoanWithGracePeriod(
        inputs.principal,
        inputs.rate,
        inputs.years,
        inputs.gracePeriodMonths,
        inputs.gracePeriodType
      ),
    [inputs.principal, inputs.rate, inputs.years, inputs.gracePeriodMonths, inputs.gracePeriodType]
  );

  const balloonResults = useMemo(
    () => calculateBalloonLoan(inputs.principal, inputs.rate, inputs.years),
    [inputs.principal, inputs.rate, inputs.years]
  );

  const bulletResults = useMemo(
    () => calculateBulletLoan(inputs.principal, inputs.rate, inputs.years),
    [inputs.principal, inputs.rate, inputs.years]
  );

  const isBalloon = inputs.repaymentType === "balloon";
  const isBullet = inputs.repaymentType === "bullet";
  const results = isBullet ? bulletResults : isBalloon ? balloonResults : standardResults;
  const hasGracePeriod =
    inputs.repaymentType === "standard" &&
    inputs.gracePeriodType !== "none" &&
    inputs.gracePeriodMonths > 0;

  // Generate amortization schedule for standard loans
  const amortizationSchedule = useMemo(() => {
    if (inputs.repaymentType !== "standard") return [];
    const effectivePrincipal = hasGracePeriod ? standardResults.principalAfterGrace : inputs.principal;
    return generateAmortizationSchedule(effectivePrincipal, inputs.rate, inputs.years);
  }, [inputs.principal, inputs.rate, inputs.years, inputs.repaymentType, standardResults.principalAfterGrace, hasGracePeriod]);

  // Calculate first month's principal vs interest split (for amortized loans)
  const firstMonthBreakdown = useMemo(() => {
    if (inputs.repaymentType !== "standard") return null;

    const effectivePrincipal = hasGracePeriod ? standardResults.principalAfterGrace : inputs.principal;
    const monthlyRate = inputs.rate / 100 / 12;
    const firstMonthInterest = effectivePrincipal * monthlyRate;
    const firstMonthPrincipal = standardResults.monthlyPayment - firstMonthInterest;

    return {
      interest: firstMonthInterest,
      principal: firstMonthPrincipal,
      interestPercent: (firstMonthInterest / standardResults.monthlyPayment) * 100,
      principalPercent: (firstMonthPrincipal / standardResults.monthlyPayment) * 100,
    };
  }, [inputs.principal, inputs.rate, inputs.repaymentType, standardResults, hasGracePeriod]);

  return (
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8 h-full">
      {/* Column 1: Inputs */}
      <div className="space-y-4 lg:overflow-y-auto lg:pr-6 lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal">Loan Details</h2>
        <div className="space-y-3">
          <InputField
            label="Loan Amount"
            value={inputs.principal}
            onChange={(principal) => setInputs((prev) => ({ ...prev, principal }))}
            prefix="$"
          />
          <div className="grid grid-cols-2 gap-2">
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
        </div>

        {/* Repayment Type */}
        <div className="pt-3 border-t border-sand">
          <label className="block text-xs font-medium text-slate mb-2 tracking-wide uppercase">
            Repayment Type
          </label>
          <div className="flex gap-1.5">
            {[
              { id: "standard" as RepaymentType, label: "Amortized" },
              { id: "balloon" as RepaymentType, label: "Interest Only" },
              { id: "bullet" as RepaymentType, label: "Bullet" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() =>
                  setInputs((prev) => ({
                    ...prev,
                    repaymentType: type.id,
                    ...(type.id !== "standard" && { gracePeriodType: "none" as GracePeriodType, gracePeriodMonths: 0 }),
                  }))
                }
                className={`
                  flex-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${
                    inputs.repaymentType === type.id
                      ? "bg-charcoal text-ivory"
                      : "bg-cream text-slate hover:text-charcoal border border-sand"
                  }
                `}
              >
                {type.label}
              </button>
            ))}
          </div>
          {isBalloon && (
            <p className="text-xs text-slate mt-2">Interest only, principal at maturity.</p>
          )}
          {isBullet && (
            <p className="text-xs text-slate mt-2">Everything due at maturity.</p>
          )}
        </div>

        {/* Grace Period - only for standard loans */}
        {inputs.repaymentType === "standard" && (
          <div className="pt-3 border-t border-sand">
            <label className="block text-xs font-medium text-slate mb-2 tracking-wide uppercase">
              Grace Period
            </label>
            <div className="flex gap-1.5 mb-2">
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
                    flex-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${
                      inputs.gracePeriodType === option.id
                        ? "bg-charcoal text-ivory"
                        : "bg-cream text-slate hover:text-charcoal border border-sand"
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
                  label="Grace Period"
                  value={inputs.gracePeriodMonths}
                  onChange={(gracePeriodMonths) =>
                    setInputs((prev) => ({ ...prev, gracePeriodMonths }))
                  }
                  suffix="mo"
                  min={1}
                  max={24}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column 2: Results */}
      <div className="lg:border-l lg:border-sand lg:pl-6 lg:overflow-y-auto lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal mb-4">Results</h2>

        {/* Primary Result Card */}
        {isBullet ? (
          <div className="bg-terracotta rounded-2xl p-5 mb-4">
            <p className="text-xs text-ivory/70 uppercase tracking-wide mb-1">Payment at Maturity</p>
            <p className="text-3xl font-serif text-ivory">
              {formatCurrency(bulletResults.finalPayment)}
            </p>
            <p className="text-xs text-ivory/60 mt-1">
              After {inputs.years} years
            </p>
          </div>
        ) : (
          <div className="bg-terracotta rounded-2xl p-5 mb-4">
            <p className="text-xs text-ivory/70 uppercase tracking-wide mb-1">
              {isBalloon ? "Monthly Interest" : "Monthly Payment"}
            </p>
            <p className="text-3xl font-serif text-ivory">
              {formatCurrencyPrecise(results.monthlyPayment)}
            </p>
            {hasGracePeriod && (
              <p className="text-xs text-ivory/60 mt-1">After {inputs.gracePeriodMonths}mo grace</p>
            )}
          </div>
        )}

        {/* P&I Breakdown - for amortized loans */}
        {firstMonthBreakdown && inputs.repaymentType === "standard" && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-cream rounded-xl p-3">
              <p className="text-xs text-slate uppercase tracking-wide">Principal</p>
              <p className="text-base font-serif text-charcoal">
                {formatCurrencyPrecise(firstMonthBreakdown.principal)}
              </p>
              <p className="text-xs text-slate">{firstMonthBreakdown.principalPercent.toFixed(0)}%</p>
            </div>
            <div className="bg-cream rounded-xl p-3">
              <p className="text-xs text-slate uppercase tracking-wide">Interest</p>
              <p className="text-base font-serif text-charcoal">
                {formatCurrencyPrecise(firstMonthBreakdown.interest)}
              </p>
              <p className="text-xs text-slate">{firstMonthBreakdown.interestPercent.toFixed(0)}%</p>
            </div>
          </div>
        )}

        {/* Balloon/Bullet specific cards */}
        {isBalloon && (
          <div className="bg-cream rounded-xl p-4 mb-4">
            <p className="text-xs text-slate uppercase tracking-wide">Principal at Maturity</p>
            <p className="text-xl font-serif text-charcoal">{formatCurrency(balloonResults.balloonPayment)}</p>
          </div>
        )}

        {isBullet && (
          <div className="bg-cream rounded-xl p-4 mb-4">
            <p className="text-xs text-slate uppercase tracking-wide">Compounded Interest</p>
            <p className="text-xl font-serif text-charcoal">{formatCurrency(bulletResults.totalInterest)}</p>
          </div>
        )}

        {/* Grace Period Info */}
        {hasGracePeriod && inputs.gracePeriodType === "interest_only" && (
          <div className="bg-cream rounded-xl p-4 mb-4">
            <p className="text-xs text-slate uppercase tracking-wide">During Grace</p>
            <p className="text-xl font-serif text-charcoal">{formatCurrencyPrecise(standardResults.gracePayment)}/mo</p>
          </div>
        )}

        {hasGracePeriod && inputs.gracePeriodType === "no_payment" && (
          <div className="bg-cream rounded-xl p-4 mb-4">
            <p className="text-xs text-slate uppercase tracking-wide">Balance After Grace</p>
            <p className="text-xl font-serif text-charcoal">{formatCurrency(standardResults.principalAfterGrace)}</p>
            <p className="text-xs text-slate">+{formatCurrency(standardResults.graceInterest)} interest</p>
          </div>
        )}

        {/* Loan Summary */}
        <div className="bg-cream rounded-xl p-4">
          <h3 className="text-sm font-semibold text-charcoal mb-2">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate">Principal</span>
              <span className="text-charcoal">{formatCurrency(inputs.principal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Rate</span>
              <span className="text-charcoal">{inputs.rate}% APR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Term</span>
              <span className="text-charcoal">{inputs.years} yrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Total Interest</span>
              <span className="text-charcoal">{formatCurrency(results.totalInterest)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-sand">
              <span className="font-semibold text-charcoal">Total Paid</span>
              <span className="font-semibold text-charcoal">{formatCurrency(results.totalPayment)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Visualizations */}
      <div className="xl:border-l xl:border-sand xl:pl-6 lg:col-span-2 xl:col-span-1 lg:overflow-y-auto lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal mb-4">Visualizations</h2>

        {inputs.repaymentType === "standard" && amortizationSchedule.length > 0 ? (
          <div className="space-y-4">
            <PaymentBreakdownChart
              principal={inputs.principal}
              interest={results.totalInterest}
            />
            <BalanceChart schedule={amortizationSchedule} />
            <AmortizationTable schedule={amortizationSchedule} />
          </div>
        ) : (
          <div className="bg-cream rounded-xl p-6 text-center">
            <p className="text-slate text-sm">
              {isBalloon
                ? "Interest-only loans have no amortization schedule."
                : "Bullet loans have no payment schedule."}
            </p>
            <div className="mt-4">
              <PaymentBreakdownChart
                principal={inputs.principal}
                interest={results.totalInterest}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
