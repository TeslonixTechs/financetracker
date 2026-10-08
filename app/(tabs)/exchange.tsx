import {
    ChoiceChips,
    Field,
    Label,
    Panel,
    Screen,
} from "@/components/finance-ui";
import { usePalette } from "@/hooks/usePalette";
import { usePreferences } from "@/store/finance";
import type { CurrencyCode } from "@/types/finance";
import { formatMoney } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const currencies: CurrencyCode[] = ["NGN", "USD", "GBP", "EUR"];
const symbols: Record<CurrencyCode, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

interface RatesResponse {
  result?: unknown;
  rates?: unknown;
  time_last_update_utc?: unknown;
}

export default function ExchangeScreen() {
  const colors = usePalette();
  const preferredCurrency = usePreferences().currency;
  const [base, setBase] = useState<CurrencyCode>(preferredCurrency);
  const [target, setTarget] = useState<CurrencyCode>(
    preferredCurrency === "NGN" ? "USD" : "NGN",
  );
  const [amount, setAmount] = useState("1");
  const [rates, setRates] = useState<Partial<Record<CurrencyCode, number>>>({});
  const [updated, setUpdated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const numericAmount = Number(amount.replace(/,/g, ""));
  const amountError =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? undefined
      : "Enter an amount greater than zero.";
  const rate = rates[target];
  const converted =
    Number.isFinite(numericAmount) && rate ? numericAmount * rate : 0;

  useEffect(() => {
    setBase(preferredCurrency);
  }, [preferredCurrency]);
  useEffect(() => {
    const controller = new AbortController();
    const loadRate = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `https://open.er-api.com/v6/latest/${base}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Rate service unavailable");
        const payload: unknown = await response.json();
        if (typeof payload !== "object" || payload === null)
          throw new Error("Invalid rate response");
        const result = payload as RatesResponse;
        if (
          result.result !== "success" ||
          typeof result.rates !== "object" ||
          result.rates === null
        )
          throw new Error("Rate service unavailable");
        const rateMap = result.rates as Record<string, unknown>;
        const nextRates: Partial<Record<CurrencyCode, number>> = {};
        for (const currency of currencies) {
          const value = rateMap[currency];
          if (typeof value === "number" && Number.isFinite(value))
            nextRates[currency] = value;
        }
        setRates(nextRates);
        setUpdated(
          typeof result.time_last_update_utc === "string"
            ? result.time_last_update_utc
            : "Updated just now",
        );
      } catch (caught) {
        if (caught instanceof Error && caught.name !== "AbortError")
          setError(
            "Live rates are unavailable. Check your connection and try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadRate();
    return () => controller.abort();
  }, [base, refreshKey]);

  const swap = () => {
    setBase(target);
    setTarget(base);
    void Haptics.selectionAsync();
  };
  const refresh = () => {
    setRates({});
    setRefreshKey((value) => value + 1);
  };
  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Label>GLOBAL CURRENCY TOOL</Label>
        <Text
          style={{
            color: colors.text,
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Exchange desk
        </Text>
        <Label style={{ marginTop: 5 }}>
          Indicative live rates. Your tracker balance is unchanged.
        </Label>
      </Animated.View>
      <Panel>
        <Field
          label="You send"
          value={amount}
          onChangeText={setAmount}
          placeholder="Amount"
          keyboardType="decimal-pad"
          error={amountError}
        />
        <ChoiceChips
          values={currencies}
          value={base}
          onChange={setBase}
          labels={Object.fromEntries(
            currencies.map((currency) => [
              currency,
              `${symbols[currency]} ${currency}`,
            ]),
          )}
        />
        <View style={{ alignItems: "center", marginVertical: 1 }}>
          <Pressable
            onPress={swap}
            accessibilityLabel="Swap currencies"
            accessibilityRole="button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="swap-vertical" size={23} color={colors.accent} />
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          <Label>You receive</Label>
          <ChoiceChips
            values={currencies}
            value={target}
            onChange={setTarget}
            labels={Object.fromEntries(
              currencies.map((currency) => [
                currency,
                `${symbols[currency]} ${currency}`,
              ]),
            )}
          />
        </View>
        {loading ? (
          <View style={{ alignItems: "center", padding: 14 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : error ? (
          <Text style={{ color: colors.red, fontSize: 13 }}>{error}</Text>
        ) : rate ? (
          <Animated.View
            key={`${base}-${target}-${amount}`}
            entering={FadeIn.duration(260)}
            style={{
              backgroundColor: colors.background,
              borderRadius: 14,
              padding: 16,
              gap: 6,
            }}
          >
            <Label>ESTIMATED TOTAL</Label>
            <Text
              style={{ color: colors.text, fontSize: 29, fontWeight: "800" }}
            >
              {formatMoney(converted, target)}
            </Text>
            <Label>
              1 {base} ={" "}
              {rate.toLocaleString(undefined, { maximumSignificantDigits: 6 })}{" "}
              {target}
            </Label>
          </Animated.View>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Label>
            {updated
              ? `Rate date: ${updated}`
              : "Rates provided by open.er-api.com"}
          </Label>
          <Pressable
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel="Refresh exchange rate"
            hitSlop={8}
          >
            <Ionicons name="refresh" size={19} color={colors.accent} />
          </Pressable>
        </View>
      </Panel>
      <Animated.View entering={FadeInDown.delay(120).duration(450)}>
        <Panel>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            A quick note
          </Text>
          <Label>
            Exchange rates move throughout the day. Confirm with your bank or
            provider before making a transfer.
          </Label>
        </Panel>
      </Animated.View>
    </Screen>
  );
}
