"use client"

import { useState } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from "react-native"
import { ArrowRight, Check } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import { type CharacterType, CHARACTER_DATA, saveUserProfile } from "../../lib/user-store"

const { width } = Dimensions.get("window")

interface CharacterSelectionScreenProps {
  theme: "light" | "dark"
  onComplete: (character: CharacterType) => void
}

export default function CharacterSelectionScreen({ theme, onComplete }: CharacterSelectionScreenProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>("mira")

  const handleContinue = async () => {
    await saveUserProfile({ selectedCharacter })
    onComplete(selectedCharacter)
  }

  // Update the CharacterSelectionScreen to show different colors for each character
  const renderCharacterCard = (character: CharacterType) => {
    const isSelected = selectedCharacter === character
    const characterData = CHARACTER_DATA[character]

    return (
      <TouchableOpacity
        style={[
          styles.characterCard,
          theme === "dark" && styles.characterCardDark,
          isSelected && styles.selectedCard,
          isSelected && theme === "dark" && styles.selectedCardDark,
        ]}
        onPress={() => setSelectedCharacter(character)}
        activeOpacity={0.8}
      >
        <View style={styles.characterImageContainer}>
          <LinearGradient
            colors={
              character === "mira"
                ? [colors.primary, colors.accent]
                : [characterData.themeColors.primary, characterData.themeColors.accent]
            }
            style={styles.characterImageBackground}
          />
          <Image source={characterData.images.happy} style={styles.characterImage} />
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: characterData.themeColors.primary }]}>
              <Check size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={[styles.characterName, theme === "dark" && styles.textDark]}>{characterData.name}</Text>

        <Text style={[styles.characterDescription, theme === "dark" && styles.textSecondaryDark]}>
          {characterData.description}
        </Text>

        <View style={styles.characterTraits}>
          <View
            style={[
              styles.characterTrait,
              character === "mira" ? styles.traitPink : styles.traitBlue,
              theme === "dark" && styles.traitDark,
            ]}
          >
            <Text style={styles.traitText}>{character === "mira" ? "Energetic" : "Calm"}</Text>
          </View>

          <View
            style={[
              styles.characterTrait,
              character === "mira" ? styles.traitBlue : styles.traitGreen,
              theme === "dark" && styles.traitDark,
            ]}
          >
            <Text style={styles.traitText}>{character === "mira" ? "Friendly" : "Knowledgeable"}</Text>
          </View>
        </View>

        <View style={[styles.previewBubble, theme === "dark" && styles.previewBubbleDark]}>
          <Text style={[styles.previewJapanese, theme === "dark" && styles.textDark]}>
            {character === "mira" ? "やっほー！ミラだよ😊" : "よう！ジュンだ👋"}
          </Text>
          <Text style={[styles.previewEnglish, theme === "dark" && styles.textSecondaryDark]}>
            {character === "mira" ? "Hey there! I'm Mira!" : "Hey! I'm Jun!"}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <GradientBackground theme={theme} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, theme === "dark" && styles.textDark]}>Choose Your Assistant</Text>
          <Text style={[styles.subtitle, theme === "dark" && styles.textSecondaryDark]}>
            Select who will help you learn Japanese
          </Text>
        </View>

        <View style={styles.charactersContainer}>
          {renderCharacterCard("mira")}
          {renderCharacterCard("jun")}
        </View>

        {/* Update the continue button to use the selected character's color */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            theme === "dark" && styles.continueButtonDark,
            { backgroundColor: CHARACTER_DATA[selectedCharacter].themeColors.primary },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={[styles.note, theme === "dark" && styles.textSecondaryDark]}>
          You can change your assistant later in settings
        </Text>
      </ScrollView>
    </View>
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
  charactersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  characterCard: {
    width: (width - 64) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Increased opacity
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.2)", // Increased shadow opacity
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, // Increased shadow opacity
    shadowRadius: 8,
    elevation: 8, // Increased elevation
    borderWidth: 2,
    borderColor: "transparent",
  },
  characterCardDark: {
    backgroundColor: "rgba(40, 40, 40, 0.95)", // Increased opacity
  },
  previewBubble: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Increased opacity
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  previewBubbleDark: {
    backgroundColor: "rgba(40, 40, 40, 0.9)", // Increased opacity
  },
  characterTrait: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Increased opacity
  },
  traitDark: {
    backgroundColor: "rgba(255, 255, 255, 0.25)", // Increased opacity
  },
  traitPink: {
    backgroundColor: `${colors.primary}30`,
  },
  traitBlue: {
    backgroundColor: `${colors.accent}30`,
  },
  traitPurple: {
    backgroundColor: `${colors.tertiary}30`,
  },
  traitGreen: {
    backgroundColor: `${colors.secondary}30`,
  },
  traitText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  previewBubble: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  previewBubbleDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  previewJapanese: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  previewEnglish: {
    fontSize: 12,
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

