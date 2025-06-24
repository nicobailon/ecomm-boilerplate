export const themes = {
  light: {
    name: 'Light',
    class: '',
  },
  dark: {
    name: 'Dark',
    class: 'dark',
  },
  modern: {
    name: 'Modern',
    class: 'theme-modern',
  },
  playful: {
    name: 'Playful',
    class: 'theme-playful',
  },
} as const;

export type ThemeKey = keyof typeof themes;
export type Theme = (typeof themes)[ThemeKey];