/** Roshni design tokens. Single source of truth for colour, shape and spacing. */
export const colors = {
  primary800: '#6B21A8', // screen headers
  primary700: '#7E22CE', // text on white buttons
  primary600: '#7C3AED', // hero card, primary buttons, active tab
  primary300: '#D8B4FE',
  primary200: '#E9D5FF',
  primary100: '#F3E8FF', // feature-card background
  primary50: '#FAF5FF', // tip cards
  surface: '#FBFAFF', // app background
  ink: '#140A1F', // primary text
  inkSoft: '#4B3F5C', // secondary text (contrast checked on surface)
  night: '#1E0A3C', // colour-test card
  white: '#FFFFFF',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  red: '#DC2626',
  redBg: '#FEF2F2',
  green: '#059669',
  greenBg: '#ECFDF5',
  /** Icons only. Never use for text: 2.5:1 on white fails WCAG AA. */
  muted: '#9CA3AF',
  /** Inactive tab labels: about 4.8:1 on white. */
  mutedText: '#6B7280',
  border: '#E9D5FF',
} as const;

export const radius = { card: 16, control: 12, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Minimum touch target in dp. */
export const TOUCH_TARGET = 48;
