import * as db from '@/db/database';
import type { FinanceState } from '@/types/finance';
import { create } from 'zustand';

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [], categories: [], budgets: [], preferences: { currency: 'NGN', theme: 'system' }, ready: false,
  initialize: async () => { await db.initializeDatabase(); set({ ...(await db.readAll()), ready: true }); },
  saveTransaction: async (transaction) => { await db.upsertTransaction(transaction); set({ transactions: (await db.readAll()).transactions }); },
  deleteTransaction: async (id) => { await db.removeTransaction(id); set({ transactions: (await db.readAll()).transactions }); },
  saveBudget: async (budget) => { await db.upsertBudget(budget); set({ budgets: (await db.readAll()).budgets }); },
  saveCategory: async (category) => { await db.upsertCategory(category); set({ categories: (await db.readAll()).categories }); },
  deleteCategory: async (id) => { await db.removeCategory(id); const data = await db.readAll(); set(data); },
  savePreferences: async (preferences) => { await db.persistPreferences(preferences); set({ preferences }); },
  clearAll: async () => { await db.clearDatabase(); const data = await db.readAll(); set(data); },
}));

export const useTransactions = () => useFinanceStore((state) => state.transactions);
export const useCategories = () => useFinanceStore((state) => state.categories);
export const usePreferences = () => useFinanceStore((state) => state.preferences);