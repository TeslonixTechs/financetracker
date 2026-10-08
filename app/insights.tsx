import {
    CategoryIcon,
    EmptyState,
    Label,
    Panel,
    Screen,
    SectionTitle,
} from "@/components/finance-ui";
import { usePalette } from "@/hooks/usePalette";
import {
    useCategories,
    usePreferences,
    useTransactions,
} from "@/store/finance";
import { formatMoney } from "@/utils/format";
import {
    endOfMonth,
    format,
    isWithinInterval,
    startOfMonth,
    subMonths,
} from "date-fns";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function InsightsScreen() {
  const colors = usePalette();
  const transactions = useTransactions();
  const categories = useCategories();
  const currency = usePreferences().currency;
  const current = new Date();
  const monthRows = transactions.filter((item) =>
    isWithinInterval(new Date(item.date), {
      start: startOfMonth(current),
      end: endOfMonth(current),
    }),
  );
  const income = monthRows
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthRows
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const savingsPercent =
    income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const categoryData = useMemo(
    () =>
      categories
        .filter((category) => category.type === "expense")
        .map((category) => ({
          category,
          value: monthRows
            .filter(
              (item) =>
                item.categoryId === category.id && item.type === "expense",
            )
            .reduce((sum, item) => sum + item.amount, 0),
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [categories, monthRows],
  );
  const months = Array.from({ length: 6 }, (_, index) => {
    const month = subMonths(current, 5 - index);
    const rows = transactions.filter((item) =>
      isWithinInterval(new Date(item.date), {
        start: startOfMonth(month),
        end: endOfMonth(month),
      }),
    );
    return {
      label: format(month, "MMM"),
      income: rows
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
      expense: rows
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const maxExpense = Math.max(0, ...months.map((month) => month.expense));
  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Label>THE BIGGER PICTURE</Label>
        <Text
          style={{
            color: colors.text,
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Money insights
        </Text>
        <Label style={{ marginTop: 5 }}>
          {format(current, "MMMM yyyy")} · built from your local transactions
        </Label>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(70).duration(430)}>
        <Panel
          style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
        >
          <Label style={{ color: "#E5E4FF" }}>NET CASH FLOW THIS MONTH</Label>
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800" }}>
            {formatMoney(income - expenses, currency)}
          </Text>
          <View style={{ flexDirection: "row", gap: 24 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Savings rate {savingsPercent}%
            </Text>
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {income
                ? `${formatMoney(expenses, currency, true)} spent`
                : "Add income to calculate"}
            </Text>
          </View>
        </Panel>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(130).duration(430)}>
        <Panel>
          <SectionTitle title="Six-month cash flow" />
          <View style={{ alignItems: "center", overflow: "hidden" }}>
            <BarChart
              stackData={months.map((month) => ({
                label: month.label,
                stacks: [
                  { value: month.income, color: colors.green },
                  { value: month.expense, color: colors.red },
                ],
              }))}
              barWidth={14}
              spacing={14}
              maxValue={
                Math.max(
                  1,
                  ...months.map((month) => month.income + month.expense),
                ) * 1.15
              }
              noOfSections={3}
              yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
              hideRules
            />
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 18 }}
          >
            <Label>
              <Text style={{ color: colors.green }}>●</Text> Income
            </Label>
            <Label>
              <Text style={{ color: colors.red }}>●</Text> Expense
            </Label>
          </View>
        </Panel>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(190).duration(430)}>
        <Panel>
          <SectionTitle title="Where spending goes" />
          {categoryData.length ? (
            <>
              <View style={{ alignItems: "center" }}>
                <PieChart
                  data={categoryData.map((item) => ({
                    value: item.value,
                    color: item.category.color,
                    text: item.category.name,
                  }))}
                  donut
                  radius={78}
                  innerRadius={53}
                  innerCircleColor={colors.surface}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: "center" }}>
                      <Label>This month</Label>
                      <Text style={{ color: colors.text, fontWeight: "800" }}>
                        {formatMoney(expenses, currency, true)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              {categoryData.slice(0, 5).map((item) => (
                <View
                  key={item.category.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <CategoryIcon category={item.category} size={34} />
                  <Text
                    style={{ color: colors.text, flex: 1, fontWeight: "600" }}
                  >
                    {item.category.name}
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      {formatMoney(item.value, currency)}
                    </Text>
                    <Label>
                      {expenses
                        ? `${Math.round((item.value / expenses) * 100)}% of spend`
                        : ""}
                    </Label>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <EmptyState
              title="No expense pattern yet"
              detail="Your category breakdown will appear as you log spending."
            />
          )}
        </Panel>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(250).duration(430)}>
        <Panel>
          <SectionTitle title="Spending pace" />
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
            {maxExpense
              ? `${formatMoney(maxExpense, currency)} highest month in this view`
              : "No spending recorded yet"}
          </Text>
          <Label>
            Review categories and adjust monthly limits on the Budgets tab.
          </Label>
        </Panel>
      </Animated.View>
    </Screen>
  );
}
