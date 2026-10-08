import { usePalette } from "@/hooks/usePalette";
import { useCategories, usePreferences } from "@/store/finance";
import type { Category, Transaction } from "@/types/finance";
import { formatMoney } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isYesterday } from "date-fns";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native";

export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const colors = usePalette();
  return scroll ? (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}
export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = usePalette();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionText, { color: colors.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={{ color: colors.accent, fontWeight: "700" }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = usePalette();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const colors = usePalette();
  return (
    <Text style={[{ color: colors.muted, fontSize: 13 }, style]}>
      {children}
    </Text>
  );
}
export function ActionButton({
  title,
  onPress,
  icon,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  secondary?: boolean;
}) {
  const colors = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: secondary ? colors.surface : colors.accent,
          borderColor: colors.accent,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          color={secondary ? colors.accent : "#FFFFFF"}
          size={18}
        />
      ) : null}
      <Text
        style={{
          color: secondary ? colors.accent : "#FFFFFF",
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function CategoryIcon({
  category,
  size = 40,
}: {
  category?: Category;
  size?: number;
}) {
  const colors = usePalette();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: category?.color ?? colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={
          (category?.icon as keyof typeof Ionicons.glyphMap) ??
          "help-circle-outline"
        }
        color="#FFFFFF"
        size={size * 0.48}
      />
    </View>
  );
}
export function TransactionRow({
  transaction,
  onPress,
  right,
}: {
  transaction: Transaction;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const colors = usePalette();
  const categories = useCategories();
  const currency = usePreferences().currency;
  const category = categories.find(
    (item) => item.id === transaction.categoryId,
  );
  const date = new Date(transaction.date);
  const dateText = isToday(date)
    ? "Today"
    : isYesterday(date)
      ? "Yesterday"
      : format(date, "d MMM");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={[styles.transactionRow, { borderBottomColor: colors.border }]}
    >
      <CategoryIcon category={category} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          {category?.name ?? "Category removed"}
        </Text>
        <Label>
          {transaction.note || dateText} ·{" "}
          {transaction.note ? dateText : format(date, "h:mm a")}
        </Label>
      </View>
      <Text
        style={{
          color: transaction.type === "income" ? colors.green : colors.text,
          fontWeight: "700",
        }}
      >
        {transaction.type === "income" ? "+" : "−"}
        {formatMoney(transaction.amount, currency)}
      </Text>
      {right}
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  error,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  error?: string;
  multiline?: boolean;
}) {
  const colors = usePalette();
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.red : colors.border,
            backgroundColor: colors.surface,
          },
          multiline && { height: 92, textAlignVertical: "top" },
        ]}
      />
      {error ? (
        <Text style={{ color: colors.red, fontSize: 12 }}>{error}</Text>
      ) : null}
    </View>
  );
}
export function ChoiceChips<T extends string>({
  values,
  value,
  onChange,
  labels,
}: {
  values: T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  const colors = usePalette();
  return (
    <View style={styles.chips}>
      {values.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item }}
          style={[
            styles.chip,
            {
              backgroundColor: value === item ? colors.accent : colors.surface,
              borderColor: value === item ? colors.accent : colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: value === item ? "#FFFFFF" : colors.text,
              fontWeight: "600",
            }}
          >
            {labels?.[item] ?? item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  const colors = usePalette();
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={36} color={colors.muted} />
      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
        {title}
      </Text>
      <Label>{detail}</Label>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  panel: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  sectionText: { fontSize: 17, fontWeight: "700" },
  action: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    minHeight: 48,
    fontSize: 15,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  empty: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 22,
  },
});
