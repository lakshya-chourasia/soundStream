import { ThemeConfig, ThemePreset } from '../types/player';

export const AETHER_THEME: ThemeConfig = {
  id: 'aether',
  name: 'UIVERSE AETHER',
  tagline: 'Editorial Dark + Prismatic Chromatic Glass',
  accent: '#38bdf8', // Cyan
  accentSecondary: '#ec4899', // Magenta
  bgClass: 'bg-[#08090c]',
  cardClass: 'glass-panel text-[#f4f5f8]',
  borderClass: 'border-white/10',
  textClass: 'text-[#f4f5f8]',
};

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  aether: AETHER_THEME,
  obsidian: AETHER_THEME,
  spotify: AETHER_THEME,
  midnight: AETHER_THEME,
  amethyst: AETHER_THEME,
  emerald: AETHER_THEME,
  braun: AETHER_THEME,
  nordic: AETHER_THEME,
};
