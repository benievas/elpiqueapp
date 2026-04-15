export const colors = {
  // Fondos
  bg:               '#12140D',
  surface:          '#1E2A1E',
  surfaceElevated:  '#253026',
  surfaceHigh:      '#2A3628',
  card:             '#1F221E', // Card bg style in screenshot

  // Acento lima
  accent:           '#C8FF00',
  accentDark:       '#9AC400',
  accentGlow:       'rgba(200,255,0,0.14)',
  accentBorder:     'rgba(200,255,0,0.28)',

  // Texto
  text:             '#FFFFFF',
  textSecondary:    '#A0B09A',
  textMuted:        '#576652',
  textInverse:      '#12140D',

  // Semánticos
  danger:           '#FF4040',
  dangerGlow:       'rgba(255,64,64,0.14)',
  success:          '#00E676',
  warning:          '#FFB300',

  // Bordes y overlays
  border:           'rgba(255,255,255,0.07)',
  borderLight:      'rgba(255,255,255,0.12)',
  overlay:          'rgba(18,20,13,0.88)',
} as const

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
} as const

// Web font stack
export const fonts = {
  black:   'BarlowCondensed_900Black_Italic', // Guardado por compatibilidad
  bold:    'BarlowCondensed_700Bold',
  regular: 'BarlowCondensed_400Regular',
  system:  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const

export const shadows = {
  accent: {
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
} as const

// This is a web-only application
export const isWeb = true

export default { colors, spacing, radius, fonts, shadows }