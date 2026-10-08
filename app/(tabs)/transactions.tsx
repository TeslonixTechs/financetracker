import {
    CategoryIcon,
    ChoiceChips,
    EmptyState,
    Label,
    Panel,
    Screen,
    TransactionRow,
} from "@/components/finance-ui";
import { usePalette } from "@/hooks/usePalette";
import {
    useCategories,
    useFinanceStore,
    useTransactions,
} from "@/store/finance";
import type { TransactionType } from "@/types/finance";
import { Ionicons } from "@expo/vector-icons";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type TypeFilter = "all" | TransactionType;

export default function TransactionsScreen() {
  const router = useRouter();
  const colors = usePalette();
  const transactions = useTransactions();
  const categories = useCategories();
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);
  const refresh = useFinanceStore((state) => state.initialize);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const filtered = useMemo(
    () =>
      transactions
        .filter((item) => {
          const category = categories.find(
            (entry) => entry.id === item.categoryId,
          );
          const needle = query.trim().toLowerCase();
          if (
            needle &&
            !`${category?.name ?? ""} ${item.note}`
              .toLowerCase()
              .includes(needle)
          )
            return false;
          if (type !== "all" && item.type !== type) return false;
          if (categoryId !== "all" && item.categoryId !== categoryId)
            return false;
          if (fromDate) {
            const from = parseISO(fromDate);
            if (
              !Number.isNaN(from.valueOf()) &&
              new Date(item.date) < startOfDay(from)
            )
              return false;
          }
          if (toDate) {
            const to = parseISO(toDate);
            if (
              !Number.isNaN(to.valueOf()) &&
              new Date(item.date) > endOfDay(to)
            )
              return false;
          }
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [categories, categoryId, fromDate, query, toDate, transactions, type],
  );
  const groups = new Map<string, typeof filtered>();
  filtered.forEach((item) => {
    const key = format(new Date(item.date), "yyyy-MM-dd");
    const rows = groups.get(key) ?? [];
    rows.push(item);
    groups.set(key, rows);
  });
  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };
  const confirmDelete = (id: string) =>
    Alert.alert("Delete transaction?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );
          void deleteTransaction(id);
        },
      },
    ]);
  const deleteAction = (id: string) => (
    <Pressable
      onPress={() => confirmDelete(id)}
      accessibilityLabel="Delete transaction"
      style={{
        width: 76,
        marginVertical: 7,
        borderRadius: 12,
        backgroundColor: colors.red,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="trash-outline" size={21} color="#FFFFFF" />
      <Text style={{ color: "#FFFFFF", fontSize: 11, marginTop: 4 }}>
        Delete
      </Text>
    </Pressable>
  );
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={colors.accent}
        />
      }
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 13,
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes or categories"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search transactions"
            style={{ color: colors.text, flex: 1, height: 48 }}
          />
        </View>
        <Pressable
          onPress={() => router.push("/transaction")}
          accessibilityLabel="Add transaction"
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 13,
            backgroundColor: colors.accent,
          }}
        >
          <Ionicons name="add" size={27} color="#FFFFFF" />
        </Pressable>
      </View>
      <ChoiceChips
        values={["all", "income", "expense"] as const}
        value={type}
        onChange={setType}
        labels={{ all: "All types", income: "Income", expense: "Expense" }}
      />
      <View style={{ gap: 8 }}>
        <Label>Category</Label>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Pressable
            onPress={() => setCategoryId("all")}
            style={{
              padding: 8,
              borderWidth: 1,
              borderColor: categoryId === "all" ? colors.accent : colors.border,
              borderRadius: 12,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 12 }}>All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              accessibilityLabel={`Filter by ${category.name}`}
              style={{
                borderWidth: 1,
                borderColor:
                  categoryId === category.id ? colors.accent : "transparent",
                borderRadius: 20,
                padding: 2,
              }}
            >
              <CategoryIcon category={category} size={36} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Label>From (YYYY-MM-DD)</Label>
          <TextInput
            value={fromDate}
            onChangeText={setFromDate}
            placeholder="Any date"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Start date filter"
            style={{
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 11,
              height: 44,
              paddingHorizontal: 10,
              marginTop: 6,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Label>To (YYYY-MM-DD)</Label>
          <TextInput
            value={toDate}
            onChangeText={setToDate}
            placeholder="Any date"
            placeholderTextColor={colors.muted}
            accessibilityLabel="End date filter"
            style={{
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 11,
              height: 44,
              paddingHorizontal: 10,
              marginTop: 6,
            }}
          />
        </View>
      </View>
      {filtered.length ? (
        [...groups.entries()].map(([day, rows]) => (
          <View key={day} style={{ gap: 5 }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: 13,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {format(new Date(day), "EEEE, d MMMM")}
            </Text>
            <Panel style={{ gap: 0 }}>
              {rows.map((item) => (
                <Swipeable
                  key={item.id}
                  renderRightActions={() => deleteAction(item.id)}
                  overshootRight={false}
                >
                  <TransactionRow
                    transaction={item}
                    onPress={() =>
                      router.push({
                        pathname: "/transaction",
                        params: { id: item.id },
                      })
                    }
                  />
                </Swipeable>
              ))}
            </Panel>
          </View>
        ))
      ) : (
        <Panel>
          <EmptyState
            title="No transactions found"
            detail="Try another search or add a transaction."
          />
        </Panel>
      )}
    </Screen>
  );
}
