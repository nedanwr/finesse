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

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
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
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
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
