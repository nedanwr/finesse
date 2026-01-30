import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { formatWithCommas, parseFormattedNumber } from "../lib/format";

/**
 * Hook for formatted numeric input with cursor tracking.
 * Handles comma formatting, decimal precision, and cursor position restoration.
 */
export function useFormattedInput(
  value: number,
  onChange: (value: number) => void,
  decimals: number
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);

  const formatValue = useCallback((num: number): string => {
    if (num === 0) return "";
    const str = decimals > 0 ? num.toString() : Math.floor(num).toString();
    return formatWithCommas(str);
  }, [decimals]);

  const [displayValue, setDisplayValue] = useState(() => formatValue(value));
  const [prevValue, setPrevValue] = useState(value);
  const [prevDecimals, setPrevDecimals] = useState(decimals);

  // Sync display value when value or decimals change externally
  if (value !== prevValue || decimals !== prevDecimals) {
    setPrevValue(value);
    setPrevDecimals(decimals);
    if (parseFormattedNumber(displayValue) !== value) {
      setDisplayValue(formatValue(value));
    }
  }

  // Restore cursor position after render
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
  }, [displayValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      newCursor = i + 1;
      if (/[\d.]/.test(formatted[i])) {
        digitCount++;
      }
    }
    cursorRef.current = newCursor;

    setDisplayValue(formatted);
    onChange(parseFormattedNumber(formatted));
  }, [decimals, onChange]);

  const handleBlur = useCallback(() => {
    setDisplayValue(formatValue(value));
  }, [formatValue, value]);

  return { inputRef, displayValue, handleChange, handleBlur };
}
