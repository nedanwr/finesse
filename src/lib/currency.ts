export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CacheEntry extends ExchangeRate {
  fetchedAt: number;
}

let currenciesCache: Currency[] | null = null;
const exchangeRatesCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 1000 * 60 * 60;

export async function getAvailableCurrencies(): Promise<Currency[]> {
  if (currenciesCache) {
    return currenciesCache;
  }

  try {
    const response = await fetch("https://api.frankfurter.dev/v1/currencies");
    if (!response.ok) {
      throw new Error("Failed to fetch currencies");
    }
    const data = await response.json();
    currenciesCache = Object.entries(data).map(([code, name]) => ({
      code,
      name: name as string,
    }));
    return currenciesCache;
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [{ code: "USD", name: "United States Dollar" }];
  }
}

export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from === to) {
    return 1;
  }

  const cacheKey = `${from}-${to}`;
  const cached = exchangeRatesCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
    return cached.rates[to];
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?amount=1&from=${from}&to=${to}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }
    const data: ExchangeRate = await response.json();
    exchangeRatesCache.set(cacheKey, { ...data, fetchedAt: Date.now() });
    return data.rates[to];
  } catch (error) {
    throw new Error(`Failed to get exchange rate from ${from} to ${to}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) {
    return amount;
  }

  const rate = await getExchangeRate(from, to);
  return amount * rate;
}

export async function convertCurrencyAmounts<T extends Record<string, number>>(
  amounts: T,
  from: string,
  to: string
): Promise<T> {
  if (from === to) {
    return amounts;
  }

  const rate = await getExchangeRate(from, to);
  const result: Record<string, number> = {};

  for (const [key, value] of Object.entries(amounts)) {
    result[key] = value * rate;
  }

  return result as T;
}
