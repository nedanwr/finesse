import { useState, useEffect, useCallback } from "react";
import { ArrowRightLeft } from "lucide-react";

import { CurrencySelector } from "../currency-selector";
import { formatCurrencyPrecise } from "../../lib/format";
import { convertAmount, getExchangeRate } from "../../lib/currency";
import { InputField } from "../input-field";

interface ConversionResult {
  convertedAmount: number;
  rate: number;
  isLoading: boolean;
  error: string | null;
}

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState<ConversionResult>({
    convertedAmount: 0,
    rate: 1,
    isLoading: false,
    error: null,
  });

  const performConversion = useCallback(async () => {
    setResult((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = await convertAmount(amount, fromCurrency, toCurrency);

      setResult({
        convertedAmount,
        rate,
        isLoading: false,
        error: null,
      });
    } catch {
      setResult((prev) => ({
        ...prev,
        convertedAmount: 0,
        rate: 1,
        isLoading: false,
        error: "Failed to get exchange rate",
      }));
    }
  }, [amount, fromCurrency, toCurrency]);

  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performConversion();
    }, 100);
    return () => clearTimeout(timer);
  }, [performConversion]);

  const canSwap = fromCurrency !== toCurrency;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-serif text-charcoal">Currency Converter</h2>

      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase whitespace-nowrap">
            From
          </label>
          <CurrencySelector
            selectedCurrency={fromCurrency}
            onCurrencyChange={setFromCurrency}
            hideLabel
          />
          <InputField
            label="Amount"
            value={amount}
            onChange={setAmount}
            min={0}
            max={1000000000}
            decimals={2}
          />
        </div>

        {canSwap && (
          <button
            onClick={swapCurrencies}
            className="shrink-0 p-2 mt-8 rounded-lg bg-terracotta text-ivory hover:bg-charcoal transition-all"
            aria-label="Swap currencies"
          >
            <ArrowRightLeft size={16} />
          </button>
        )}

        <div className="flex-1 space-y-3">
          <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase whitespace-nowrap">
            To
          </label>
          <CurrencySelector
            selectedCurrency={toCurrency}
            onCurrencyChange={setToCurrency}
            hideLabel
          />
        </div>
      </div>

      {result.isLoading && (
        <div className="bg-cream rounded-xl p-6 text-center">
          <p className="text-slate">Converting...</p>
        </div>
      )}

      {result.error && (
        <div className="bg-terracotta/10 rounded-xl p-6 text-center border border-terracotta/30">
          <p className="text-terracotta">{result.error}</p>
        </div>
      )}

      {!result.isLoading && !result.error && (
        <div className="bg-terracotta rounded-2xl p-6">
          <p className="text-xs text-ivory/70 uppercase tracking-wide mb-2">Converted Amount</p>
          <p className="text-4xl font-serif text-ivory mb-2">
            {formatCurrencyPrecise(result.convertedAmount, toCurrency)}
          </p>
          <p className="text-sm text-ivory/80">
            1 {fromCurrency} = {formatCurrencyPrecise(result.rate, toCurrency)}
          </p>
        </div>
      )}

      <div className="bg-cream rounded-xl p-4">
        <h3 className="text-sm font-semibold text-charcoal mb-2">Exchange Rate Details</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate">Rate</span>
            <span className="text-charcoal">
              1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Inverse Rate</span>
            <span className="text-charcoal">
              1 {toCurrency} = {(1 / result.rate).toFixed(6)} {fromCurrency}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-sand">
            <span className="font-semibold text-charcoal">Original Amount</span>
            <span className="font-semibold text-charcoal">
              {formatCurrencyPrecise(amount, fromCurrency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-charcoal">Converted Amount</span>
            <span className="font-semibold text-charcoal">
              {formatCurrencyPrecise(result.convertedAmount, toCurrency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
