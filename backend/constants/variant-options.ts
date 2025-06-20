export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type ProductSize = typeof PRODUCT_SIZES[number];

export const SIZE_ORDER: Record<ProductSize, number> = {
  'XS': 1,
  'S': 2,
  'M': 3,
  'L': 4,
  'XL': 5,
  'XXL': 6
};

export const COLOR_PRESETS = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#FF0000',
  blue: '#0000FF',
  green: '#00FF00',
  yellow: '#FFFF00',
  purple: '#800080',
  pink: '#FFC0CB',
  orange: '#FFA500',
  gray: '#808080',
  brown: '#A52A2A',
  navy: '#000080',
  beige: '#F5F5DC',
  maroon: '#800000',
  olive: '#808000',
  teal: '#008080',
  coral: '#FF7F50',
  indigo: '#4B0082',
  khaki: '#F0E68C',
  turquoise: '#40E0D0'
} as const;

export type ColorPreset = keyof typeof COLOR_PRESETS;

export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

export const isValidColor = (color: string): boolean => {
  return isValidHexColor(color) || color in COLOR_PRESETS;
};

export const getColorValue = (color: string): string => {
  if (isValidHexColor(color)) {
    return color;
  }
  return COLOR_PRESETS[color as ColorPreset] || color;
};