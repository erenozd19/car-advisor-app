/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, Nativewind, Tamagui, Unistyles, etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const appColors = {
  background: "#111827",
  card: "#1f2937",
  cardSoft: "#374151",
  border: "#374151",

  text: "#ffffff",
  mutedText: "#d1d5db",
  softText: "#9ca3af",
  placeholder: "#6b7280",

  primary: "#facc15",
  primarySoft: "#fde68a",
  primaryText: "#111827",

  blueCard: "#312e81",
  blueBorder: "#4f46e5",
  blueText: "#c7d2fe",

  warningCard: "#292524",
  warningBorder: "#57534e",
  warningText: "#e7e5e4",

  overlay: "rgba(0,0,0,0.55)",
};

export const appRadius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  modal: 24,
  full: 999,
};

export const appSpacing = {
  page: 20,
  card: 16,
  section: 18,
};