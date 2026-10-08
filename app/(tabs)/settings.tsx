import {
    ActionButton,
    CategoryIcon,
    ChoiceChips,
    Field,
    Label,
    Panel,
    Screen,
    SectionTitle,
} from "@/components/finance-ui";
import { CATEGORY_COLORS } from "@/constants/finance";
import { usePalette } from "@/hooks/usePalette";
import {
    useCategories,
    useFinanceStore,
    usePreferences,
    useTransactions,
} from "@/store/finance";
import type {
    Category,
    CurrencyCode,
    ThemeMode,
    TransactionType,
} from "@/types/finance";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

const currencyLabels: Record<CurrencyCode, string> = {
  NGN: "NGN ₦",
  USD: "USD $",
  GBP: "GBP £",
  EUR: "EUR €",
};
const iconOptions = [
  "restaurant-outline",
  "car-outline",
  "receipt-outline",
  "bag-outline",
  "heart-outline",
  "film-outline",
  "book-outline",
  "briefcase-outline",
  "storefront-outline",
  "gift-outline",
  "home-outline",
  "airplane-outline",
] as const;
const quoteCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default function SettingsScreen() {
  const colors = usePalette();
  const categories = useCategories();
  const transactions = useTransactions();
  const preferences = usePreferences();
  const savePreferences = useFinanceStore((state) => state.savePreferences);
  const saveCategory = useFinanceStore((state) => state.saveCategory);
  const deleteCategory = useFinanceStore((state) => state.deleteCategory);
  const clearAll = useFinanceStore((state) => state.clearAll);
  const [name, setName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");
  const [categoryIcon, setCategoryIcon] = useState<string>(
    "ellipsis-horizontal-circle-outline",
  );
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const onSaveCategory = async () => {
    if (!name.trim())
      return Alert.alert(
        "Category name required",
        "Enter a name before saving.",
      );
    const category: Category = {
      id: editingId ?? `category-${Date.now()}`,
      name: name.trim(),
      type: categoryType,
      icon: categoryIcon,
      color: categoryColor,
    };
    await saveCategory(category);
    setName("");
    setEditingId(null);
    void Haptics.selectionAsync();
  };
  const startEdit = (category: Category) => {
    setName(category.name);
    setCategoryType(category.type);
    setCategoryIcon(category.icon);
    setCategoryColor(category.color);
    setEditingId(category.id);
  };
  const onDeleteCategory = (category: Category) =>
    Alert.alert(
      `Delete ${category.name}?`,
      "Transactions and budgets in this category will also be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteCategory(category.id);
            if (editingId === category.id) {
              setEditingId(null);
              setName("");
            }
          },
        },
      ],
    );
  const exportCsv = async () => {
    if (!transactions.length)
      return Alert.alert(
        "No transactions",
        "Add transactions before exporting.",
      );
    setExporting(true);
    try {
      const lines = [["Date", "Type", "Category", "Amount", "Note"].join(",")];
      for (const transaction of transactions) {
        const category =
          categories.find((item) => item.id === transaction.categoryId)?.name ??
          "Category removed";
        lines.push(
          [
            transaction.date,
            transaction.type,
            category,
            String(transaction.amount),
            transaction.note,
          ]
            .map(quoteCsv)
            .join(","),
        );
      }
      const file = new File(
        Paths.cache,
        `pocket-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      file.create({ overwrite: true });
      file.write(lines.join("\n"));
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export transactions",
        });
      else
        Alert.alert(
          "Sharing unavailable",
          "This device cannot share files right now.",
        );
    } catch {
      Alert.alert(
        "Export failed",
        "The CSV could not be created. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };
  const onClearAll = () =>
    Alert.alert(
      "Clear all data?",
      "All transactions, budgets, preferences, and custom categories will be removed. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear data",
          style: "destructive",
          onPress: () => {
            void clearAll();
          },
        },
      ],
    );

  return (
    <Screen>
      <Panel>
        <SectionTitle title="Preferences" />
        <View style={{ gap: 8 }}>
          <Label>Currency</Label>
          <ChoiceChips
            values={["NGN", "USD", "GBP", "EUR"] as const}
            value={preferences.currency}
            onChange={(currency) =>
              void savePreferences({ ...preferences, currency })
            }
            labels={currencyLabels}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Label>Appearance</Label>
          <ChoiceChips
            values={["system", "light", "dark"] as const}
            value={preferences.theme}
            onChange={(theme: ThemeMode) =>
              void savePreferences({ ...preferences, theme })
            }
            labels={{ system: "System", light: "Light", dark: "Dark" }}
          />
        </View>
      </Panel>
      <SectionTitle title="Categories" />
      {categories.map((category) => (
        <Panel key={category.id} style={{ paddingVertical: 11 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <CategoryIcon category={category} size={37} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {category.name}
              </Text>
              <Label>{category.type === "income" ? "Income" : "Expense"}</Label>
            </View>
            <Pressable
              onPress={() => startEdit(category)}
              accessibilityLabel={`Edit ${category.name}`}
              hitSlop={8}
              style={{ padding: 8 }}
            >
              <Ionicons name="create-outline" size={21} color={colors.accent} />
            </Pressable>
            <Pressable
              onPress={() => onDeleteCategory(category)}
              accessibilityLabel={`Delete ${category.name}`}
              hitSlop={8}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.red} />
            </Pressable>
          </View>
        </Panel>
      ))}
      <Panel>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
          {editingId ? "Edit category" : "Add category"}
        </Text>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Pets"
        />
        <View style={{ gap: 8 }}>
          <Label>Type</Label>
          <ChoiceChips
            values={["expense", "income"] as const}
            value={categoryType}
            onChange={setCategoryType}
            labels={{ expense: "Expense", income: "Income" }}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Label>Icon</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {iconOptions.map((icon) => (
              <Pressable
                key={icon}
                onPress={() => setCategoryIcon(icon)}
                accessibilityLabel={`Choose ${icon.replace("-outline", "")} icon`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    categoryIcon === icon ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={icon}
                  size={19}
                  color={categoryIcon === icon ? "#FFFFFF" : colors.text}
                />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Label>Colour</Label>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {CATEGORY_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setCategoryColor(color)}
                accessibilityLabel={`Choose colour ${color}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: color,
                  borderWidth: categoryColor === color ? 3 : 0,
                  borderColor: colors.text,
                }}
              />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <ActionButton
              title={editingId ? "Save category" : "Add category"}
              icon={editingId ? "checkmark" : "add"}
              onPress={() => void onSaveCategory()}
            />
          </View>
          {editingId ? (
            <ActionButton
              title="Cancel"
              secondary
              onPress={() => {
                setEditingId(null);
                setName("");
              }}
            />
          ) : null}
        </View>
      </Panel>
      <Panel>
        <SectionTitle title="Your data" />
        <Label>
          Everything stays on this device. Export a CSV copy or clear the local
          tracker.
        </Label>
        <ActionButton
          title={exporting ? "Preparing CSV..." : "Export transactions"}
          icon="download-outline"
          secondary
          onPress={() => void exportCsv()}
        />
        <Pressable
          onPress={onClearAll}
          accessibilityRole="button"
          style={{
            minHeight: 48,
            borderWidth: 1,
            borderColor: colors.red,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.red, fontWeight: "700" }}>
            Clear all data
          </Text>
        </Pressable>
      </Panel>
    </Screen>
  );
}
