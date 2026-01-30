import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | null>(null)

function getSystemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function getStoredTheme(key: string, fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(key) as Theme | null
    return stored || fallback
  } catch {
    return fallback
  }
}

function setStoredTheme(key: string, theme: Theme) {
  try {
    localStorage.setItem(key, theme)
  } catch {
    // Ignore storage errors (e.g., private browsing mode)
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => getStoredTheme(storageKey, defaultTheme)
  )
  const [isDark, setIsDark] = useState(() =>
    theme === "system" ? getSystemIsDark() : theme === "dark"
  )

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (dark: boolean) => {
      root.classList.remove("light", "dark")
      root.classList.add(dark ? "dark" : "light")
      setIsDark(dark)
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")

      // Set initial theme based on system preference
      applyTheme(mq.matches)

      // Listen for system theme changes
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches)
      }

      mq.addEventListener("change", handler)

      return () => {
        mq.removeEventListener("change", handler)
      }
    }

    applyTheme(theme === "dark")
  }, [theme])

  const value = {
    theme,
    isDark,
    setTheme: (newTheme: Theme) => {
      setStoredTheme(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === null)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
