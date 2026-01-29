import { useState, useEffect, useRef } from "react";
import { formatWithCommas, parseFormattedNumber } from "../lib/format";

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  decimals?: number;
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
}: InputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  const formatValue = (num: number): string => {
    if (num === 0) return "";
    const str = decimals > 0 ? num.toString() : Math.floor(num).toString();
    return formatWithCommas(str);
  };

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));

  useEffect(() => {
    const formatted = formatValue(value);
    if (parseFormattedNumber(displayValue) !== value) {
      setDisplayValue(formatted);
    }
  }, [value]);

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

    if (decimals === 0 && cleaned.includes(".")) {
      cleaned = cleaned.split(".")[0];
    } else if (decimals > 0 && cleaned.includes(".")) {
      const [intPart, decPart] = cleaned.split(".");
      cleaned = `${intPart}.${decPart.slice(0, decimals)}`;
    }

    const formatted = formatWithCommas(cleaned);

    const digitsBeforeCursor = rawValue
      .slice(0, cursorPos)
      .replace(/[^\d.]/g, "").length;

    let newCursor = 0;
    let digitCount = 0;
    for (
      let i = 0;
      i < formatted.length && digitCount < digitsBeforeCursor;
      i++
    ) {
      newCursor = i + 1;
      if (/[\d.]/.test(formatted[i])) {
        digitCount++;
      }
    }
    cursorRef.current = newCursor;

    setDisplayValue(formatted);

    const numericValue = parseFormattedNumber(formatted);
    let constrained = numericValue;
    if (max !== undefined && numericValue > max) constrained = max;
    onChange(constrained);
  };

  const handleBlur = () => {
    let finalValue = value;
    if (min !== undefined && value < min) finalValue = min;
    setDisplayValue(formatValue(finalValue));
    if (finalValue !== value) onChange(finalValue);
  };

  return (
    <div className="group">
      <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide uppercase">
        {label}
      </label>
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
