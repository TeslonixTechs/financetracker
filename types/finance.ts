export type TransactionType = 'income' | 'expense';
export type ThemeMode = 'light' | 'dark' | 'system';
export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export interface Preferences {
  currency: CurrencyCode;
  theme: ThemeMode;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  preferences: Preferences;
  ready: boolean;
  initialize: () => Promise<void>;
  saveTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (budget: Budget) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  savePreferences: (preferences: Preferences) => Promise<void>;
  clearAll: () => Promise<void>;
}