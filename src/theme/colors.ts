// Bordo/Maroon Color Palette
export const colors = {
  // Primary colors
  primary: {
    900: '#470000', // Darkest
    800: '#6b0000',
    700: '#8f0000',
    600: '#b30000',
    500: '#d70000', // Main red
    400: '#ff0000',
    300: '#ff4444',
  },

  // Accent colors (pink/rose)
  accent: {
    900: '#ff8a8a',
    800: '#ff9e9e',
    700: '#ffb2b2',
    600: '#ffc6c6',
    500: '#ffcece', // Lightest pink
    400: '#ffe2e2',
    300: '#fff0f0',
  },

  // Neutral colors
  neutral: {
    900: '#1a1a1a',
    800: '#2d2d2d',
    700: '#404040',
    600: '#525252',
    500: '#737373',
    400: '#a3a3a3',
    300: '#d4d4d4',
    200: '#e5e5e5',
    100: '#f5f5f5',
    50: '#fafafa',
  },

  // Semantic colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Theme-specific colors
export const lightTheme = {
  background: colors.neutral[50],
  surface: '#ffffff',
  text: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textMuted: colors.neutral[400],
  border: colors.neutral[200],
  primary: colors.primary[600],
  primaryLight: colors.accent[500],
  accent: colors.accent[600],
  card: '#ffffff',
  input: '#ffffff',
  placeholder: colors.neutral[400],
  dialogBackground: '#eedddd',
  dialogBorder: '#470000',
  dialogText: '#000000',
};

export const darkTheme = {
  background: colors.neutral[900],
  surface: colors.neutral[800],
  text: '#ffffff',
  textSecondary: colors.neutral[300],
  textMuted: colors.neutral[400],
  border: colors.neutral[700],
  primary: colors.accent[600],
  primaryLight: colors.primary[600],
  accent: colors.accent[500],
  card: colors.neutral[800],
  input: colors.neutral[700],
  placeholder: colors.neutral[400],
  dialogBackground: '#180000',
  dialogBorder: '#470000',
  dialogText: '#eedddd',
};

export type Theme = typeof lightTheme;
