import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { appColors, appRadius } from "../constants/theme";

type AppButtonVariant = "primary" | "secondary" | "danger";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "primary" && styles.primaryButton,
        variant === "secondary" && styles.secondaryButton,
        variant === "danger" && styles.dangerButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor(variant)} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "primary" && styles.primaryButtonText,
            variant === "secondary" && styles.secondaryButtonText,
            variant === "danger" && styles.dangerButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getTextColor(variant: AppButtonVariant) {
  if (variant === "primary") return appColors.primaryText;
  return appColors.text;
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: appRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: appColors.primary,
  },
  secondaryButton: {
    backgroundColor: appColors.cardSoft,
  },
  dangerButton: {
    backgroundColor: "#7f1d1d",
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "900",
  },
  primaryButtonText: {
    color: appColors.primaryText,
  },
  secondaryButtonText: {
    color: appColors.text,
  },
  dangerButtonText: {
    color: appColors.text,
  },
});