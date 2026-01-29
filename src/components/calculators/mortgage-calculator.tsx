import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { InputField } from "../input-field";
import { formatCurrency, formatCurrencyPrecise, formatWithCommas, parseFormattedNumber } from "../../lib/format";
import {
  calculateMortgage,
  calculateLoanPayment,
  calculateLoanWithExtraPayments,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtra,
  type ExtraPaymentType,
  type ExtraPaymentConfig,
} from "../../lib/calculations";
import { AmortizationTable } from "../amortization-table";
import { BalanceChart, MortgageCostChart } from "../charts";
import { ExportControls } from "../export-controls";
import { exportMortgageCSV, exportMortgageExcel } from "../../lib/export";
import { printMortgage } from "../../lib/print";

type InputMode = "dollar" | "percent";
type Frequency = "monthly" | "yearly";

interface CustomCost {
  id: string;
  name: string;
  value: number;
  mode: InputMode;
  frequency: Frequency;
}

interface MortgageInputs {
  homePrice: number;
  downPaymentValue: number;
  downPaymentMode: InputMode;
  rate: number;
  years: number;
  propertyTaxValue: number;
  propertyTaxMode: InputMode;
  insurance: number;
  hoa: number;
  customCosts: CustomCost[];
  extraPaymentType: ExtraPaymentType;
  extraMonthly: number;
  extraYearlyAmount: number;
  extraYearlyMonth: number;
}


interface ToggleInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  decimals?: number;
}

