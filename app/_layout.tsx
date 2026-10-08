import { usePalette } from "@/hooks/usePalette";
import { useFinanceStore, usePreferences } from "@/store/finance";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const initialize = useFinanceStore((state) => state.initialize);
  const ready = useFinanceStore((state) => state.ready);
  const themeMode = usePreferences().theme;
  const system = useColorScheme();
  const dark =
    themeMode === "dark" || (themeMode === "system" && system === "dark");
  const colors = usePalette();
  useEffect(() => {
    void initialize();
  }, [initialize]);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <StatusBar style={dark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="transaction"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Transaction",
              headerBackTitle: "Back",
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
