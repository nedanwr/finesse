import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

const options = [
  { id: "light" as const, icon: Sun },
  { id: "system" as const, icon: Monitor },
  { id: "dark" as const, icon: Moon },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-cream rounded-full p-1">
      {options.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={`
            p-2 rounded-full transition-all duration-200
            ${
              theme === id
                ? "bg-charcoal text-ivory"
                : "text-slate hover:text-charcoal"
            }
          `}
          aria-label={`Switch to ${id} theme`}
        >
          <Icon size={16} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
