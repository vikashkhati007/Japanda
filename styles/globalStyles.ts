import { StyleSheet } from "react-native"

// Modern gradient-friendly color palette
const colorsPalette = {
  // Gradient colors
  gradientStart: "#FFB6E1", // Soft pink
  gradientMiddle: "#C5E8FF", // Light blue
  gradientEnd: "#B6EAFF", // Cyan blue

  // Primary colors
  primary: "#FF5FA2", // Vibrant pink
  primaryLight: "#FF8DC0",
  primaryDark: "#E0457F",

  // Accent colors
  accent: "#2B95FF", // Bright blue
  accentLight: "#5EADFF",
  accentDark: "#0A7AE9",

  // Secondary colors
  secondary: "#00D0D9", // Teal
  secondaryLight: "#40E0E7",
  secondaryDark: "#00B1B9",

  // Tertiary colors
  tertiary: "#A259FF", // Purple
  tertiaryLight: "#BE85FF",
  tertiaryDark: "#8A3FE0",

  // Neutral colors
  background: "#FFFFFF",
  card: "rgba(255, 255, 255, 0.65)", // Semi-transparent for glass effect
  cardBorder: "rgba(255, 255, 255, 0.8)",
  text: "#1A1A1A",
  textSecondary: "#4A4A4A",
  textTertiary: "#767676",

  // Functional colors
  success: "#4CAF84",
  warning: "#F9A826",
  error: "#FF4D6A",
  info: "#2B95FF",

  // Dark mode colors
  darkBackground: "#121212",
  darkCard: "rgba(40, 40, 40, 0.75)", // Semi-transparent for glass effect
  darkCardBorder: "rgba(60, 60, 60, 0.8)",
  darkText: "#FFFFFF",
  darkTextSecondary: "#DADADA",
  darkTextTertiary: "#A0A0A0",

  // Glass effect shadow
  glassShadow: "rgba(0, 0, 0, 0.05)",
}

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorsPalette.background,
  },
  darkBackground: {
    backgroundColor: colorsPalette.darkBackground,
  },
  glassCard: {
    backgroundColor: colorsPalette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorsPalette.cardBorder,
    shadowColor: colorsPalette.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    padding: 16,
    marginBottom: 16,
  },
  darkGlassCard: {
    backgroundColor: colorsPalette.darkCard,
    borderColor: colorsPalette.darkCardBorder,
  },
  darkText: {
    color: colorsPalette.darkText,
  },
  darkTag: {
    backgroundColor: colorsPalette.darkCard,
  },
  darkSearchBar: {
    backgroundColor: "rgba(40, 40, 40, 0.6)",
  },
  darkButton: {
    backgroundColor: colorsPalette.primaryDark,
  },
  darkButtonText: {
    color: colorsPalette.darkText,
  },
  darkTabBar: {
    borderTopColor: "rgba(60, 60, 60, 0.5)",
    backgroundColor: "rgba(18, 18, 18, 0.95)",
  },
  darkHeader: {
    borderBottomColor: "rgba(60, 60, 60, 0.5)",
    backgroundColor: "rgba(18, 18, 18, 0.95)",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230, 230, 230, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colorsPalette.text,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 230, 230, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingBottom: 4,
    paddingTop: 8,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: colorsPalette.primary,
  },
  tabText: {
    fontSize: 12,
    color: colorsPalette.textTertiary,
    marginTop: 4,
    fontWeight: "500",
  },
  activeTabText: {
    color: colorsPalette.primary,
    fontWeight: "600",
  },
  wordCard: {
    backgroundColor: colorsPalette.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colorsPalette.cardBorder,
    shadowColor: colorsPalette.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  kanjiText: {
    fontSize: 28,
    fontWeight: "700",
    color: colorsPalette.text,
    letterSpacing: 0.5,
    flex: 1, // Add flex to allow text to shrink
  },
  hiraganaText: {
    fontSize: 18,
    color: colorsPalette.textSecondary,
    marginBottom: 4,
  },
  romajiText: {
    fontSize: 16,
    color: colorsPalette.textTertiary,
    marginBottom: 10,
    fontStyle: "italic",
  },
  meaningText: {
    fontSize: 16,
    color: colorsPalette.text,
    lineHeight: 22,
  },
  wordListContent: {
    gap: 16,
    padding: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colorsPalette.primaryLight,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: colorsPalette.background,
    fontSize: 12,
    fontWeight: "600",
  },
  // Level badges
  n5Badge: {
    backgroundColor: colorsPalette.success,
  },
  n4Badge: {
    backgroundColor: colorsPalette.info,
  },
  n3Badge: {
    backgroundColor: colorsPalette.primary,
  },
  n2Badge: {
    backgroundColor: colorsPalette.warning,
  },
  n1Badge: {
    backgroundColor: colorsPalette.error,
  },
  // Input styles
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: colorsPalette.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colorsPalette.text,
  },
  inputDark: {
    backgroundColor: "rgba(40, 40, 40, 0.6)",
    borderColor: colorsPalette.darkCardBorder,
    color: colorsPalette.darkText,
  },
  // Button styles
  button: {
    backgroundColor: colorsPalette.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  buttonSecondaryText: {
    color: colorsPalette.text,
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colorsPalette.text,
    marginLeft: 8,
  },
  // Icon circle
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  // Gradient background
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
})

export const colors = colorsPalette

