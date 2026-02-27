import { Platform, TextStyle, ViewStyle } from "react-native";

export const APP_BACKGROUND = "#f9f4f2";
export const APP_TEXT = "#151515";

// Logo accent colours (purple → pink gradient)
export const ACCENT_PURPLE = "#7366F6";
export const ACCENT_PINK = "#F472B6";

export const palette = {
  background: "#f9f4f2",
  text: "#151515",
  textSoft: "rgba(21, 21, 21, 0.72)",
  textMuted: "rgba(21, 21, 21, 0.45)",
  line: "rgba(21, 21, 21, 0.12)",
  lineStrong: "rgba(21, 21, 21, 0.22)",
  glass: "rgba(255, 255, 255, 0.55)",
  glassStrong: "rgba(255, 255, 255, 0.75)",
  glassDark: "rgba(21, 21, 21, 0.05)",
  danger: "#e53e3e",
  success: "#38a169",
  accent: ACCENT_PURPLE,
  accentPink: ACCENT_PINK,
};

export const fonts = {
  regular: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  medium: Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    default: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  bold: Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    default: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
};

export const typeStyles: Record<string, TextStyle> = {
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: palette.text,
    letterSpacing: -0.7,
    fontFamily: fonts.bold,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    letterSpacing: -0.35,
    fontFamily: fonts.bold,
  },
  body: {
    fontSize: 15,
    fontWeight: "500",
    color: palette.textSoft,
    fontFamily: fonts.regular,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: fonts.medium,
  },
};

export const glass = {
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.glass,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
    overflow: "hidden",
  } as ViewStyle,
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.glassStrong,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  } as ViewStyle,
};

export function safeIconName(icon?: string): string {
  if (!icon) return "list-ul";
  const isEmoji =
    /\p{Emoji_Presentation}/u.test(icon) ||
    (icon.length <= 2 && /\p{Emoji}/u.test(icon));
  return isEmoji ? "list-ul" : icon;
}

export function friendlyError(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: string }).message;
    return message || "Something went wrong.";
  }
  return "Something went wrong.";
}

export function getFirstName(user?: {
  user_metadata?: { full_name?: string; name?: string; given_name?: string };
} | null): string {
  const fullName = user?.user_metadata?.full_name?.trim();
  if (fullName) return fullName.split(/\s+/)[0];

  const name = user?.user_metadata?.name?.trim();
  if (name) return name.split(/\s+/)[0];

  const givenName = user?.user_metadata?.given_name?.trim();
  if (givenName) return givenName.split(/\s+/)[0];

  return "Job";
}
