import type { Theme } from "@/constants/palettes"

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.style.setProperty("--color-primary", theme.ui.primary)
  root.style.setProperty("--color-border", theme.ui.border)
  root.style.setProperty("--color-background", theme.ui.background)
  root.style.setProperty("--color-page", theme.ui.page)
  root.style.setProperty("--color-text", theme.ui.text)
}
