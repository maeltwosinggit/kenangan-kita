import { Text, View } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Kenangan Kita Mobile</Text>
      <Text style={{ marginTop: 10, textAlign: "center" }}>
        Expo scaffold ready. Shared logic from packages/lib will be wired in upcoming phases.
      </Text>
    </View>
  );
}