function ToggleInput({
  label,
  value,
  onChange,
  mode,
  onModeChange,
  decimals = 0,
}: ToggleInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  const formatValue = (num: number): string => {
    if (num === 0) return "";
    const effectiveDecimals = mode === "percent" ? 2 : decimals;
    const str = effectiveDecimals > 0 ? num.toString() : Math.floor(num).toString();
    return formatWithCommas(str);
  };

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));

  // Sync when value or mode changes externally
  useEffect(() => {
    const formatted = formatValue(value);
    if (parseFormattedNumber(displayValue) !== value) {
      setDisplayValue(formatted);
    }
  }, [value, mode]);

  // Restore cursor position after render
  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart || 0;

    let cleaned = rawValue.replace(/[^\d.]/g, "");

    const decimalIndex = cleaned.indexOf(".");
    if (decimalIndex !== -1) {
      cleaned =
        cleaned.slice(0, decimalIndex + 1) +
        cleaned.slice(decimalIndex + 1).replace(/\./g, "");
    }

    const effectiveDecimals = mode === "percent" ? 2 : decimals;
    if (effectiveDecimals === 0 && cleaned.includes(".")) {
      cleaned = cleaned.split(".")[0];
    } else if (effectiveDecimals > 0 && cleaned.includes(".")) {
      const [intPart, decPart] = cleaned.split(".");
      cleaned = `${intPart}.${decPart.slice(0, effectiveDecimals)}`;
    }

    const formatted = formatWithCommas(cleaned);

    const digitsBeforeCursor = rawValue
      .slice(0, cursorPos)
      .replace(/[^\d.]/g, "").length;

    let newCursor = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      newCursor = i + 1;
      if (/[\d.]/.test(formatted[i])) {
        digitCount++;
      }
    }
    cursorRef.current = newCursor;

    setDisplayValue(formatted);
    onChange(parseFormattedNumber(formatted));
  };

  const handleBlur = () => {
    setDisplayValue(formatValue(value));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-slate tracking-wide uppercase">
          {label}
        </label>
        <div className="flex bg-sand rounded-lg p-0.5">
          <button
            onClick={() => onModeChange("dollar")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              mode === "dollar"
                ? "bg-charcoal text-ivory"
                : "text-slate hover:text-charcoal"
            }`}
          >
            $
          </button>
          <button
            onClick={() => onModeChange("percent")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              mode === "percent"
                ? "bg-charcoal text-ivory"
                : "text-slate hover:text-charcoal"
            }`}
          >
            %
          </button>
        </div>
      </div>
      <div className="relative">
        {mode === "dollar" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate">$</span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            w-full bg-cream border-2 border-sand rounded-xl py-3 text-base font-medium
            text-charcoal placeholder:text-stone
            focus:border-terracotta focus:bg-ivory
            transition-all duration-200
            ${mode === "dollar" ? "pl-8 pr-3" : "pl-3 pr-8"}
          `}
        />
        {mode === "percent" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate text-sm">%</span>
        )}
      </div>
    </div>
  );
}

interface CustomCostInputProps {
  cost: CustomCost;
  homePrice: number;
  onChange: (cost: CustomCost) => void;
  onRemove: () => void;
}

function CustomCostInput({ cost, homePrice, onChange, onRemove }: CustomCostInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  const formatValue = (num: number): string => {
    if (num === 0) return "";
    const effectiveDecimals = cost.mode === "percent" ? 2 : 0;
    const str = effectiveDecimals > 0 ? num.toString() : Math.floor(num).toString();
    return formatWithCommas(str);
  };

  const [displayValue, setDisplayValue] = useState(() => formatValue(cost.value));

  useEffect(() => {
    const formatted = formatValue(cost.value);
    if (parseFormattedNumber(displayValue) !== cost.value) {
      setDisplayValue(formatted);
    }
  }, [cost.value, cost.mode]);

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
  }, [displayValue]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart || 0;

    let cleaned = rawValue.replace(/[^\d.]/g, "");
    const decimalIndex = cleaned.indexOf(".");
    if (decimalIndex !== -1) {
      cleaned = cleaned.slice(0, decimalIndex + 1) + cleaned.slice(decimalIndex + 1).replace(/\./g, "");
    }

    const effectiveDecimals = cost.mode === "percent" ? 2 : 0;
    if (effectiveDecimals === 0 && cleaned.includes(".")) {
      cleaned = cleaned.split(".")[0];
    } else if (effectiveDecimals > 0 && cleaned.includes(".")) {
      const [intPart, decPart] = cleaned.split(".");
      cleaned = `${intPart}.${decPart.slice(0, effectiveDecimals)}`;
    }

    const formatted = formatWithCommas(cleaned);
    const digitsBeforeCursor = rawValue.slice(0, cursorPos).replace(/[^\d.]/g, "").length;

    let newCursor = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      newCursor = i + 1;
      if (/[\d.]/.test(formatted[i])) digitCount++;
    }
    cursorRef.current = newCursor;

    setDisplayValue(formatted);
    onChange({ ...cost, value: parseFormattedNumber(formatted) });
  };

  const handleModeChange = (mode: InputMode) => {
    let newValue = cost.value;
    if (mode === "percent" && cost.mode === "dollar") {
      newValue = homePrice > 0 ? (cost.value / homePrice) * 100 : 0;
    } else if (mode === "dollar" && cost.mode === "percent") {
      newValue = (cost.value / 100) * homePrice;
    }
    onChange({ ...cost, mode, value: Math.round(newValue * 100) / 100 });
  };

  return (
    <div className="bg-cream rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={cost.name}
          onChange={(e) => onChange({ ...cost, name: e.target.value })}
          placeholder="Cost name..."
          className="flex-1 bg-transparent border-b border-sand text-sm text-charcoal placeholder:text-stone focus:border-terracotta focus:outline-none py-1"
        />
        <button
          onClick={onRemove}
          className="p-1 text-slate hover:text-terracotta transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {cost.mode === "dollar" && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate text-sm">$</span>
          )}
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleValueChange}
            onBlur={() => setDisplayValue(formatValue(cost.value))}
            placeholder="0"
            className={`
              w-full bg-ivory border border-sand rounded-lg py-2 text-sm font-medium
              text-charcoal placeholder:text-stone
              focus:border-terracotta focus:outline-none
              ${cost.mode === "dollar" ? "pl-6 pr-2" : "pl-2 pr-6"}
            `}
          />
          {cost.mode === "percent" && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate text-sm">%</span>
          )}
        </div>
        <div className="flex bg-sand rounded-md p-0.5">
          <button
            onClick={() => handleModeChange("dollar")}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              cost.mode === "dollar" ? "bg-charcoal text-ivory" : "text-slate hover:text-charcoal"
            }`}
          >
            $
          </button>
          <button
            onClick={() => handleModeChange("percent")}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              cost.mode === "percent" ? "bg-charcoal text-ivory" : "text-slate hover:text-charcoal"
            }`}
          >
            %
          </button>
        </div>
        <div className="flex bg-sand rounded-md p-0.5">
          <button
            onClick={() => onChange({ ...cost, frequency: "monthly" })}
            className={`px-1.5 py-1 text-xs font-medium rounded transition-all ${
              cost.frequency === "monthly" ? "bg-charcoal text-ivory" : "text-slate hover:text-charcoal"
            }`}
          >
            /mo
          </button>
          <button
            onClick={() => onChange({ ...cost, frequency: "yearly" })}
            className={`px-1.5 py-1 text-xs font-medium rounded transition-all ${
              cost.frequency === "yearly" ? "bg-charcoal text-ivory" : "text-slate hover:text-charcoal"
            }`}
          >
            /yr
          </button>
        </div>
      </div>
    </div>
  );
}

export function MortgageCalculator() {
  const [inputs, setInputs] = useState<MortgageInputs>({
    homePrice: 450000,
    downPaymentValue: 20,
    downPaymentMode: "percent",
    rate: 6.5,
    years: 30,
    propertyTaxValue: 1.2,
    propertyTaxMode: "percent",
    insurance: 1800,
    hoa: 0,
    customCosts: [],
    extraPaymentType: "none",
    extraMonthly: 200,
    extraYearlyAmount: 2000,
    extraYearlyMonth: 1,
  });

  // Calculate actual dollar values based on mode
  const downPaymentDollars = useMemo(() => {
    if (inputs.downPaymentMode === "percent") {
      return (inputs.downPaymentValue / 100) * inputs.homePrice;
    }
    return inputs.downPaymentValue;
  }, [inputs.downPaymentValue, inputs.downPaymentMode, inputs.homePrice]);

  const downPaymentPercent = useMemo(() => {
    if (inputs.downPaymentMode === "dollar") {
      return inputs.homePrice > 0 ? (inputs.downPaymentValue / inputs.homePrice) * 100 : 0;
    }
    return inputs.downPaymentValue;
  }, [inputs.downPaymentValue, inputs.downPaymentMode, inputs.homePrice]);

  const annualPropertyTax = useMemo(() => {
    if (inputs.propertyTaxMode === "percent") {
      return (inputs.propertyTaxValue / 100) * inputs.homePrice;
    }
    return inputs.propertyTaxValue;
  }, [inputs.propertyTaxValue, inputs.propertyTaxMode, inputs.homePrice]);

  const results = useMemo(
    () =>
      calculateMortgage(
        inputs.homePrice,
        downPaymentDollars,
        inputs.rate,
        inputs.years,
        annualPropertyTax,
        inputs.insurance,
        inputs.hoa
      ),
    [inputs.homePrice, downPaymentDollars, inputs.rate, inputs.years, annualPropertyTax, inputs.insurance, inputs.hoa]
  );

  const loanDetails = useMemo(
    () => calculateLoanPayment(results.loanAmount, inputs.rate, inputs.years),
    [results.loanAmount, inputs.rate, inputs.years]
  );

  // Extra payment configuration
  const extraPaymentConfig: ExtraPaymentConfig = useMemo(() => ({
    type: inputs.extraPaymentType,
    extraMonthly: inputs.extraMonthly,
    extraYearlyAmount: inputs.extraYearlyAmount,
    extraYearlyMonth: inputs.extraYearlyMonth,
  }), [inputs.extraPaymentType, inputs.extraMonthly, inputs.extraYearlyAmount, inputs.extraYearlyMonth]);

  // Calculate mortgage with extra payments
  const extraPaymentResults = useMemo(() => {
    if (inputs.extraPaymentType === "none") return null;
    return calculateLoanWithExtraPayments(
      results.loanAmount,
      inputs.rate,
      inputs.years,
      extraPaymentConfig
    );
  }, [results.loanAmount, inputs.rate, inputs.years, inputs.extraPaymentType, extraPaymentConfig]);

  const hasExtraPayments = extraPaymentResults !== null && inputs.extraPaymentType !== "none";

  // Calculate first month's principal vs interest split
  const firstMonthBreakdown = useMemo(() => {
    const monthlyRate = inputs.rate / 100 / 12;
    const firstMonthInterest = results.loanAmount * monthlyRate;
    const firstMonthPrincipal = results.monthlyPrincipalInterest - firstMonthInterest;

    return {
      interest: firstMonthInterest,
      principal: firstMonthPrincipal,
      interestPercent: results.monthlyPrincipalInterest > 0
        ? (firstMonthInterest / results.monthlyPrincipalInterest) * 100
        : 0,
      principalPercent: results.monthlyPrincipalInterest > 0
        ? (firstMonthPrincipal / results.monthlyPrincipalInterest) * 100
        : 0,
    };
  }, [results.loanAmount, inputs.rate, results.monthlyPrincipalInterest]);

  // Generate amortization schedule
  const amortizationSchedule = useMemo(() => {
    if (inputs.extraPaymentType !== "none") {
      return generateAmortizationScheduleWithExtra(results.loanAmount, inputs.rate, inputs.years, extraPaymentConfig);
    }
    return generateAmortizationSchedule(results.loanAmount, inputs.rate, inputs.years);
  }, [results.loanAmount, inputs.rate, inputs.years, inputs.extraPaymentType, extraPaymentConfig]);

  // Calculate actual term in years for total cost calculations
  const actualTermYears = hasExtraPayments && extraPaymentResults
    ? extraPaymentResults.actualMonths / 12
    : inputs.years;

  const totalPropertyTax = annualPropertyTax * actualTermYears;
  const totalInsurance = inputs.insurance * actualTermYears;
  const totalHoa = inputs.hoa * 12 * actualTermYears;

  // Calculate custom costs (convert % to $ based on home price)
  const customCostsMonthly = useMemo(() => {
    return inputs.customCosts.map((cost) => {
      let monthlyDollars: number;
      if (cost.mode === "percent") {
        // Percent of home price, always interpreted as annual
        monthlyDollars = (cost.value / 100) * inputs.homePrice / 12;
      } else {
        // Dollar amount - convert yearly to monthly if needed
        monthlyDollars = cost.frequency === "yearly" ? cost.value / 12 : cost.value;
      }
      return { ...cost, monthlyDollars };
    });
  }, [inputs.customCosts, inputs.homePrice]);

  const totalCustomCostsMonthly = customCostsMonthly.reduce((sum, c) => sum + c.monthlyDollars, 0);
  const totalCustomCosts = totalCustomCostsMonthly * 12 * actualTermYears;

  // Prepare custom costs for chart (total values over term)
  const customCostsForChart = customCostsMonthly.map(c => ({
    name: c.name || "Other",
    value: c.monthlyDollars * 12 * actualTermYears,
  }));

  // Prepare custom costs for export/print (monthly values)
  const customCostsForExport = customCostsMonthly.map(c => ({
    name: c.name || "Other",
    monthlyAmount: c.monthlyDollars,
  }));
  const totalMonthlyWithExtras = results.totalMonthly + totalCustomCostsMonthly;
  const loanTotalPayment = hasExtraPayments && extraPaymentResults
    ? extraPaymentResults.actualTotalPayment
    : loanDetails.totalPayment;
  const totalCostOfOwnership =
    loanTotalPayment + totalPropertyTax + totalInsurance + totalHoa + totalCustomCosts + downPaymentDollars;

  const hasHoa = inputs.hoa > 0;
  const hasCustomCosts = inputs.customCosts.length > 0;

  const addCustomCost = () => {
    const newCost: CustomCost = {
      id: Date.now().toString(),
      name: "",
      value: 0,
      mode: "dollar",
      frequency: "monthly",
    };
    setInputs((prev) => ({ ...prev, customCosts: [...prev.customCosts, newCost] }));
  };

  const updateCustomCost = (updatedCost: CustomCost) => {
    setInputs((prev) => ({
      ...prev,
      customCosts: prev.customCosts.map((c) => (c.id === updatedCost.id ? updatedCost : c)),
    }));
  };

  const removeCustomCost = (id: string) => {
    setInputs((prev) => ({
      ...prev,
      customCosts: prev.customCosts.filter((c) => c.id !== id),
    }));
  };

  const handleExportCSV = useCallback(() => {
    exportMortgageCSV({
      homePrice: inputs.homePrice,
      downPayment: downPaymentDollars,
      loanAmount: results.loanAmount,
      rate: inputs.rate,
      years: inputs.years,
      monthlyPI: results.monthlyPrincipalInterest,
      monthlyTax: results.monthlyPropertyTax,
      monthlyInsurance: results.monthlyInsurance,
      monthlyHOA: results.monthlyHoa,
      customCosts: customCostsForExport,
      totalMonthly: totalMonthlyWithExtras,
      totalCost: totalCostOfOwnership,
      totalInterest: loanDetails.totalInterest,
      schedule: amortizationSchedule,
    });
  }, [inputs, results, downPaymentDollars, customCostsForExport, totalMonthlyWithExtras, totalCostOfOwnership, loanDetails.totalInterest, amortizationSchedule]);

  const handleExportExcel = useCallback(() => {
    exportMortgageExcel({
      homePrice: inputs.homePrice,
      downPayment: downPaymentDollars,
      loanAmount: results.loanAmount,
      rate: inputs.rate,
      years: inputs.years,
      monthlyPI: results.monthlyPrincipalInterest,
      monthlyTax: results.monthlyPropertyTax,
      monthlyInsurance: results.monthlyInsurance,
      monthlyHOA: results.monthlyHoa,
      customCosts: customCostsForExport,
      totalMonthly: totalMonthlyWithExtras,
      totalCost: totalCostOfOwnership,
      totalInterest: loanDetails.totalInterest,
      schedule: amortizationSchedule,
    });
  }, [inputs, results, downPaymentDollars, customCostsForExport, totalMonthlyWithExtras, totalCostOfOwnership, loanDetails.totalInterest, amortizationSchedule]);

  const handlePrint = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    printMortgage({
      homePrice: inputs.homePrice,
      downPayment: downPaymentDollars,
      loanAmount: results.loanAmount,
      rate: inputs.rate,
      years: inputs.years,
      monthlyPI: results.monthlyPrincipalInterest,
      monthlyTax: results.monthlyPropertyTax,
      monthlyInsurance: results.monthlyInsurance,
      monthlyHOA: results.monthlyHoa,
      customCosts: customCostsForExport,
      totalMonthly: totalMonthlyWithExtras,
      totalCost: totalCostOfOwnership,
      totalInterest: loanDetails.totalInterest,
      schedule: amortizationSchedule,
    }, isDark);
  }, [inputs, results, downPaymentDollars, customCostsForExport, totalMonthlyWithExtras, totalCostOfOwnership, loanDetails.totalInterest, amortizationSchedule]);

  return (
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8 h-full">
      {/* Column 1: Inputs */}
      <div className="space-y-4 lg:overflow-y-auto lg:pr-6 lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal">Property & Loan</h2>
        <div className="space-y-3">
          <InputField
            label="Home Price"
            value={inputs.homePrice}
            onChange={(homePrice) => setInputs((prev) => ({ ...prev, homePrice }))}
            prefix="$"
          />
          <ToggleInput
            label="Down Payment"
            value={inputs.downPaymentValue}
            onChange={(downPaymentValue) =>
              setInputs((prev) => ({ ...prev, downPaymentValue }))
            }
            mode={inputs.downPaymentMode}
            onModeChange={(downPaymentMode) =>
              setInputs((prev) => {
                let newValue = prev.downPaymentValue;
                if (downPaymentMode === "percent" && prev.downPaymentMode === "dollar") {
                  newValue = prev.homePrice > 0 ? (prev.downPaymentValue / prev.homePrice) * 100 : 0;
                } else if (downPaymentMode === "dollar" && prev.downPaymentMode === "percent") {
                  newValue = (prev.downPaymentValue / 100) * prev.homePrice;
                }
                return { ...prev, downPaymentMode, downPaymentValue: Math.round(newValue * 100) / 100 };
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Interest Rate"
              value={inputs.rate}
              onChange={(rate) => setInputs((prev) => ({ ...prev, rate }))}
              suffix="%"
              decimals={3}
              max={15}
            />
            <InputField
              label="Loan Term"
              value={inputs.years}
              onChange={(years) => setInputs((prev) => ({ ...prev, years }))}
              suffix="yrs"
              min={10}
              max={30}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-sand">
          <h2 className="text-base font-semibold text-charcoal mb-3">Additional Costs</h2>
          <div className="space-y-3">
            <ToggleInput
              label="Property Tax / Year"
              value={inputs.propertyTaxValue}
              onChange={(propertyTaxValue) =>
                setInputs((prev) => ({ ...prev, propertyTaxValue }))
              }
              mode={inputs.propertyTaxMode}
              onModeChange={(propertyTaxMode) =>
                setInputs((prev) => {
                  let newValue = prev.propertyTaxValue;
                  if (propertyTaxMode === "percent" && prev.propertyTaxMode === "dollar") {
                    newValue = prev.homePrice > 0 ? (prev.propertyTaxValue / prev.homePrice) * 100 : 0;
                  } else if (propertyTaxMode === "dollar" && prev.propertyTaxMode === "percent") {
                    newValue = (prev.propertyTaxValue / 100) * prev.homePrice;
                  }
                  return { ...prev, propertyTaxMode, propertyTaxValue: Math.round(newValue * 100) / 100 };
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <InputField
                label="Insurance / Yr"
                value={inputs.insurance}
                onChange={(insurance) => setInputs((prev) => ({ ...prev, insurance }))}
                prefix="$"
              />
              <InputField
                label="HOA / Mo"
                value={inputs.hoa}
                onChange={(hoa) => setInputs((prev) => ({ ...prev, hoa }))}
                prefix="$"
              />
            </div>

            {/* Custom Costs */}
            {inputs.customCosts.length > 0 && (
              <div className="space-y-2">
                {inputs.customCosts.map((cost) => (
                  <CustomCostInput
                    key={cost.id}
                    cost={cost}
                    homePrice={inputs.homePrice}
                    onChange={updateCustomCost}
                    onRemove={() => removeCustomCost(cost.id)}
                  />
                ))}
              </div>
            )}

            <button
              onClick={addCustomCost}
              className="flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta-dark font-medium transition-colors"
            >
              <Plus size={16} />
              Add other cost
            </button>
          </div>
        </div>

        {/* Extra Payments */}
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
                <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase">
                  Apply in Month
                </label>
                <select
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
      </div>

      {/* Column 2: Results */}
      <div className="lg:border-l lg:border-sand lg:pl-6 lg:overflow-y-auto lg:pb-4">
        <h2 className="text-base font-semibold text-charcoal mb-4">Results</h2>

        {/* Primary Result Card */}
        <div className="bg-terracotta rounded-2xl p-5 mb-4">
          <p className="text-xs text-ivory/70 uppercase tracking-wide mb-1">
            {hasCustomCosts ? "Total Monthly" : "Monthly Payment"}
          </p>
          <p className="text-3xl font-serif text-ivory">
            {formatCurrencyPrecise(hasCustomCosts ? totalMonthlyWithExtras : results.totalMonthly)}
          </p>
          <p className="text-xs text-ivory/60 mt-1">
            P&I: {formatCurrencyPrecise(results.monthlyPrincipalInterest)}
          </p>
        </div>

        {/* P&I Breakdown */}
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

        {/* Monthly Cost Breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-cream rounded-lg p-2.5">
            <p className="text-xs text-slate">Tax</p>
            <p className="text-sm font-medium text-charcoal">{formatCurrencyPrecise(results.monthlyPropertyTax)}</p>
          </div>
          <div className="bg-cream rounded-lg p-2.5">
            <p className="text-xs text-slate">Insurance</p>
            <p className="text-sm font-medium text-charcoal">{formatCurrencyPrecise(results.monthlyInsurance)}</p>
          </div>
          {hasHoa && (
            <div className="bg-cream rounded-lg p-2.5">
              <p className="text-xs text-slate">HOA</p>
              <p className="text-sm font-medium text-charcoal">{formatCurrencyPrecise(results.monthlyHoa)}</p>
            </div>
          )}
          {customCostsMonthly.map((cost) => (
            <div key={cost.id} className="bg-cream rounded-lg p-2.5">
              <p className="text-xs text-slate truncate">{cost.name || "Other"}</p>
              <p className="text-sm font-medium text-charcoal">{formatCurrencyPrecise(cost.monthlyDollars)}</p>
            </div>
          ))}
        </div>

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

        {/* Summary */}
        <div className="bg-cream rounded-xl p-4">
          <h3 className="text-sm font-semibold text-charcoal mb-2">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate">Loan Amount</span>
              <span className="text-charcoal">{formatCurrency(results.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Down Payment</span>
              <span className="text-charcoal">{formatCurrency(downPaymentDollars)} ({downPaymentPercent.toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Term</span>
              <span className="text-charcoal">
                {hasExtraPayments && extraPaymentResults ? (
                  <>
                    {Math.floor(extraPaymentResults.actualMonths / 12)} yr {extraPaymentResults.actualMonths % 12} mo
                  </>
                ) : (
                  <>{inputs.years} yrs</>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Total Interest</span>
              <span className="text-charcoal">
                {formatCurrency(hasExtraPayments && extraPaymentResults ? extraPaymentResults.actualTotalInterest : loanDetails.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-sand">
              <span className="font-semibold text-charcoal">Total Cost</span>
              <span className="font-semibold text-charcoal">{formatCurrency(totalCostOfOwnership)}</span>
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

        {amortizationSchedule.length > 0 && (
          <div className="space-y-4">
            <MortgageCostChart
              principal={results.loanAmount}
              interest={hasExtraPayments && extraPaymentResults ? extraPaymentResults.actualTotalInterest : loanDetails.totalInterest}
              tax={totalPropertyTax}
              insurance={totalInsurance}
              hoa={totalHoa}
              customCosts={customCostsForChart}
            />
            <BalanceChart
              schedule={amortizationSchedule}
              monthlyCosts={{
                tax: results.monthlyPropertyTax,
                insurance: results.monthlyInsurance,
                hoa: results.monthlyHoa,
                other: totalCustomCostsMonthly,
              }}
            />
            <AmortizationTable schedule={amortizationSchedule} />
          </div>
        )}
      </div>
    </div>
  );
}
