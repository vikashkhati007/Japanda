"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { ArrowRight, User, BookOpen } from "lucide-react-native"
import { colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import { type JlptLevel, saveUserProfile } from "../../lib/user-store"

interface ProfileSetupScreenProps {
  theme: "light" | "dark"
  onComplete: () => void
}

export default function ProfileSetupScreen({ theme, onComplete }: ProfileSetupScreenProps) {
  const [name, setName] = useState("")
  const [jlptLevel, setJlptLevel] = useState<JlptLevel>("N5")
  const [nameError, setNameError] = useState("")

  const handleContinue = async () => {
    if (!name.trim()) {
      setNameError("Please enter your name")
      return
    }

    await saveUserProfile({
      name: name.trim(),
      jlptLevel,
      profileSetupComplete: true,
    })

    onComplete()
  }

  const renderJlptLevelOption = (level: JlptLevel, description: string, color: string) => {
    const isSelected = jlptLevel === level

    return (
      <TouchableOpacity
        style={[
          styles.jlptOption,
          theme === "dark" && styles.jlptOptionDark,
          isSelected && styles.jlptOptionSelected,
          isSelected && { borderColor: color },
        ]}
        onPress={() => setJlptLevel(level)}
      >
        <View style={[styles.jlptBadge, { backgroundColor: color }]}>
          <Text style={styles.jlptBadgeText}>{level}</Text>
        </View>
        <View style={styles.jlptContent}>
          <Text style={[styles.jlptLabel, theme === "dark" && styles.textDark, isSelected && { fontWeight: "700" }]}>
            {level} Level
          </Text>
          <Text style={[styles.jlptDescription, theme === "dark" && styles.textSecondaryDark]}>{description}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
    >
      <GradientBackground theme={theme} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, theme === "dark" && styles.textDark]}>Create Your Profile</Text>
          <Text style={[styles.subtitle, theme === "dark" && styles.textSecondaryDark]}>
            Tell us a bit about yourself so we can personalize your learning experience
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, theme === "dark" && styles.textDark]}>What's your name?</Text>

          <View
            style={[
              styles.inputContainer,
              theme === "dark" && styles.inputContainerDark,
              nameError ? styles.inputError : {},
            ]}
          >
            <User size={20} color={theme === "dark" ? colors.darkTextSecondary : colors.textSecondary} />
            <TextInput
              style={[styles.input, theme === "dark" && styles.inputDark]}
              placeholder="Enter your name"
              placeholderTextColor={theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
              value={name}
              onChangeText={(text) => {
                setName(text)
                if (text.trim()) setNameError("")
              }}
            />
          </View>

          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <Text style={[styles.label, theme === "dark" && styles.textDark, styles.jlptSectionLabel]}>
            Select your Japanese level
          </Text>

          <View style={styles.jlptDescription}>
            <BookOpen size={20} color={theme === "dark" ? colors.darkTextSecondary : colors.textSecondary} />
            <Text style={[styles.jlptDescriptionText, theme === "dark" && styles.textSecondaryDark]}>
              This helps us show you appropriate content for your level
            </Text>
          </View>

          <View style={styles.jlptOptions}>
            {renderJlptLevelOption("N5", "Beginner - Basic vocabulary & grammar", colors.success)}
            {renderJlptLevelOption("N4", "Elementary - Common expressions", colors.info)}
            {renderJlptLevelOption("N3", "Intermediate - Everyday conversations", colors.primary)}
            {renderJlptLevelOption("N2", "Upper Intermediate - Most contexts", colors.warning)}
            {renderJlptLevelOption("N1", "Advanced - Complex Japanese", colors.error)}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, theme === "dark" && styles.continueButtonDark]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={[styles.note, theme === "dark" && styles.textSecondaryDark]}>
          You can edit your profile later in settings
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: "80%",
  },
  formContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  jlptSectionLabel: {
    marginTop: 24,
    marginBottom: 8,
  },
  jlptDescription: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 12,
  },
  jlptDescriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  inputContainerDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
  },
  inputDark: {
    color: colors.darkText,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  jlptOptions: {
    gap: 12,
  },
  jlptOption: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  jlptOptionDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  jlptOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  jlptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  jlptBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  jlptContent: {
    flex: 1,
  },
  jlptLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  jlptDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  continueButtonDark: {
    backgroundColor: colors.primaryDark,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  note: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  textDark: {
    color: colors.darkText,
  },
  textSecondaryDark: {
    color: colors.darkTextSecondary,
  },
})
