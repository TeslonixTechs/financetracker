import type { CurrencyCode } from '@/types/finance';
import { format } from 'date-fns';

export function formatMoney(amount: number, currency: CurrencyCode, compact = false): string {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: 0 }).format(amount);
  } catch {
    const symbols: Record<CurrencyCode, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
    return `${symbols[currency]}${Math.round(amount).toLocaleString()}`;
  }
}

export function monthLabel(date: Date): string { return format(date, 'MMMM yyyy'); }
export function dateLabel(date: string): string { return format(new Date(date), 'EEE, d MMM'); }