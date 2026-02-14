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

interface ModeButtonProps {
  mode: { id: CalculatorMode; label: string; icon: LucideIcon };
  isPressed: boolean;
  onClick: () => void;
  variant: "desktop" | "mobile";
}

function ModeButton({ mode: m, isPressed, onClick, variant }: ModeButtonProps) {
  const baseStyles = "rounded-lg font-medium text-sm tracking-wide transition-all duration-300 ease-out";
  const variantStyles = variant === "desktop"
    ? "flex items-center gap-1.5 py-2 px-4"
    : "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3";
  const stateStyles = isPressed
    ? "bg-charcoal text-ivory shadow-md"
    : "text-slate hover:text-charcoal";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isPressed}
      className={`${baseStyles} ${variantStyles} ${stateStyles}`}
    >
      <m.icon size={16} aria-hidden="true" />
      {m.label}
    </button>
  );
}

interface ModeSwitcherProps {
  currentMode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
  variant: "desktop" | "mobile";
  className?: string;
}

function ModeSwitcher({ currentMode, onModeChange, variant, className = "" }: ModeSwitcherProps) {
  return (
    <div role="group" aria-label="Calculator type" className={`flex bg-cream rounded-xl p-1 ${className}`}>
      {modes.map((m) => (
        <ModeButton
          key={m.id}
          mode={m}
          isPressed={currentMode === m.id}
          onClick={() => onModeChange(m.id)}
          variant={variant}
        />
      ))}
    </div>
  );
}

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
          <ModeSwitcher
            currentMode={mode}
            onModeChange={setMode}
            variant="desktop"
            className="hidden sm:flex"
          />
        </div>
        <ThemeSwitcher />
      </header>

      {/* Mobile Mode Switcher */}
      <div className="sm:hidden relative shrink-0 px-4 py-3 border-b border-sand">
        <ModeSwitcher currentMode={mode} onModeChange={setMode} variant="mobile" />
      </div>

      {/* Main Content - All calculators rendered, inactive ones hidden to preserve state */}
      <main className="relative flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 xl:px-8 py-4 lg:h-full">
          <div className={mode === "loan" ? "" : "hidden"}>
            <LoanCalculator />
          </div>
          <div className={mode === "mortgage" ? "" : "hidden"}>
            <MortgageCalculator />
          </div>
          <div className={mode === "investment" ? "" : "hidden"}>
            <InvestmentCalculator />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
