import { usePalette } from "@/hooks/usePalette";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const tabIcons = {
  index: "grid-outline",
  transactions: "swap-horizontal-outline",
  budgets: "pie-chart-outline",
  settings: "settings-outline",
  exchange: "cash-outline",
} as const;

export default function TabLayout() {
  const colors = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: "800", fontSize: 21 },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.index} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.transactions} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.budgets} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.settings} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: "Exchange",
          tabBarLabel: "Exchange",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.exchange} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
