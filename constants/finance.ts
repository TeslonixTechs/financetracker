import type { Category } from '@/types/finance';

export const ACCENT = '#4F46E5';
export const ENABLE_DEV_SAMPLE_DATA = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_SAMPLE_DATA === 'true';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'expense-food', name: 'Food', type: 'expense', icon: 'restaurant-outline', color: '#F97316' },
  { id: 'expense-transport', name: 'Transport', type: 'expense', icon: 'car-outline', color: '#0891B2' },
  { id: 'expense-bills', name: 'Bills', type: 'expense', icon: 'receipt-outline', color: '#7C3AED' },
  { id: 'expense-shopping', name: 'Shopping', type: 'expense', icon: 'bag-outline', color: '#DB2777' },
  { id: 'expense-health', name: 'Health', type: 'expense', icon: 'heart-outline', color: '#DC2626' },
  { id: 'expense-entertainment', name: 'Entertainment', type: 'expense', icon: 'film-outline', color: '#2563EB' },
  { id: 'expense-education', name: 'Education', type: 'expense', icon: 'book-outline', color: '#059669' },
  { id: 'expense-other', name: 'Other', type: 'expense', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
  { id: 'income-salary', name: 'Salary', type: 'income', icon: 'briefcase-outline', color: '#16A34A' },
  { id: 'income-business', name: 'Business', type: 'income', icon: 'storefront-outline', color: '#0D9488' },
  { id: 'income-gift', name: 'Gift', type: 'income', icon: 'gift-outline', color: '#C026D3' },
  { id: 'income-other', name: 'Other', type: 'income', icon: 'add-circle-outline', color: '#64748B' },
];

export const CATEGORY_COLORS = ['#F97316', '#0891B2', '#7C3AED', '#DB2777', '#DC2626', '#2563EB', '#059669', '#64748B'];