import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type AnalysisLoadingProps = {
  title: string;
  description?: string;
};

export function AnalysisLoading({ title, description }: AnalysisLoadingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#facc15" />

        <Text style={styles.title}>{title}</Text>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#1f2937",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },
  description: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center",
  },
});