import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { addMonths, endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { EmptyState, Label, Panel, Screen, SectionTitle, TransactionRow, ActionButton } from '@/components/finance-ui';
import { usePalette } from '@/hooks/usePalette';
import { useCategories, usePreferences, useTransactions } from '@/store/finance';
import { formatMoney, monthLabel } from '@/utils/format';

export default function DashboardScreen() {
  const [month, setMonth] = useState(new Date());
  const transactions = useTransactions();
  const categories = useCategories();
  const currency = usePreferences().currency;
  const colors = usePalette();
  const router = useRouter();
  const monthTransactions = useMemo(() => transactions.filter((item) => isWithinInterval(new Date(item.date), { start: startOfMonth(month), end: endOfMonth(month) })), [month, transactions]);
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const pieData = categories.filter((category) => category.type === 'expense').map((category) => ({ value: monthTransactions.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0), color: category.color, text: category.name })).filter((item) => item.value > 0);
  const chartData = Array.from({ length: 6 }, (_, index) => {
    const targetMonth = subMonths(month, 5 - index);
    const rows = transactions.filter((item) => isWithinInterval(new Date(item.date), { start: startOfMonth(targetMonth), end: endOfMonth(targetMonth) }));
    return { label: format(targetMonth, 'MMM'), income: rows.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0), expense: rows.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0) };
  });
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const openNew = () => { void Haptics.selectionAsync(); router.push('/transaction'); };

  return <Screen>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Label>YOUR MONEY, IN FOCUS</Label><Text style={{ color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 3 }}>Overview</Text></View><Pressable onPress={openNew} accessibilityLabel="Add transaction" accessibilityRole="button" style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={28} color="#FFFFFF" /></Pressable></View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pressable accessibilityLabel="Previous month" onPress={() => setMonth((value) => subMonths(value, 1))} hitSlop={10}><Ionicons name="chevron-back" size={20} color={colors.text} /></Pressable><Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{monthLabel(month)}</Text><Pressable accessibilityLabel="Next month" onPress={() => setMonth((value) => addMonths(value, 1))} hitSlop={10}><Ionicons name="chevron-forward" size={20} color={colors.text} /></Pressable></View>
    <Panel style={{ backgroundColor: colors.accent, borderColor: colors.accent, padding: 20 }}><Text style={{ color: '#E5E4FF', fontWeight: '600' }}>Total balance</Text><Text style={{ color: '#FFFFFF', fontSize: 33, fontWeight: '800', marginTop: 8 }}>{formatMoney(income - expenses, currency)}</Text><View style={{ flexDirection: 'row', gap: 24, marginTop: 19 }}><View style={{ flex: 1 }}><Text style={{ color: '#E5E4FF', fontSize: 12 }}>INCOME</Text><Text style={{ color: '#FFFFFF', fontWeight: '700', marginTop: 5 }}>{formatMoney(income, currency, true)}</Text></View><View style={{ flex: 1 }}><Text style={{ color: '#E5E4FF', fontSize: 12 }}>EXPENSES</Text><Text style={{ color: '#FFFFFF', fontWeight: '700', marginTop: 5 }}>{formatMoney(expenses, currency, true)}</Text></View></View></Panel>
    <Panel><SectionTitle title="Spending by category" /><View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 190 }}>{pieData.length ? <PieChart data={pieData} donut radius={82} innerRadius={58} innerCircleColor={colors.surface} centerLabelComponent={() => <View style={{ alignItems: 'center' }}><Label>Spent</Label><Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{formatMoney(expenses, currency, true)}</Text></View>} /> : <EmptyState title="Nothing spent yet" detail="Expenses will appear here." />}</View>{pieData.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{pieData.slice(0, 6).map((item) => <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} /><Label>{item.text}</Label></View>)}</View> : null}</Panel>
    <Panel><SectionTitle title="Income vs expenses" /><View style={{ alignItems: 'center', overflow: 'hidden' }}><BarChart data={chartData.map((item) => ({ value: item.income, label: item.label, frontColor: colors.green }))} data2={chartData.map((item) => ({ value: item.expense, frontColor: colors.red }))} barWidth={12} spacing={15} roundedTop maxValue={Math.max(1, ...chartData.flatMap((item) => [item.income, item.expense])) * 1.2} noOfSections={3} yAxisTextStyle={{ color: colors.muted, fontSize: 10 }} xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }} hideRules /></View><View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}><Label><Text style={{ color: colors.green }}>●</Text> Income</Label><Label><Text style={{ color: colors.red }}>●</Text> Expenses</Label></View></Panel>
    <SectionTitle title="Recent activity" action="See all" onAction={() => router.push('/(tabs)/transactions')} />
    {latest.length ? <Panel style={{ gap: 0 }}>{latest.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onPress={() => router.push({ pathname: '/transaction', params: { id: transaction.id } })} />)}</Panel> : <Panel><EmptyState title="Ready when you are" detail="Add a transaction to start tracking your money." /><ActionButton title="Add transaction" icon="add" onPress={openNew} /></Panel>}
  </Screen>;
}
