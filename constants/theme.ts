import { ACCENT } from '@/constants/finance';

export interface Palette {
  background: string; surface: string; text: string; muted: string; border: string; accent: string; green: string; red: string; amber: string;
}

export const palettes: Record<'light' | 'dark', Palette> = {
  light: { background: '#F5F6FA', surface: '#FFFFFF', text: '#171923', muted: '#777B8A', border: '#E7E8EF', accent: ACCENT, green: '#16804A', red: '#D83B4B', amber: '#D58A00' },
  dark: { background: '#11131A', surface: '#1B1E28', text: '#F6F7FB', muted: '#A5A8B5', border: '#303441', accent: '#817AFF', green: '#4BC28A', red: '#FF7582', amber: '#F3B84B' },
};