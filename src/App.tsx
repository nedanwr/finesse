import { useState } from "react";

import { ThemeSwitcher } from "./components/theme-switcher";
import { LoanCalculator } from "./components/calculators/loan-calculator";
import { MortgageCalculator } from "./components/calculators/mortgage-calculator";
import { InvestmentCalculator } from "./components/calculators/investment-calculator";

type CalculatorMode = "loan" | "mortgage" | "investment";

const modes: { id: CalculatorMode; label: string; icon: string }[] = [
  { id: "loan", label: "Loan", icon: "%" },
  { id: "mortgage", label: "Mortgage", icon: "⌂" },
  { id: "investment", label: "Invest", icon: "↗" },
];

function App() {
  const [mode, setMode] = useState<CalculatorMode>("loan");

  return (
    <div className="min-h-screen bg-ivory">
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-lg mx-auto px-6 py-12 md:py-20">
        {/* Theme Switcher */}
        <div className="absolute top-6 right-6 animate-fade-in">
          <ThemeSwitcher />
        </div>

        {/* Header */}
        <header className="text-center mb-12 animate-slide-up">
          <h1 className="font-serif text-5xl md:text-6xl text-charcoal mb-3">
            Finesse
          </h1>
          <p className="text-slate text-lg tracking-wide">
            Financial calculations, simplified
          </p>
        </header>

        {/* Mode Switcher */}
        <div
          className="flex bg-cream rounded-2xl p-1.5 mb-10 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`
                flex-1 py-3.5 px-4 rounded-xl font-medium text-sm tracking-wide
                transition-all duration-300 ease-out
                ${
                  mode === m.id
                    ? "bg-charcoal text-ivory shadow-lg"
                    : "text-slate hover:text-charcoal"
                }
              `}
            >
              <span className="mr-2">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Calculator */}
        <main className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {mode === "loan" && <LoanCalculator />}
          {mode === "mortgage" && <MortgageCalculator />}
          {mode === "investment" && <InvestmentCalculator />}
        </main>
      </div>
    </div>
  );
}

export default App;
