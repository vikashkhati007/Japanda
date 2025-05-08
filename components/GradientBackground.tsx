import type React from "react"
import { View, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "../styles/globalStyles"
import { CHARACTER_DATA } from "../lib/user-store"

interface GradientBackgroundProps {
  theme: "light" | "dark"
  character?: "mira" | "jun"
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ theme, character = "mira" }) => {
  // Get character-specific colors if available
  const characterColors = character ? CHARACTER_DATA[character].themeColors : null

  if (theme === "dark") {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={
            character === "jun"
              ? ["#0A1A33", "#0A1A33", "#001A33"] // Blue dark theme for Jun
              : ["#1E0033", "#0A1A33", "#001A33"]
          } // Purple dark theme for Mira
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          character === "jun"
            ? ["#DBEAFE", "#93C5FD", "#BFDBFE"] // Blue light theme for Jun
            : [colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]
        } // Pink light theme for Mira
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
})

export default GradientBackground

