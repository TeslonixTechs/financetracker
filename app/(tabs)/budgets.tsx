import {
    CategoryIcon,
    Field,
    Label,
    Panel,
    Screen,
} from "@/components/finance-ui";
import { usePalette } from "@/hooks/usePalette";
import {
    useCategories,
    useFinanceStore,
    usePreferences,
    useTransactions,
} from "@/store/finance";
import type { Budget } from "@/types/finance";
import { formatMoney } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

export default function BudgetsScreen() {
  const categories = useCategories().filter(
    (category) => category.type === "expense",
  );
  const transactions = useTransactions();
  const budgets = useFinanceStore((state) => state.budgets);
  const saveBudget = useFinanceStore((state) => state.saveBudget);
  const currency = usePreferences().currency;
  const colors = usePalette();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const spent = useMemo(
    () =>
      transactions
        .filter(
          (item) =>
            item.type === "expense" &&
            new Date(item.date).getMonth() === new Date().getMonth() &&
            new Date(item.date).getFullYear() === new Date().getFullYear(),
        )
        .reduce<
          Record<string, number>
        >((result, item) => ({ ...result, [item.categoryId]: (result[item.categoryId] ?? 0) + item.amount }), {}),
    [transactions],
  );
  const updateBudget = async (categoryId: string, amount: string) => {
    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value < 0)
      return Alert.alert("Check amount", "Enter a valid monthly amount.");
    const budget: Budget = { categoryId, amount: value };
    await saveBudget(budget);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  return (
    <Screen>
      <View>
        <Label>MONTHLY PLAN</Label>
        <Text
          style={{
            color: colors.text,
            fontSize: 25,
            fontWeight: "800",
            marginTop: 3,
          }}
        >
          Spend with intention
        </Text>
      </View>
      <Label>
        Budgets reset with the calendar month. Add or update a limit for each
        category.
      </Label>
      {categories.map((category) => {
        const amount =
          budgets.find((item) => item.categoryId === category.id)?.amount ?? 0;
        const currentSpend = spent[category.id] ?? 0;
        const progress = amount > 0 ? currentSpend / amount : 0;
        const progressColor =
          progress >= 1
            ? colors.red
            : progress >= 0.8
              ? colors.amber
              : colors.accent;
        return (
          <Panel key={category.id}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <CategoryIcon category={category} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {category.name}
                </Text>
                <Label>
                  {amount > 0
                    ? `${formatMoney(Math.max(amount - currentSpend, 0), currency)} remaining`
                    : "No limit set"}
                </Label>
              </View>
              <Text style={{ color: progressColor, fontWeight: "700" }}>
                {amount ? `${Math.round(progress * 100)}%` : ""}
              </Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 5,
                backgroundColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: progressColor,
                  borderRadius: 5,
                }}
              />
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}
            >
              <View style={{ flex: 1 }}>
                <Field
                  label="Monthly limit"
                  value={drafts[category.id] ?? (amount ? String(amount) : "")}
                  onChangeText={(value) =>
                    setDrafts((previous) => ({
                      ...previous,
                      [category.id]: value,
                    }))
                  }
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                />
              </View>
              <Pressable
                onPress={() =>
                  void updateBudget(
                    category.id,
                    drafts[category.id] ?? String(amount),
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`Save ${category.name} budget`}
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 16,
                  minHeight: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </Panel>
        );
      })}
      {!categories.length ? (
        <Panel>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            No expense categories
          </Text>
        </Panel>
      ) : null}
    </Screen>
  );
}
