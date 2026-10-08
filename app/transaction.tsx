import {
    ChoiceChips,
    Field,
    Label,
    Panel,
    Screen,
} from "@/components/finance-ui";
import { usePalette } from "@/hooks/usePalette";
import {
    useCategories,
    useFinanceStore,
    useTransactions,
} from "@/store/finance";
import type { Transaction, TransactionType } from "@/types/finance";
import { format, parseISO } from "date-fns";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    View,
} from "react-native";

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = usePalette();
  const categories = useCategories();
  const transactions = useTransactions();
  const saveTransaction = useFinanceStore((state) => state.saveTransaction);
  const existing = transactions.find((item) => item.id === id);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [type, setType] = useState<TransactionType>(
    existing?.type ?? "expense",
  );
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [date, setDate] = useState(
    existing
      ? format(new Date(existing.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    date?: string;
  }>({});
  const options = useMemo(
    () => categories.filter((item) => item.type === type),
    [categories, type],
  );
  useEffect(() => {
    if (!options.some((item) => item.id === categoryId))
      setCategoryId(options[0]?.id ?? "");
  }, [categoryId, options]);
  const submit = async () => {
    const numericAmount = Number(amount.replace(/,/g, ""));
    const parsedDate = parseISO(date);
    const nextErrors = {
      amount:
        numericAmount > 0 ? undefined : "Enter an amount greater than zero.",
      category: categoryId ? undefined : "Choose a category.",
      date: Number.isNaN(parsedDate.valueOf())
        ? "Enter a date as YYYY-MM-DD."
        : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.amount || nextErrors.category || nextErrors.date) return;
    const transaction: Transaction = {
      id: existing?.id ?? `transaction-${Date.now()}`,
      amount: numericAmount,
      type,
      categoryId,
      date: new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        12,
      ).toISOString(),
      note: note.trim(),
    };
    try {
      await saveTransaction(transaction);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Could not save", "Please try again.");
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View>
          <Label>{existing ? "UPDATE ENTRY" : "NEW ENTRY"}</Label>
          <Text
            style={{
              color: colors.text,
              fontSize: 25,
              fontWeight: "800",
              marginTop: 3,
            }}
          >
            {existing ? "Edit transaction" : "Add transaction"}
          </Text>
        </View>
        <Panel>
          <Field
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.amount}
          />
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>Type</Text>
            <ChoiceChips
              values={["expense", "income"] as const}
              value={type}
              onChange={setType}
              labels={{ expense: "Expense", income: "Income" }}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              Category
            </Text>
            <ChoiceChips
              values={options.map((item) => item.id)}
              value={categoryId}
              onChange={setCategoryId}
              labels={Object.fromEntries(
                options.map((item) => [item.id, item.name]),
              )}
            />
            {errors.category ? (
              <Text style={{ color: colors.red, fontSize: 12 }}>
                {errors.category}
              </Text>
            ) : null}
          </View>
          <Field
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            error={errors.date}
          />
          <Field
            label="Note"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            multiline
          />
        </Panel>
        <Text
          onPress={() => void submit()}
          accessibilityRole="button"
          style={{
            overflow: "hidden",
            backgroundColor: colors.accent,
            color: "#FFFFFF",
            textAlign: "center",
            paddingVertical: 16,
            borderRadius: 13,
            fontWeight: "800",
            fontSize: 16,
          }}
        >
          {existing ? "Save changes" : "Save transaction"}
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
