/**
 * habFitt Design Tokens — "Electric Momentum" theme
 * Single source of truth for all colours used across the app.
 */
export const colors = {
  // Backgrounds
  bgPrimary:   '#141414',
  bgSecondary: '#1E1E1E',
  bgCard:      '#252525',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: '#888480',
  textAccent:    '#FF6B00',

  // Gradient stops (amber → orange → deep orange)
  gradientStart: '#FFB300',
  gradientMid:   '#FF6B00',
  gradientEnd:   '#E84000',

  // Semantic
  error:   '#E53E3E',
  success: '#10B981',

  // Utility
  divider:     'rgba(255,255,255,0.08)',
  overlay:     'rgba(0,0,0,0.5)',
  cardBorder:  'rgba(255,255,255,0.06)',
};

export const gradientColors = [colors.gradientStart, colors.gradientMid, colors.gradientEnd];
