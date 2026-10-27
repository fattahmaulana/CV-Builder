/**
 * CVBuilder Design Tokens - TypeScript Definition
 */

export const designTokens = {
  colors: {
    bgCanvas: "var(--color-bg-canvas)",
    bgCard: "var(--color-bg-card)",
    bgSubtle: "var(--color-bg-subtle)",
    bgMuted: "var(--color-bg-muted)",
    bgDark: "var(--color-bg-dark)",
    bgDarkCard: "var(--color-bg-dark-card)",

    textMain: "var(--color-text-main)",
    textMuted: "var(--color-text-muted)",
    textFaint: "var(--color-text-faint)",
    textInverse: "var(--color-text-inverse)",
    textInverseMuted: "var(--color-text-inverse-muted)",

    accent: "var(--color-accent)",
    accentHover: "var(--color-accent-hover)",
    accentLight: "var(--color-accent-light)",
    accentBorder: "var(--color-accent-border)",

    success: "var(--color-success)",
    successLight: "var(--color-success-light)",
    warning: "var(--color-warning)",
    warningLight: "var(--color-warning-light)",
    error: "var(--color-error)",
    errorLight: "var(--color-error-light)",
    info: "var(--color-info)",
    infoLight: "var(--color-info-light)",

    borderSubtle: "var(--color-border-subtle)",
    borderStrong: "var(--color-border-strong)",
    borderDark: "var(--color-border-dark)",
  },
  radius: {
    xs: "var(--radius-xs)",
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "var(--radius-full)",
  },
  shadows: {
    subtle: "var(--shadow-subtle)",
    card: "var(--shadow-card)",
    elevated: "var(--shadow-elevated)",
    focus: "var(--shadow-focus)",
  },
  typography: {
    display: "var(--font-display)",
    body: "var(--font-body)",
  },
} as const;

export type DesignTokens = typeof designTokens;
