import { useState } from "react";
import { Percent, Home, TrendingUp, type LucideIcon } from "lucide-react";

import { ThemeSwitcher } from "./components/theme-switcher";
import { LoanCalculator } from "./components/calculators/loan-calculator";
import { MortgageCalculator } from "./components/calculators/mortgage-calculator";
import { InvestmentCalculator } from "./components/calculators/investment-calculator";

type CalculatorMode = "loan" | "mortgage" | "investment";

const modes: { id: CalculatorMode; label: string; icon: LucideIcon }[] = [
  { id: "loan", label: "Loan", icon: Percent },
  { id: "mortgage", label: "Mortgage", icon: Home },
  { id: "investment", label: "Invest", icon: TrendingUp },
];

function App() {
  const [mode, setMode] = useState<CalculatorMode>("loan");

  return (
    <div className="h-screen bg-ivory flex flex-col overflow-hidden">
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative shrink-0 flex items-center justify-between px-6 lg:px-10 py-4 border-b border-sand">
        <div className="flex items-center gap-8">
          <h1 className="font-serif text-2xl md:text-3xl text-charcoal">
            Finesse
          </h1>

          {/* Mode Switcher - inline in header */}
          <div className="hidden sm:flex bg-cream rounded-xl p-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`
                  flex items-center gap-1.5 py-2 px-4 rounded-lg font-medium text-sm tracking-wide
                  transition-all duration-300 ease-out
                  ${
                    mode === m.id
                      ? "bg-charcoal text-ivory shadow-md"
                      : "text-slate hover:text-charcoal"
                  }
                `}
              >
                <m.icon size={16} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <ThemeSwitcher />
      </header>

      {/* Mobile Mode Switcher */}
      <div className="sm:hidden relative shrink-0 px-4 py-3 border-b border-sand">
        <div className="flex bg-cream rounded-xl p-1">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-medium text-sm tracking-wide
                transition-all duration-300 ease-out
                ${
                  mode === m.id
                    ? "bg-charcoal text-ivory shadow-md"
                    : "text-slate hover:text-charcoal"
                }
              `}
            >
              <m.icon size={16} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 xl:px-8 py-4 lg:h-full">
          {mode === "loan" && <LoanCalculator />}
          {mode === "mortgage" && <MortgageCalculator />}
          {mode === "investment" && <InvestmentCalculator />}
        </div>
      </main>
    </div>
  );
}

export default App;
