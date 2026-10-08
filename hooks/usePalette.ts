import { palettes } from '@/constants/theme';
import { usePreferences } from '@/store/finance';
import { useColorScheme } from 'react-native';

export function usePalette() {
  const systemScheme = useColorScheme();
  const theme = usePreferences().theme;
  return palettes[theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme];
}