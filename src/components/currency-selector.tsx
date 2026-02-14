import { useState, useEffect, useMemo } from "react";
import { DollarSign, ChevronDown } from "lucide-react";

import { getAvailableCurrencies, type Currency } from "../lib/currency";

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"];

export function CurrencySelector({ selectedCurrency, onCurrencyChange, disabled = false, hideLabel = false }: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getAvailableCurrencies()
      .then(setCurrencies)
      .finally(() => setLoading(false));
  }, []);

  const sortedCurrencies = useMemo(() => [...currencies].sort((a, b) => {
    const aIsCommon = COMMON_CURRENCIES.includes(a.code);
    const bIsCommon = COMMON_CURRENCIES.includes(b.code);
    if (aIsCommon && !bIsCommon) return -1;
    if (!aIsCommon && bIsCommon) return 1;
    return a.code.localeCompare(b.code);
  }), [currencies]);

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency);

  return (
    <div className="relative">
      {!hideLabel && (
        <label htmlFor="currency-selector" className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase">
          Currency
        </label>
      )}
      <button
        id="currency-selector"
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          w-full min-w-72 bg-cream border-2 border-sand rounded-xl py-3 px-4
          flex items-center justify-between text-left text-base font-medium text-charcoal
          focus:border-terracotta focus:bg-ivory transition-all duration-200
          ${disabled || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className="flex items-center gap-2">
          <DollarSign size={18} aria-hidden="true" />
          {loading ? "Loading..." : selectedCurrencyData ? `${selectedCurrencyData.code} - ${selectedCurrencyData.name}` : selectedCurrency}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && !loading && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 w-full min-w-72 mt-1 bg-cream border-2 border-sand rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {sortedCurrencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => {
                  onCurrencyChange(currency.code);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 text-left text-sm transition-colors
                  ${currency.code === selectedCurrency
                    ? "bg-charcoal text-ivory"
                    : "text-charcoal hover:bg-sand"}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{currency.code}</span>
                  <span className="text-xs opacity-70">{currency.name}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
