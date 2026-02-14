import { useState, useLayoutEffect, useRef, useId } from "react";
import { formatWithCommas, parseFormattedNumber } from "../lib/format";

export interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  decimals?: number;
  id?: string;
  "aria-labelledby"?: string;
  allowNegative?: boolean;
}

export function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  decimals = 0,
  id,
  "aria-labelledby": ariaLabelledBy,
  allowNegative = false,
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  const formatValue = (num: number): string => {
    if (num === 0) return "";
    const absValue = Math.abs(num);
    const str = decimals > 0 ? absValue.toString() : Math.floor(absValue).toString();
    const formatted = formatWithCommas(str);
    return num < 0 ? `-${formatted}` : formatted;
  };

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));
  const [prevValue, setPrevValue] = useState(value);

  // Sync display value when prop changes externally (React recommended pattern)
  // This runs during render, avoiding useEffect for derived state
  if (value !== prevValue) {
    setPrevValue(value);
    // Only update display if it doesn't already represent the new value
    if (parseFormattedNumber(displayValue) !== value) {
      setDisplayValue(formatValue(value));
    }
  }

  // Restore cursor position after display value changes
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart || 0;

    // Check for leading negative sign
    const isNegative = allowNegative && rawValue.startsWith("-");

    // Strip everything except digits and decimal
    let cleaned = rawValue.replace(/[^\d.]/g, "");

    const decimalIndex = cleaned.indexOf(".");
    if (decimalIndex !== -1) {
      cleaned =
        cleaned.slice(0, decimalIndex + 1) +
        cleaned.slice(decimalIndex + 1).replace(/\./g, "");
    }

    if (decimals === 0 && cleaned.includes(".")) {
      cleaned = cleaned.split(".")[0];
    } else if (decimals > 0 && cleaned.includes(".")) {
      const [intPart, decPart] = cleaned.split(".");
      cleaned = `${intPart}.${decPart.slice(0, decimals)}`;
    }

    const formatted = formatWithCommas(cleaned);
    // Preserve the minus sign even when no digits entered yet
    const displayFormatted = isNegative ? `-${formatted}` : formatted;

    // Count significant chars (digits and decimal) before cursor for positioning
    const charsToCount = allowNegative ? /[^\d.-]/g : /[^\d.]/g;
    const digitsBeforeCursor = rawValue
      .slice(0, cursorPos)
      .replace(charsToCount, "").length;

    let newCursor = 0;
    let digitCount = 0;
    for (
      let i = 0;
      i < displayFormatted.length && digitCount < digitsBeforeCursor;
      i++
    ) {
      newCursor = i + 1;
      if (/[\d.-]/.test(displayFormatted[i])) {
        digitCount++;
      }
    }
    cursorRef.current = newCursor;

    setDisplayValue(displayFormatted);

    const numericValue = parseFormattedNumber(displayFormatted);
    let constrained = numericValue;
    if (max !== undefined && numericValue > max) constrained = max;
    if (allowNegative && min !== undefined && numericValue < min) constrained = min;
    onChange(constrained);
  };

  const handleBlur = () => {
    let finalValue = value;
    // Only apply min constraint on blur if not allowing negative (default behavior)
    // or if allowNegative is true and a min is explicitly set
    if (min !== undefined && value < min && (!allowNegative || min !== 0)) {
      finalValue = min;
    }
    setDisplayValue(formatValue(finalValue));
    if (finalValue !== value) onChange(finalValue);
  };

  return (
    <div className="group">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          className={`
            w-full bg-cream border-2 border-sand rounded-xl py-3 text-base font-medium
            text-charcoal placeholder:text-stone
            focus:border-terracotta focus:bg-ivory
            transition-all duration-200
            ${prefix ? "pl-8" : "pl-3"}
            ${suffix ? "pr-12" : "pr-3"}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
