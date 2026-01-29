import { useState, useMemo, useCallback } from "react";
import { InputField } from "../input-field";
import { formatCurrency, formatCurrencyPrecise } from "../../lib/format";
import {
  calculateLoanWithGracePeriod,
  calculateBalloonLoan,
  calculateBulletLoan,
  calculateLoanWithExtraPayments,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtra,
  type GracePeriodType,
  type ExtraPaymentType,
  type ExtraPaymentConfig,
} from "../../lib/calculations";
import { AmortizationTable } from "../amortization-table";
import { BalanceChart, PaymentBreakdownChart } from "../charts";
import { ExportControls } from "../export-controls";
import { exportLoanCSV, exportLoanExcel } from "../../lib/export";
import { printLoan } from "../../lib/print";

type RepaymentType = "standard" | "balloon" | "bullet";

interface LoanInputs {
  principal: number;
  rate: number;
  years: number;
  repaymentType: RepaymentType;
  gracePeriodMonths: number;
  gracePeriodType: GracePeriodType;
  extraPaymentType: ExtraPaymentType;
  extraMonthly: number;
  extraYearlyAmount: number;
  extraYearlyMonth: number;
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
    extraPaymentType: "none",
    extraMonthly: 100,
    extraYearlyAmount: 1000,
    extraYearlyMonth: 1,
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

  // Extra payment configuration
  const extraPaymentConfig: ExtraPaymentConfig = useMemo(() => ({
    type: inputs.extraPaymentType,
    extraMonthly: inputs.extraMonthly,
    extraYearlyAmount: inputs.extraYearlyAmount,
    extraYearlyMonth: inputs.extraYearlyMonth,
  }), [inputs.extraPaymentType, inputs.extraMonthly, inputs.extraYearlyAmount, inputs.extraYearlyMonth]);

  // Calculate loan with extra payments (for standard amortized loans only)
  const extraPaymentResults = useMemo(() => {
    if (inputs.repaymentType !== "standard" || inputs.gracePeriodType !== "none") {
      return null;
    }
    return calculateLoanWithExtraPayments(
      inputs.principal,
      inputs.rate,
      inputs.years,
      extraPaymentConfig
    );
  }, [inputs.principal, inputs.rate, inputs.years, inputs.repaymentType, inputs.gracePeriodType, extraPaymentConfig]);

  const hasExtraPayments = extraPaymentResults !== null && inputs.extraPaymentType !== "none";

  // Generate amortization schedule for standard loans
  const amortizationSchedule = useMemo(() => {
    if (inputs.repaymentType !== "standard") return [];
    const effectivePrincipal = hasGracePeriod ? standardResults.principalAfterGrace : inputs.principal;

    // Use extra payment schedule if applicable
    if (!hasGracePeriod && inputs.extraPaymentType !== "none") {
      return generateAmortizationScheduleWithExtra(effectivePrincipal, inputs.rate, inputs.years, extraPaymentConfig);
    }

    return generateAmortizationSchedule(effectivePrincipal, inputs.rate, inputs.years);
  }, [inputs.principal, inputs.rate, inputs.years, inputs.repaymentType, inputs.extraPaymentType, standardResults.principalAfterGrace, hasGracePeriod, extraPaymentConfig]);

  // Calculate first month's principal vs interest split (for amortized loans)
  const firstMonthBreakdown = useMemo(() => {
    if (inputs.repaymentType !== "standard") return null;

    const effectivePrincipal = hasGracePeriod ? standardResults.principalAfterGrace : inputs.principal;
    const monthlyRate = inputs.rate / 100 / 12;
    const monthlyPayment = standardResults.monthlyPayment;
    const rawFirstMonthInterest = effectivePrincipal * monthlyRate;

    // Cap interest at payment amount and principal at zero to handle edge cases
    const firstMonthInterest = Math.min(rawFirstMonthInterest, monthlyPayment);
    const firstMonthPrincipal = Math.max(monthlyPayment - firstMonthInterest, 0);

    // Guard against division by zero when monthlyPayment is <= 0
    const interestPercent = monthlyPayment > 0 ? (firstMonthInterest / monthlyPayment) * 100 : 0;
    const principalPercent = monthlyPayment > 0 ? (firstMonthPrincipal / monthlyPayment) * 100 : 0;

    return {
      interest: firstMonthInterest,
      principal: firstMonthPrincipal,
      interestPercent,
      principalPercent,
    };
  }, [inputs.principal, inputs.rate, inputs.repaymentType, standardResults, hasGracePeriod]);

  const handleExportCSV = useCallback(() => {
    const repaymentLabels = { standard: "Amortized", balloon: "Interest Only", bullet: "Bullet" };
    exportLoanCSV({
      principal: inputs.principal,
      rate: inputs.rate,
      years: inputs.years,
      repaymentType: repaymentLabels[inputs.repaymentType],
      monthlyPayment: results.monthlyPayment,
      totalPayment: results.totalPayment,
      totalInterest: results.totalInterest,
      schedule: amortizationSchedule,
    });
  }, [inputs, results, amortizationSchedule]);

  const handleExportExcel = useCallback(() => {
    const repaymentLabels = { standard: "Amortized", balloon: "Interest Only", bullet: "Bullet" };
    exportLoanExcel({
      principal: inputs.principal,
      rate: inputs.rate,
      years: inputs.years,
      repaymentType: repaymentLabels[inputs.repaymentType],
      monthlyPayment: results.monthlyPayment,
      totalPayment: results.totalPayment,
      totalInterest: results.totalInterest,
      schedule: amortizationSchedule,
    });
  }, [inputs, results, amortizationSchedule]);

