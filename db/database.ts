import { DEFAULT_CATEGORIES, ENABLE_DEV_SAMPLE_DATA } from '@/constants/finance';
import type { Budget, Category, Preferences, Transaction } from '@/types/finance';
import * as SQLite from 'expo-sqlite';

const databasePromise = SQLite.openDatabaseAsync('pocket-ledger.db');

export async function initializeDatabase(): Promise<void> {
  const database = await databasePromise;
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, categoryId TEXT NOT NULL, date TEXT NOT NULL, note TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS budgets (categoryId TEXT PRIMARY KEY NOT NULL, amount REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    PRAGMA user_version = 1;
  `);
  const categories = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM categories');
  if (!categories?.count) {
    for (const category of DEFAULT_CATEGORIES) {
      await database.runAsync('INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)', category.id, category.name, category.type, category.icon, category.color);
    }
  }
  if (ENABLE_DEV_SAMPLE_DATA) {
    const rows = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM transactions');
    if (!rows?.count) await seedSampleTransactions(database);
  }
}

async function seedSampleTransactions(database: SQLite.SQLiteDatabase): Promise<void> {
  const today = new Date();
  const entries: Array<[number, string, string, number, string]> = [
    [14500, 'expense', 'expense-food', 0, 'Market groceries'],
    [320000, 'income', 'income-salary', 1, 'Monthly salary'],
    [8500, 'expense', 'expense-transport', 2, 'Fuel'],
    [22000, 'expense', 'expense-bills', 3, 'Electricity'],
    [12000, 'income', 'income-business', 4, 'Weekend orders'],
    [18000, 'expense', 'expense-shopping', 5, 'Household items'],
  ];
  for (const [amount, type, categoryId, dayOffset, note] of entries) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOffset).toISOString();
    await database.runAsync('INSERT INTO transactions (id, amount, type, categoryId, date, note) VALUES (?, ?, ?, ?, ?, ?)', `sample-${categoryId}-${dayOffset}`, amount, type, categoryId, date, note);
  }
}

export async function readAll(): Promise<{ transactions: Transaction[]; categories: Category[]; budgets: Budget[]; preferences: Preferences }> {
  const database = await databasePromise;
  const [transactions, categories, budgets, preferenceRows] = await Promise.all([
    database.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC'),
    database.getAllAsync<Category>('SELECT * FROM categories ORDER BY name'),
    database.getAllAsync<Budget>('SELECT * FROM budgets'),
    database.getAllAsync<{ key: string; value: string }>('SELECT * FROM preferences'),
  ]);
  const stored = Object.fromEntries(preferenceRows.map(({ key, value }) => [key, value]));
  return {
    transactions,
    categories,
    budgets,
    preferences: {
      currency: (stored.currency as Preferences['currency']) || 'NGN',
      theme: (stored.theme as Preferences['theme']) || 'system',
    },
  };
}

export async function upsertTransaction(transaction: Transaction): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('INSERT OR REPLACE INTO transactions (id, amount, type, categoryId, date, note) VALUES (?, ?, ?, ?, ?, ?)', transaction.id, transaction.amount, transaction.type, transaction.categoryId, transaction.date, transaction.note);
}

export async function removeTransaction(id: string): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function upsertBudget(budget: Budget): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('INSERT OR REPLACE INTO budgets (categoryId, amount) VALUES (?, ?)', budget.categoryId, budget.amount);
}

export async function upsertCategory(category: Category): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('INSERT OR REPLACE INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)', category.id, category.name, category.type, category.icon, category.color);
}

export async function removeCategory(id: string): Promise<void> {
  const database = await databasePromise;
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM transactions WHERE categoryId = ?', id);
    await database.runAsync('DELETE FROM budgets WHERE categoryId = ?', id);
    await database.runAsync('DELETE FROM categories WHERE id = ?', id);
  });
}

export async function persistPreferences(preferences: Preferences): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', 'currency', preferences.currency);
  await database.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', 'theme', preferences.theme);
}

export async function clearDatabase(): Promise<void> {
  const database = await databasePromise;
  await database.execAsync('DELETE FROM transactions; DELETE FROM budgets; DELETE FROM categories; DELETE FROM preferences;');
  for (const category of DEFAULT_CATEGORIES) await upsertCategory(category);
}