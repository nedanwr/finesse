import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

const options = [
  { id: "light" as const, icon: Sun },
  { id: "system" as const, icon: Monitor },
  { id: "dark" as const, icon: Moon },
];

const themeLabels = {
  light: "Light",
  system: "System",
  dark: "Dark",
} as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className="flex items-center gap-1 bg-cream rounded-full p-1"
    >
      {options.map(({ id, icon: Icon }) => {
        const isPressed = theme === id;
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            aria-pressed={isPressed}
            aria-label={`${themeLabels[id]} theme`}
            className={`
              p-2 rounded-full transition-all duration-200
              ${
                isPressed
                  ? "bg-charcoal text-ivory"
                  : "text-slate hover:text-charcoal"
              }
            `}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
