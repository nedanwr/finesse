# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start Vite dev server with HMR
pnpm build    # TypeScript check + Vite production build
pnpm lint     # Run ESLint
pnpm preview  # Preview production build locally
```

## Architecture

**Finesse** is a React 19 SPA with three calculator modes: Loan, Mortgage, and Investment. Built with Vite, TypeScript (strict mode), and Tailwind CSS v4.

### Core Structure

- `src/App.tsx` - Main component with mode switcher (Loan/Mortgage/Investment tabs)
- `src/components/calculators/` - Each calculator manages its own state via hooks (useState, useMemo, useCallback)
- `src/lib/calculations.ts` - All financial math: amortization schedules, extra payments, grace periods, investment growth
- `src/lib/export.ts` - CSV and Excel (.xlsx via ExcelJS) export with formula injection protection
- `src/lib/print.ts` - PDF/print via hidden iframe with HTML escaping for XSS prevention
- `src/lib/format.ts` - Currency formatting utilities

### Component Patterns

- `InputField` - Reusable numeric input with prefix/suffix, slider integration, accessibility labels
- `charts.tsx` - Recharts-based visualizations (pie charts, area charts) with custom theme colors
- `ThemeProvider` - System/light/dark mode via context, syncs with localStorage

### Custom Theme (defined in src/index.css)

Light/dark mode uses semantic color tokens: ivory, cream, sand, stone, charcoal, graphite, slate, terracotta, sage. Dark mode inverts these via CSS custom property overrides on `html.dark`.

## Tech Stack

- React 19 with React Compiler (babel-plugin-react-compiler)
- Vite with rolldown-vite
- Tailwind CSS 4 with @tailwindcss/vite plugin
- Recharts for data visualization
- ExcelJS for Excel export
- Lucide React for icons
