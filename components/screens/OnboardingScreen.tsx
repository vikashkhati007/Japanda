"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, SafeAreaView } from "react-native"
import { ArrowRight } from "lucide-react-native"
import { colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import { saveUserProfile, type CharacterType, type JlptLevel } from "../../lib/user-store"

const { width } = Dimensions.get("window")

interface OnboardingScreenProps {
  theme: "light" | "dark"
  onComplete: (character: CharacterType) => void
}

export default function OnboardingScreen({ theme, onComplete }: OnboardingScreenProps) {
  // Remove the state for currentStep since we'll only have one step now
  const [jlptLevel, setJlptLevel] = useState<JlptLevel>("N5")

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  // Run entrance animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Remove the handleNext function since we won't need to navigate between steps

  // Update the handleComplete function to directly complete onboarding without moving to profile setup
  const handleComplete = async () => {
    // Save user profile
    await saveUserProfile({
      name: "Test User", // Dummy name
      jlptLevel,
      selectedCharacter: "mira", // Only character option
      onboardingComplete: true,
      profileSetupComplete: true, // Mark profile setup as complete too
    })

    // Animate out before completing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Complete onboarding
      onComplete("mira")
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground theme={theme} />

      <Animated.View
        style={[
          styles.stepContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.welcomeCard, theme === "dark" && styles.welcomeCardDark]}>
          <Text style={[styles.welcomeTitle, theme === "dark" && styles.textDark]}>Welcome to Japanese Learning</Text>
          <Text style={[styles.welcomeDescription, theme === "dark" && styles.textSecondaryDark]}>
            Your personal Japanese language learning companion with daily words, grammar, and AI assistance.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, theme === "dark" && styles.actionButtonDark]}
          onPress={handleComplete}
        >
          <Text style={styles.actionButtonText}>Get Started</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  welcomeCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  welcomeCardDark: {
    backgroundColor: "rgba(30, 30, 30, 0.9)",
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 28,
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 500,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  formCardDark: {
    backgroundColor: "rgba(30, 30, 30, 0.9)",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
    width: "100%",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  textInputDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: colors.darkText,
  },
  textInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  levelContainer: {
    width: "100%",
  },
  levelOptionsContainer: {
    marginTop: 8,
  },
  levelOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  levelOptionDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  levelOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  levelDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    width: "100%",
    maxWidth: 500,
  },
  actionButtonDark: {
    backgroundColor: colors.primaryDark,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  textDark: {
    color: colors.darkText,
  },
  textSecondaryDark: {
    color: colors.darkTextSecondary,
  },
})
