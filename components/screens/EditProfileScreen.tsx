"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native"
import { ArrowLeft, User, Save, BookOpen, Check, Edit2 } from "lucide-react-native"
import { colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import { type JlptLevel, getUserProfile, saveUserProfile } from "@/lib/user-store"
import { LinearGradient } from "expo-linear-gradient"

interface EditProfileScreenProps {
  theme: "light" | "dark"
  onClose: () => void
}

export default function EditProfileScreen({ theme, onClose }: EditProfileScreenProps) {
  const [name, setName] = useState("")
  const [jlptLevel, setJlptLevel] = useState<JlptLevel>("N5")
  const [nameError, setNameError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]

  useEffect(() => {
    loadProfile()

    // Run entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    const profile = await getUserProfile()
    setName(profile.name)
    setJlptLevel(profile.jlptLevel || "N5")
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Please enter your name")
      return
    }

    try {
      await saveUserProfile({
        name: name.trim(),
        jlptLevel,
      })

      // Run exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Alert.alert("Success", "Your profile has been updated", [{ text: "OK", onPress: onClose }])
      })
    } catch (error) {
      Alert.alert("Error", "Failed to save profile")
    }
  }

  const renderJlptLevelOption = (level: JlptLevel, description: string, color: string) => {
    const isSelected = jlptLevel === level

    return (
      <TouchableOpacity
        style={[
          styles.jlptOption,
          theme === "dark" && styles.jlptOptionDark,
          isSelected && styles.jlptOptionSelected,
          isSelected && { borderColor: color, backgroundColor: `${color}20` },
        ]}
        onPress={() => setJlptLevel(level)}
        disabled={!isEditing}
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
        {isSelected && (
          <View style={[styles.checkCircle, { backgroundColor: color }]}>
            <Check size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <GradientBackground theme={theme} />
        <Text style={[styles.loadingText, theme === "dark" && styles.textDark]}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
    >
      <GradientBackground theme={theme} />

      <View style={[styles.header, theme === "dark" ? styles.headerDark : styles.headerLight]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <ArrowLeft size={24} color={theme === "dark" ? colors.darkText : colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, theme === "dark" && styles.textDark]}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, isEditing ? styles.saveButtonActive : {}]}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? (
            <Save size={24} color="#FFFFFF" />
          ) : (
            <Edit2 size={24} color={theme === "dark" ? colors.darkText : colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, theme === "dark" && styles.profileCardDark]}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                <LinearGradient colors={[colors.primary, colors.accent]} style={styles.profileImageGradient}>
                  <Text style={styles.profileInitials}>{name ? name.charAt(0).toUpperCase() : "?"}</Text>
                </LinearGradient>
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, theme === "dark" && styles.textDark]}>{name || "Set Your Name"}</Text>
                <View style={styles.profileBadge}>
                  <BookOpen size={14} color="#FFFFFF" />
                  <Text style={styles.profileBadgeText}>JLPT {jlptLevel}</Text>
                </View>
              </View>
            </View>

            {isEditing && (
              <View style={styles.editNameContainer}>
                <Text style={[styles.editNameLabel, theme === "dark" && styles.textDark]}>Your Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    theme === "dark" && styles.inputContainerDark,
                    name ? styles.inputContainerFilled : {},
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
              </View>
            )}
          </View>

          {/* JLPT Level Section */}
          <View style={[styles.section, { backgroundColor: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)" }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.info }]}>
                <BookOpen size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.sectionTitle, theme === "dark" && styles.textDark]}>Japanese Level</Text>
            </View>

            <View style={styles.jlptOptions}>
              {renderJlptLevelOption("N5", "Beginner - Basic vocabulary & grammar", colors.success)}
              {renderJlptLevelOption("N4", "Elementary - Common expressions", colors.info)}
              {renderJlptLevelOption("N3", "Intermediate - Everyday conversations", colors.primary)}
              {renderJlptLevelOption("N2", "Upper Intermediate - Most contexts", colors.warning)}
              {renderJlptLevelOption("N1", "Advanced - Complex Japanese", colors.error)}
            </View>

            <Text style={[styles.jlptNote, theme === "dark" && styles.textSecondaryDark]}>
              Your JLPT level determines the difficulty of content shown in the app
            </Text>
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, theme === "dark" && styles.cancelButtonDark]}
                onPress={() => {
                  setIsEditing(false)
                  loadProfile() // Reset to original values
                }}
              >
                <Text style={[styles.cancelButtonText, theme === "dark" && styles.textDark]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
                <Text style={styles.saveFullButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLight: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerDark: {
    backgroundColor: "rgba(30, 30, 30, 0.9)",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  saveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileCardDark: {
    backgroundColor: "rgba(40, 40, 40, 0.9)",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImageGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.info,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  profileBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
  },
  editNameContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingTop: 20,
  },
  editNameLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  inputContainerDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inputContainerFilled: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
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
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontStyle: "italic",
  },
  jlptOptions: {
    gap: 12,
  },
  jlptOption: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  jlptOptionDark: {
    backgroundColor: "rgba(60, 60, 60, 0.7)",
  },
  jlptOptionSelected: {
    borderColor: colors.primary,
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
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  jlptNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonDark: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  saveFullButton: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveFullButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  textDark: {
    color: colors.darkText,
  },
  textSecondaryDark: {
    color: colors.darkTextSecondary,
  },
})
