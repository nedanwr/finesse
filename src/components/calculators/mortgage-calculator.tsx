import { useState, useMemo } from "react";
import { InputField } from "../input-field";
import { ResultCard } from "../result-card";
import { formatCurrency, formatCurrencyPrecise } from "../../lib/format";
import { calculateMortgage } from "../../lib/calculations";

interface MortgageInputs {
  homePrice: number;
  downPayment: number;
  rate: number;
  years: number;
  propertyTax: number;
  insurance: number;
}

export function MortgageCalculator() {
  const [inputs, setInputs] = useState<MortgageInputs>({
    homePrice: 450000,
    downPayment: 90000,
    rate: 6.5,
    years: 30,
    propertyTax: 5400,
    insurance: 1800,
  });

  const results = useMemo(
    () =>
      calculateMortgage(
        inputs.homePrice,
        inputs.downPayment,
        inputs.rate,
        inputs.years,
        inputs.propertyTax,
        inputs.insurance
      ),
    [inputs]
  );

  const downPaymentPercent =
    inputs.homePrice > 0
      ? ((inputs.downPayment / inputs.homePrice) * 100).toFixed(0)
      : 0;

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 mb-10">
        <InputField
          label="Home Price"
          value={inputs.homePrice}
          onChange={(homePrice) => setInputs((prev) => ({ ...prev, homePrice }))}
          prefix="$"
        />
        <InputField
          label={`Down Payment (${downPaymentPercent}%)`}
          value={inputs.downPayment}
          onChange={(downPayment) => setInputs((prev) => ({ ...prev, downPayment }))}
          prefix="$"
        />
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Property Tax / Year"
            value={inputs.propertyTax}
            onChange={(propertyTax) => setInputs((prev) => ({ ...prev, propertyTax }))}
            prefix="$"
          />
          <InputField
            label="Insurance / Year"
            value={inputs.insurance}
            onChange={(insurance) => setInputs((prev) => ({ ...prev, insurance }))}
            prefix="$"
          />
        </div>
      </div>

      <div className="grid gap-4">
        <ResultCard
          label="Monthly Payment"
          value={formatCurrencyPrecise(results.totalMonthly)}
          highlight
          subtext={`Principal & Interest: ${formatCurrencyPrecise(results.monthlyPrincipalInterest)}`}
        />
        <div className="grid grid-cols-3 gap-4">
          <ResultCard
            label="Loan Amount"
            value={formatCurrency(results.loanAmount)}
          />
          <ResultCard
            label="Monthly Tax"
            value={formatCurrencyPrecise(results.monthlyPropertyTax)}
          />
          <ResultCard
            label="Monthly Insurance"
            value={formatCurrencyPrecise(results.monthlyInsurance)}
          />
        </div>
      </div>
    </div>
  );
}