  const handlePrint = useCallback(() => {
    const repaymentLabels = { standard: "Amortized", balloon: "Interest Only", bullet: "Bullet" };
    const graceLabels: Record<GracePeriodType, string> = {
      none: "None",
      interest_only: "Interest Only",
      no_payment: "Full Deferral",
    };
    const isDark = document.documentElement.classList.contains("dark");
    printLoan({
      principal: inputs.principal,
      rate: inputs.rate,
      years: inputs.years,
      repaymentType: repaymentLabels[inputs.repaymentType],
      gracePeriod: inputs.gracePeriodType !== "none" ? {
        type: graceLabels[inputs.gracePeriodType],
        months: inputs.gracePeriodMonths,
      } : undefined,
      monthlyPayment: results.monthlyPayment,
      totalPayment: results.totalPayment,
      totalInterest: results.totalInterest,
      schedule: amortizationSchedule,
    }, isDark);
  }, [inputs, results, amortizationSchedule]);

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

        {/* Extra Payments - only for standard loans without grace period */}
        {inputs.repaymentType === "standard" && inputs.gracePeriodType === "none" && (
          <div className="pt-3 border-t border-sand">
            <label className="block text-xs font-medium text-slate mb-2 tracking-wide uppercase">
              Extra Payments
            </label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                { id: "none" as ExtraPaymentType, label: "None" },
                { id: "extra_monthly" as ExtraPaymentType, label: "Monthly" },
                { id: "extra_yearly" as ExtraPaymentType, label: "Yearly" },
                { id: "biweekly" as ExtraPaymentType, label: "Biweekly" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    setInputs((prev) => ({ ...prev, extraPaymentType: option.id }))
                  }
                  className={`
                    py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${
                      inputs.extraPaymentType === option.id
                        ? "bg-charcoal text-ivory"
                        : "bg-cream text-slate hover:text-charcoal border border-sand"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {inputs.extraPaymentType === "extra_monthly" && (
              <div className="animate-fade-in">
                <InputField
                  label="Extra per Month"
                  value={inputs.extraMonthly}
                  onChange={(extraMonthly) =>
                    setInputs((prev) => ({ ...prev, extraMonthly }))
                  }
                  prefix="$"
                />
              </div>
            )}

            {inputs.extraPaymentType === "extra_yearly" && (
              <div className="animate-fade-in space-y-2">
                <InputField
                  label="Extra per Year"
                  value={inputs.extraYearlyAmount}
                  onChange={(extraYearlyAmount) =>
                    setInputs((prev) => ({ ...prev, extraYearlyAmount }))
                  }
                  prefix="$"
                />
                <div>
                  <label htmlFor="loan-extra-yearly-month" className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase">
                    Apply in Month
                  </label>
                  <select
                    id="loan-extra-yearly-month"
                    value={inputs.extraYearlyMonth}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, extraYearlyMonth: parseInt(e.target.value) }))
                    }
                    className="w-full bg-cream border-2 border-sand rounded-xl py-3 px-3 text-base font-medium text-charcoal focus:border-terracotta focus:bg-ivory transition-all duration-200"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, idx) => (
                      <option key={month} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {inputs.extraPaymentType === "biweekly" && (
              <p className="text-xs text-slate mt-1">
                26 biweekly payments = 13 monthly payments/year
              </p>
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

        {/* Extra Payment Savings */}
        {hasExtraPayments && extraPaymentResults && extraPaymentResults.monthsSaved > 0 && (
          <div className="bg-sage/20 rounded-xl p-4 mb-4 border border-sage/30">
            <h3 className="text-sm font-semibold text-charcoal mb-2">Early Payoff Savings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate uppercase tracking-wide">Time Saved</p>
                <p className="text-base font-serif text-charcoal">
                  {Math.floor(extraPaymentResults.monthsSaved / 12) > 0 && (
                    <>{Math.floor(extraPaymentResults.monthsSaved / 12)} yr{Math.floor(extraPaymentResults.monthsSaved / 12) !== 1 ? "s" : ""} </>
                  )}
                  {extraPaymentResults.monthsSaved % 12} mo
                </p>
              </div>
              <div>
                <p className="text-xs text-slate uppercase tracking-wide">Interest Saved</p>
                <p className="text-base font-serif text-charcoal">{formatCurrency(extraPaymentResults.interestSaved)}</p>
              </div>
            </div>
            <p className="text-xs text-slate mt-2">
              Payoff: {Math.floor(extraPaymentResults.actualMonths / 12)} yr {extraPaymentResults.actualMonths % 12} mo (vs {inputs.years} yr)
            </p>
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
              <span className="text-charcoal">
                {hasExtraPayments && extraPaymentResults ? (
                  <>
                    {Math.floor(extraPaymentResults.actualMonths / 12)} yr {extraPaymentResults.actualMonths % 12} mo
                    <span className="text-slate ml-1">(vs {inputs.years} yr)</span>
                  </>
                ) : (
                  <>{inputs.years} yrs</>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Total Interest</span>
              <span className="text-charcoal">
                {formatCurrency(hasExtraPayments && extraPaymentResults ? extraPaymentResults.actualTotalInterest : results.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-sand">
              <span className="font-semibold text-charcoal">Total Paid</span>
              <span className="font-semibold text-charcoal">
                {formatCurrency(hasExtraPayments && extraPaymentResults ? extraPaymentResults.actualTotalPayment : results.totalPayment)}
              </span>
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
