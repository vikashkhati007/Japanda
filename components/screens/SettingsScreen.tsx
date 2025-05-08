"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Switch, ScrollView, Modal, ActivityIndicator, Alert } from "react-native"
import {
  Sun,
  Moon,
  Globe,
  Info,
  Palette,
  ChevronRight,
  Bell,
  Lock,
  HelpCircle,
  Mail,
  MessageSquare,
  AlertTriangle,
  Code,
} from "lucide-react-native"
import { StyleSheet } from "react-native"
import { globalStyles, colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import {
  type CharacterType,
  getUserProfile,
  saveUserProfile,
  type JlptLevel,
  getAutoPlayPronunciation,
  saveAutoPlayPronunciation,
} from "../../lib/user-store"
import EditProfileScreen from "./EditProfileScreen"
import { DeviceEventEmitter } from "react-native"

interface SettingsScreenProps {
  theme: "light" | "dark"
  toggleTheme: () => void
  assistantEnabled: boolean
  setAssistantEnabled: (enabled: boolean) => void
  onCharacterChange?: (character: CharacterType) => void
}

export default function SettingsScreen({
  theme,
  toggleTheme,
  assistantEnabled,
  setAssistantEnabled,
  onCharacterChange,
}: SettingsScreenProps) {
  const [interfaceLanguage, setInterfaceLanguage] = useState("English")
  const [autoPlayPronunciation, setAutoPlayPronunciation] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>("mira")
  const [userName, setUserName] = useState("")
  const [userGender, setUserGender] = useState("")
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showCharacterSelection, setShowCharacterSelection] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [userJlptLevel, setUserJlptLevel] = useState<JlptLevel>("N5")
  const [showOnboardingEnabled, setShowOnboardingEnabled] = useState(false)

  // Load settings from AsyncStorage
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsProfileLoading(true)
    try {
      const autoPlay = await getAutoPlayPronunciation()
      setAutoPlayPronunciation(autoPlay)

      // Keep the rest of the function as is
      const storedAssistantEnabled = await AsyncStorage.getItem("assistantEnabled")
      if (storedAssistantEnabled !== null) {
        setAssistantEnabled(JSON.parse(storedAssistantEnabled))
      }

      // Load user profile
      const profile = await getUserProfile()
      setSelectedCharacter(profile.selectedCharacter)
      setUserName(profile.name)
      setUserJlptLevel(profile.jlptLevel || "N5")

      const storedShowOnboarding = await AsyncStorage.getItem("showOnboardingEnabled")
      if (storedShowOnboarding !== null) {
        setShowOnboardingEnabled(JSON.parse(storedShowOnboarding))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsProfileLoading(false)
    }
  }

  const toggleAutoPlay = async () => {
    const newValue = !autoPlayPronunciation
    setAutoPlayPronunciation(newValue)
    try {
      await saveAutoPlayPronunciation(newValue)
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  const toggleAssistant = async () => {
    const newValue = !assistantEnabled
    setAssistantEnabled(newValue)
    try {
      await AsyncStorage.setItem("assistantEnabled", JSON.stringify(newValue))
    } catch (error) {
      console.error("Error saving assistant setting:", error)
    }
  }

  const toggleShowOnboarding = async () => {
    const newValue = !showOnboardingEnabled
    setShowOnboardingEnabled(newValue)
    try {
      await AsyncStorage.setItem("showOnboardingEnabled", JSON.stringify(newValue))

      // If enabling, show a confirmation alert
      if (newValue) {
        Alert.alert(
          "Developer Mode",
          "Onboarding screen will appear on next app restart. This setting is for testing only.",
          [{ text: "OK" }],
        )
      }
    } catch (error) {
      console.error("Error saving onboarding setting:", error)
    }
  }

  const changeCharacter = async (character: CharacterType) => {
    setSelectedCharacter(character)
    await saveUserProfile({ selectedCharacter: character })
    setShowCharacterSelection(false)

    // Call the onCharacterChange callback if provided
    if (onCharacterChange) {
      onCharacterChange(character)
    }

    // Dispatch a global event for immediate UI updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("character-changed", { detail: character }))
    }
  }

  const renderSettingItem = (
    icon: React.ReactNode,
    label: string,
    rightContent: React.ReactNode,
    onPress?: () => void,
    isLast = false,
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, theme === "dark" && styles.settingItemDark, isLast && styles.settingItemLast]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        {icon}
        <Text style={[styles.settingLabel, theme === "dark" && globalStyles.darkText]}>{label}</Text>
      </View>
      {rightContent}
    </TouchableOpacity>
  )

  // Update the handleJlptLevelChange function to refresh home screen data
  const handleJlptLevelChange = async (level: JlptLevel) => {
    try {
      await saveUserProfile({ jlptLevel: level })
      setUserJlptLevel(level)

      // Only use DeviceEventEmitter for React Native
      DeviceEventEmitter.emit("JLPT_LEVEL_CHANGED_EVENT", level)

      // Clear the home screen cache to force a refresh with the new JLPT level
      await AsyncStorage.removeItem("cachedHomeScreenData")
      await AsyncStorage.removeItem("dailyWords")

      Alert.alert("Success", "Your JLPT level has been updated. Home screen will refresh with new content.")
    } catch (error) {
      console.error("Error saving JLPT level:", error)
      Alert.alert("Error", "Failed to update JLPT level")
    }
  }

  const getLevelColor = (level: JlptLevel): string => {
    const levelColors = {
      N1: colors.error,
      N2: colors.warning,
      N3: colors.primary,
      N4: colors.info,
      N5: colors.success,
    }
    return levelColors[level] || colors.primary
  }

  const getLevelDescription = (level: JlptLevel): string => {
    switch (level) {
      case "N1":
        return "Advanced - Most difficult"
      case "N2":
        return "Upper Intermediate"
      case "N3":
        return "Intermediate"
      case "N4":
        return "Elementary"
      case "N5":
        return "Beginner - Most basic"
      default:
        return ""
    }
  }

  // Remove the duplicate JLPT level section from the SettingsScreen
  // We'll keep only the dedicated JLPT level section with the level options

  // Replace the entire component content with a cleaner version that has only one JLPT level selector

  return (
    <View style={styles.container}>
      <GradientBackground theme={theme} />

      <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.profileCard]}>
          {isProfileLoading ? (
            <View style={styles.profileLoadingContainer}>
              <ActivityIndicator size="small" color={theme === "dark" ? colors.darkText : colors.primary} />
              <Text style={[styles.profileLoadingText, theme === "dark" && globalStyles.darkText]}>
                Loading profile...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                  <LinearGradient colors={[colors.primary, colors.accent]} style={styles.profileImageGradient}>
                    <Text style={styles.profileInitials}>{userName ? userName.charAt(0).toUpperCase() : "?"}</Text>
                  </LinearGradient>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, theme === "dark" && globalStyles.darkText]}>
                    {userName || "Set Your Name"}
                  </Text>
                  <Text style={[styles.profileEmail, theme === "dark" && globalStyles.darkText]}>
                    JLPT Level: {userJlptLevel}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editProfileButton} onPress={() => setShowEditProfile(true)}>
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Assistant Section */}
        <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.settingsSection]}>
          <View style={styles.settingSectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tertiary }]}>
              <MessageSquare size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>AI Assistant</Text>
          </View>

          {renderSettingItem(
            <Bell size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Enable Assistant",
            <View style={styles.switchContainer}>
              <Switch
                trackColor={{ false: colors.cardBorder, true: colors.primaryLight }}
                thumbColor={colors.background}
                ios_backgroundColor={colors.cardBorder}
                value={assistantEnabled}
                onValueChange={toggleAssistant}
              />
            </View>,
            toggleAssistant,
          )}
        </View>

        {/* Developer Options Section */}
        {/* <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.settingsSection]}>
          <View style={styles.settingSectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.error }]}>
              <AlertTriangle size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>
              Developer Options
            </Text>
          </View>

          {renderSettingItem(
            <Code size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Show Onboarding Screen",
            <View style={styles.switchContainer}>
              <Switch
                trackColor={{ false: colors.cardBorder, true: colors.primaryLight }}
                thumbColor={colors.background}
                ios_backgroundColor={colors.cardBorder}
                value={showOnboardingEnabled}
                onValueChange={toggleShowOnboarding}
              />
            </View>,
            toggleShowOnboarding,
            true,
          )}
        </View> */}

        {/* Appearance Section */}
        <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.settingsSection]}>
          <View style={styles.settingSectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Palette size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>Appearance</Text>
          </View>

          {renderSettingItem(
            <Sun size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Theme",
            <View style={styles.themeToggle}>
              {theme === "light" ? <Sun size={18} color={colors.warning} /> : <Moon size={18} color={colors.primary} />}
              <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>
                {theme === "light" ? "Light" : "Dark"}
              </Text>
              <TouchableOpacity
                style={[styles.themeToggleButton, theme === "dark" && styles.themeToggleButtonDark]}
                onPress={toggleTheme}
              >
                <View style={[styles.themeToggleIndicator, theme === "dark" && styles.themeToggleIndicatorDark]} />
              </TouchableOpacity>
            </View>,
            toggleTheme,
            true,
          )}
        </View>

        {/* Language Section */}
        <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.settingsSection]}>
          <View style={styles.settingSectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Globe size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>Language</Text>
          </View>

          {renderSettingItem(
            <Globe size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Interface Language",
            <View style={styles.languageSelector}>
              <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>English</Text>
              <ChevronRight size={18} color={theme === "dark" ? colors.darkTextTertiary : colors.textTertiary} />
            </View>,
            () => {},
          )}

          {renderSettingItem(
            <Bell size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Pronunciation",
            <View style={styles.switchContainer}>
              <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>Auto-play</Text>
              <Switch
                trackColor={{ false: colors.cardBorder, true: colors.primaryLight }}
                thumbColor={colors.background}
                ios_backgroundColor={colors.cardBorder}
                value={autoPlayPronunciation}
                onValueChange={toggleAutoPlay}
              />
            </View>,
            toggleAutoPlay,
            true,
          )}
        </View>

        {/* About Section */}
        <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.settingsSection]}>
          <View style={styles.settingSectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tertiary }]}>
              <Info size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>About</Text>
          </View>

          {renderSettingItem(
            <Info size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Version",
            <View style={styles.versionContainer}>
              <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>1.0.0</Text>
              <View style={styles.updateBadge}>
                <Text style={styles.updateBadgeText}>Latest</Text>
              </View>
            </View>,
          )}

          {renderSettingItem(
            <Lock size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Privacy Policy",
            <ChevronRight size={18} color={theme === "dark" ? colors.darkTextTertiary : colors.textTertiary} />,
            () => {},
          )}

          {renderSettingItem(
            <HelpCircle
              size={20}
              color={theme === "dark" ? colors.darkText : colors.text}
              style={styles.settingIcon}
            />,
            "Help & Support",
            <ChevronRight size={18} color={theme === "dark" ? colors.darkTextTertiary : colors.textTertiary} />,
            () => {},
            true,
          )}

          {renderSettingItem(
            <Mail size={20} color={theme === "dark" ? colors.darkText : colors.text} style={styles.settingIcon} />,
            "Send Feedback",
            <ChevronRight size={18} color={theme === "dark" ? colors.darkTextTertiary : colors.textTertiary} />,
            () => {},
            true,
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, theme === "dark" && { color: colors.darkTextTertiary }]}>
            © 2025 Japanese Learning App
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <EditProfileScreen
          theme={theme}
          onClose={() => {
            setShowEditProfile(false)
            loadSettings() // Reload settings after editing
          }}
        />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    padding: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImageGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editProfileButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  editProfileButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  settingsSection: {
    marginBottom: 16,
    padding: 0,
    overflow: "hidden",
  },
  settingSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingItemDark: {
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeToggleButton: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    padding: 2,
    justifyContent: "center",
  },
  themeToggleButtonDark: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  themeToggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  themeToggleIndicatorDark: {
    alignSelf: "flex-end",
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  versionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  updateBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  characterSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  characterSelectorImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContentDark: {
    backgroundColor: "#1E1E1E",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalHeaderDark: {
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  characterOptions: {
    marginBottom: 20,
  },
  characterOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  characterOptionDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  characterOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  characterOptionSelectedDark: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  characterImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginRight: 12,
  },
  characterImage: {
    width: "100%",
    height: "100%",
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  characterNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  textSecondaryDark: {
    color: colors.darkTextSecondary,
  },
  profileLoadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8,
  },
  jlptLevelCard: {
    padding: 16,
    marginBottom: 16,
  },
  jlptLevelTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  jlptLevelDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  jlptLevelOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  jlptLevelOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  jlptLevelOptionSelected: {
    backgroundColor: colors.primary,
  },
  jlptLevelOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  jlptLevelOptionTextSelected: {
    color: "#FFFFFF",
  },
  jlptLevelNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  jlptLevelContainer: {
    padding: 16,
  },
  jlptLevelLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  jlptLevelButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  jlptLevelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    minWidth: 50,
    alignItems: "center",
  },
  jlptLevelButtonDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  jlptLevelButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  jlptLevelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  //@ts-ignore
  jlptLevelDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  darkSecondaryText: {
    color: colors.darkTextSecondary,
  },
})
