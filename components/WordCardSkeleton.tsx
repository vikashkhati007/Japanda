import type React from "react"
import { View, StyleSheet } from "react-native"
import { globalStyles, colors } from "../styles/globalStyles"
import SkeletonLoader from "./SkeletonLoader"

interface WordCardSkeletonProps {
  type?: "large" | "small"
  theme?: "light" | "dark"
  cardType?: string
}

const WordCardSkeleton: React.FC<WordCardSkeletonProps> = ({
  type = "large",
  theme = "light",
  cardType = "default",
}) => {
  if (type === "small") {
    return (
      <View
        style={[
          globalStyles.glassCard,
          theme === "dark" && globalStyles.darkGlassCard,
          styles.smallWordCard,
          getCardTypeStyle(cardType),
        ]}
      >
        <SkeletonLoader width="80%" height={24} borderRadius={4} theme={theme} style={styles.kanjiSkeleton} />
        <SkeletonLoader width="100%" height={36} borderRadius={4} theme={theme} style={styles.meaningSkeleton} />
        <SkeletonLoader width={60} height={16} borderRadius={10} theme={theme} style={styles.tagSkeleton} />
      </View>
    )
  }

  return (
    <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard]}>
      <View style={styles.wordCardHeader}>
        <SkeletonLoader width={120} height={20} borderRadius={4} theme={theme} />
        <SkeletonLoader width={36} height={36} borderRadius={18} theme={theme} />
      </View>

      <SkeletonLoader width="70%" height={32} borderRadius={4} theme={theme} style={styles.kanjiSkeleton} />
      <SkeletonLoader width="50%" height={16} borderRadius={4} theme={theme} style={styles.romajiSkeleton} />
      <SkeletonLoader width="90%" height={18} borderRadius={4} theme={theme} style={styles.meaningSkeleton} />

      <View style={[styles.exampleSkeleton, theme === "dark" && styles.darkExampleSkeleton]}>
        <SkeletonLoader width="100%" height={16} borderRadius={4} theme={theme} style={styles.exampleLineSkeleton} />
        <SkeletonLoader width="90%" height={16} borderRadius={4} theme={theme} style={styles.exampleLineSkeleton} />
        <SkeletonLoader width="60%" height={16} borderRadius={4} theme={theme} />
      </View>
    </View>
  )
}

const getCardTypeStyle = (cardType: string) => {
  const styles = {
    default: { borderTopColor: colors.primary },
    grammar: { borderTopColor: colors.info },
    study: { borderTopColor: colors.secondary },
    popular: { borderTopColor: colors.tertiary },
    travel: { borderTopColor: "#4CAF50" },
    food: { borderTopColor: "#FF9800" },
    technology: { borderTopColor: "#2196F3" },
    emotions: { borderTopColor: "#9C27B0" },
  }

  return styles[cardType] || styles.default
}

const styles = StyleSheet.create({
  wordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  kanjiSkeleton: {
    marginBottom: 8,
  },
  romajiSkeleton: {
    marginBottom: 8,
  },
  meaningSkeleton: {
    marginBottom: 12,
  },
  exampleSkeleton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  darkExampleSkeleton: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderLeftColor: colors.accentDark,
  },
  exampleLineSkeleton: {
    marginBottom: 8,
  },
  smallWordCard: {
    height: 120,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  tagSkeleton: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
})

export default WordCardSkeleton

