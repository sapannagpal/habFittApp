/**
 * HabFitt design system — "Electric Momentum" colour palette.
 * Import named exports as needed: import { colors, gradientColors } from '../theme/colors';
 */

// ─── Colour Tokens ───────────────────────────────────────────────────────────

export const colors = {
  bgPrimary:     '#141414',
  bgSecondary:   '#1E1E1E',
  bgCard:        '#252525',
  textPrimary:   '#FFFFFF',
  textSecondary: '#888480',
  textAccent:    '#FF6B00',
  gradientStart: '#FFB300',
  gradientMid:   '#FF6B00',
  gradientEnd:   '#E84000',
  error:         '#E53E3E',
  success:       '#10B981',
  restAccent:    '#6366F1',
  divider:       'rgba(255,255,255,0.08)',
  overlay:       'rgba(0,0,0,0.5)',
  cardBorder:    'rgba(255,255,255,0.06)',
};

// ─── Gradient Array (used by expo-linear-gradient) ────────────────────────────

export const gradientColors = [colors.gradientStart, colors.gradientMid, colors.gradientEnd];
