export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const integerFormatter = new Intl.NumberFormat("en-US", {
  useGrouping: true,
  maximumFractionDigits: 0,
});

export function formatWithCommas(str: string): string {
  if (!str) return str;
  const parts = str.split(".");
  const intPart = parts[0].replace(/,/g, "");
  // Format integer part with Intl, preserve decimal part as-is for live input
  parts[0] = intPart ? integerFormatter.format(Number(intPart)) : "";
  return parts.join(".");
}

export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
