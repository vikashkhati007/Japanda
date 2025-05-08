"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { Send, Volume2, VolumeX, X, Languages, Trash2 } from "lucide-react-native"
import { colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import * as Speech from "expo-speech"
import OpenAI from "openai"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { type CharacterType, CHARACTER_DATA, getUserProfile } from "../../lib/user-store"
import { OPENROUTER_API_KEY } from "@/lib/api"

// Initialize OpenAI client with API key from environment
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  timeout: 10000,
})

interface Message {
  id: string
  japanese: string
  english: string
  sender: "user" | "assistant"
  timestamp: number
  showTranslation?: boolean
  isThinking?: boolean
}

export default function AssistantScreen({
  theme,
  onClose,
  character: initialCharacter = "mira", // Provide default value and rename prop
}: {
  theme: string
  onClose?: () => void
  character?: CharacterType
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userName, setUserName] = useState("")
  const [character, setCharacter] = useState<CharacterType>(initialCharacter) // Declare character state
  const scrollViewRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)
  const bubbleAnimation = useRef(new Animated.Value(0)).current

  // Load user profile and character preference
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Clear any existing messages first to prevent showing wrong chat
        setMessages([])

        const profile = await getUserProfile()
        // Use the character prop directly instead of from profile
        // This ensures we're using the most up-to-date character selection
        setCharacter(initialCharacter || profile.selectedCharacter)
        setUserName(profile.name)

        // Initialize messages with character-specific welcome message
        const characterData = CHARACTER_DATA[initialCharacter || profile.selectedCharacter]
        const welcomeMessage: Message = {
          id: "welcome-" + Date.now(),
          japanese: characterData.welcomeMessage.japanese,
          english: characterData.welcomeMessage.english,
          sender: "assistant",
          timestamp: Date.now(),
        }

        // Check if we have existing messages for this specific character
        const savedMessages = await AsyncStorage.getItem(
          `chatMessages-${initialCharacter || profile.selectedCharacter}`,
        )
        if (savedMessages && JSON.parse(savedMessages).length > 0) {
          setMessages(JSON.parse(savedMessages))
        } else {
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Set default welcome message in case of error
        const characterData = CHARACTER_DATA[initialCharacter || "mira"]
        setMessages([
          {
            id: "welcome-" + Date.now(),
            japanese: characterData.welcomeMessage.japanese,
            english: characterData.welcomeMessage.english,
            sender: "assistant",
            timestamp: Date.now(),
          },
        ])
      }
    }

    loadUserData()
  }, [initialCharacter]) // Add character as a dependency to reload when it changes

  // Save messages when they change
  useEffect(() => {
    const saveMessages = async () => {
      if (messages.length === 0) return

      try {
        await AsyncStorage.setItem(`chatMessages-${character}`, JSON.stringify(messages.filter((m) => !m.isThinking)))
      } catch (error) {
        console.error("Failed to save messages:", error)
      }
    }

    saveMessages()
  }, [messages, character])

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  // Pre-check available voices for better voice selection
  useEffect(() => {
    const checkAvailableVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync()
        console.log("Available voices:", voices.length)

        // Log Japanese voices for debugging
        const japaneseVoices = voices.filter((v) => v.language.includes("ja"))
        console.log("Japanese voices:", japaneseVoices.length)

        // Find male and female Japanese voices if available
        const maleJapaneseVoice = japaneseVoices.find(
          (v) => v.name.toLowerCase().includes("male") || v.identifier.toLowerCase().includes("male"),
        )

        const femaleJapaneseVoice = japaneseVoices.find(
          (v) => v.name.toLowerCase().includes("female") || v.identifier.toLowerCase().includes("female"),
        )

        console.log("Male Japanese voice:", maleJapaneseVoice?.identifier)
        console.log("Female Japanese voice:", femaleJapaneseVoice?.identifier)
      } catch (error) {
        console.error("Error checking voices:", error)
      }
    }

    checkAvailableVoices()
  }, [])

  // Parse API response into Japanese and English parts
  const parseResponse = (text: string) => {
    // Default values in case parsing fails
    let japanese = ""
    let english = ""

    try {
      // Try to extract Japanese part (before parentheses)
      const japanesePart = text.split(/[(（]/)[0]
      japanese = japanesePart ? japanesePart.trim() : ""

      // Try to extract English part (inside parentheses)
      const englishMatch = text.match(/[(（](.*?)[)）]/)
      english = englishMatch && englishMatch[1] ? englishMatch[1].trim() : ""

      // If either part is empty, try to create a reasonable fallback
      if (!japanese && english) {
        // If we have English but no Japanese, use a generic Japanese phrase
        japanese = "申し訳ありません、日本語で言えば..."
      }

      if (!english && japanese) {
        // If we have Japanese but no English, try to provide a generic translation
        english = "Sorry, in English this means..."
      }

      // If both are still empty (very unlikely), use generic fallbacks
      if (!japanese && !english) {
        japanese = "すみません、もう一度お願いします。"
        english = "Sorry, could you please repeat that?"
      }
    } catch (error) {
      console.error("Error parsing response:", error)
      japanese = "パースエラーが発生しました。"
      english = "A parsing error occurred."
    }

    return { japanese, english }
  }

  // Generate AI response with both languages
  const generateAIResponse = async (message: string) => {
    try {
      const characterData = CHARACTER_DATA[character]
      const userProfile = await getUserProfile()

      // Create a system prompt that includes user profile information
      const systemPrompt = `${characterData.systemPrompt}
You are talking to ${userProfile.name || "a user"}${userProfile.gender !== "other" ? `, who is ${userProfile.gender}` : ""}.
Address them by name occasionally to personalize the conversation.
IMPORTANT: Always respond in both Japanese and English. Format your response as: Japanese text (English translation).
Never leave either part empty. If you're not sure about the Japanese, still provide your best attempt.`

      // Add retry logic
      let attempts = 0
      const maxAttempts = 3
      let content = ""

      while (attempts < maxAttempts) {
        attempts++
        try {
          const response = await client.chat.completions.create({
            model: "deepseek/deepseek-r1:free",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages
                .filter((m) => !m.isThinking)
                .map((m) => ({
                  role: m.sender === "user" ? "user" : "assistant",
                  content: m.japanese + (m.english ? `(${m.english})` : ""),
                })),
              { role: "user", content: message },
            ],
            max_tokens: 300,
            temperature: 0.7,
          })

          content = response.choices[0].message.content || ""

          // Check if the response has both Japanese and English parts
          const { japanese, english } = parseResponse(content)

          if (japanese.trim() && english.trim()) {
            return { japanese, english }
          }
        } catch (error) {
          console.error(`API attempt ${attempts} failed:`, error)
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        // If we're on the last attempt and still don't have a good response,
        // create a fallback response
        if (attempts === maxAttempts) {
          console.log("Failed to get proper response after multiple attempts, using fallback")
          return {
            japanese: "すみません、もう一度お願いします。",
            english: "Sorry, could you please repeat that?",
          }
        }
      }

      // This should never be reached due to the return in the loop
      return parseResponse(content)
    } catch (error) {
      console.error("AI Error:", error)
      return {
        japanese: "エラーが発生しました。もう一度お試しください。",
        english: "An error occurred. Please try again.",
      }
    }
  }

  // Handle sending messages
  const handleSendMessage = async (text = inputText) => {
    if (!text.trim() || isGenerating) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      japanese: text,
      english: text, // For user messages, both are same
      sender: "user",
      timestamp: Date.now(),
    }

    // Add thinking indicator
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      japanese: "考え中...",
      english: "Thinking...",
      sender: "assistant",
      timestamp: Date.now(),
      isThinking: true,
    }

    setMessages((prev) => [...prev, userMessage, thinkingMessage])
    setInputText("")
    setIsGenerating(true)

    try {
      const { japanese, english } = await generateAIResponse(text)

      // Replace thinking message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingMessage.id
            ? {
                ...msg,
                japanese,
                english,
                isThinking: false,
              }
            : msg,
        ),
      )

      // Speak the Japanese response
      if (!muted) {
        setIsSpeaking(true)

        // Get available voices
        const voices = await Speech.getAvailableVoicesAsync()

        // Find a male Japanese voice if available
        let voiceOptions = {}
        if (character === "jun") {
          const maleVoice = voices.find(
            (v) =>
              v.language.includes("ja") &&
              (v.name.toLowerCase().includes("male") || v.identifier.toLowerCase().includes("male")),
          )

          if (maleVoice) {
            voiceOptions = { voice: maleVoice.identifier }
          } else {
            // If no male voice found, use pitch to simulate male voice
            voiceOptions = { pitch: 0.7 } // Lower pitch for more masculine sound
          }
        } else {
          // For Mira, use a higher pitch
          voiceOptions = { pitch: 1.2 }
        }

        await Speech.speak(japanese, {
          language: "ja-JP",
          rate: 0.75,
          ...voiceOptions,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        })
      }
    } catch (error) {
      console.error("Error generating response:", error)

      // Replace thinking message with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingMessage.id
            ? {
                ...msg,
                japanese: "エラーが発生しました。もう一度お試しください。",
                english: "An error occurred. Please try again.",
                isThinking: false,
              }
            : msg,
        ),
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // Toggle translation visibility
  const toggleTranslation = (id: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, showTranslation: !msg.showTranslation } : msg)))
  }

  // Clear conversation history
  const clearConversation = async () => {
    const characterData = CHARACTER_DATA[character]
    const welcomeMessage: Message = {
      id: "welcome-" + Date.now(),
      japanese: characterData.welcomeMessage.japanese,
      english: characterData.welcomeMessage.english,
      sender: "assistant",
      timestamp: Date.now(),
    }
    setMessages([welcomeMessage])
    await AsyncStorage.setItem(`chatMessages-${character}`, JSON.stringify([welcomeMessage]))
  }

  // Get character data
  const characterData = CHARACTER_DATA[character]

  // Render each chat message
  const renderMessage = (message: Message) => {
    const isAssistant = message.sender === "assistant"

    // Handle empty messages - provide fallback text
    const displayJapanese = message.japanese?.trim() || "メッセージを読み込めませんでした"
    const displayEnglish = message.english?.trim() || "Could not load message"

    // Determine which text to display based on translation toggle
    const displayText = message.showTranslation ? displayEnglish : displayJapanese

    return (
      <View
        key={message.id}
        style={[styles.messageContainer, isAssistant ? styles.assistantMessage : styles.userMessage]}
      >
        {isAssistant && (
          <Image
            source={message.isThinking ? characterData.images.thinking : characterData.images.happy}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.bubble,
            isAssistant
              ? theme === "dark"
                ? styles.assistantBubbleDark
                : styles.assistantBubble
              : theme === "dark"
                ? character === "jun"
                  ? styles.junBubbleDark
                  : styles.userBubbleDark
                : character === "jun"
                  ? styles.junBubble
                  : styles.userBubble,
            message.isThinking && (theme === "dark" ? styles.thinkingBubbleDark : styles.thinkingBubble),
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isAssistant ? (theme === "dark" ? styles.assistantTextDark : styles.assistantText) : styles.userText,
            ]}
          >
            {displayText}
          </Text>
          {!message.isThinking && (
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, theme === "dark" && styles.timestampDark]}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              {isAssistant && (
                <TouchableOpacity onPress={() => toggleTranslation(message.id)} style={styles.translateButton}>
                  <Languages
                    size={14}
                    color={
                      message.showTranslation
                        ? colors.primary
                        : theme === "dark"
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(0,0,0,0.5)"
                    }
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          {message.isThinking && (
            <ActivityIndicator
              size="small"
              color={theme === "dark" ? colors.primary : colors.accent}
              style={styles.thinkingIndicator}
            />
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, theme === "dark" && styles.containerDark]}>
      <GradientBackground theme={theme} character={character} />
      {/* Header */}
      <View style={[styles.header, theme === "dark" ? styles.headerDark : styles.headerLight]}>
        <TouchableOpacity style={[styles.closeButton, theme === "dark" && styles.closeButtonDark]} onPress={onClose}>
          <X size={20} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Image
            source={
              isSpeaking
                ? characterData.images.excited
                : isGenerating
                  ? characterData.images.thinking
                  : characterData.images.happy
            }
            style={[styles.profileImage, { borderColor: characterData.themeColors.primary }]}
          />

          <View style={styles.headerText}>
            <Text style={[styles.title, theme === "dark" && styles.titleDark]}>{characterData.name}</Text>
            <Text style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}>Japanese Assistant</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setMuted(!muted)}
              style={[
                styles.actionButton,
                muted ? (theme === "dark" ? styles.mutedButtonDark : styles.mutedButton) : {},
                theme === "dark" && styles.actionButtonDark,
              ]}
            >
              {muted ? (
                <VolumeX size={18} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
              ) : (
                <Volume2 size={18} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearConversation}
              style={[styles.actionButton, { backgroundColor: characterData.themeColors.primary }]}
            >
              <Trash2 size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {isSpeaking && (
          <View style={[styles.speakingIndicator, theme === "dark" && styles.speakingIndicatorDark]}>
            <Text style={[styles.speakingText, theme === "dark" && styles.speakingTextDark]}>Speaking...</Text>
            <View style={styles.speakingBars}>
              <View
                style={[
                  styles.speakingBar,
                  styles.bar1,
                  theme === "dark" && styles.barDark,
                  { backgroundColor: characterData.themeColors.primary },
                ]}
              />
              <View
                style={[
                  styles.speakingBar,
                  styles.bar2,
                  theme === "dark" && styles.barDark,
                  { backgroundColor: characterData.themeColors.primary },
                ]}
              />
              <View
                style={[
                  styles.speakingBar,
                  styles.bar3,
                  theme === "dark" && styles.barDark,
                  { backgroundColor: characterData.themeColors.primary },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Chat messages */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.messagesContainer, theme === "dark" && styles.messagesContainerDark]}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}
        </ScrollView>
      </View>

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View
          style={[styles.inputContainer, theme === "dark" ? styles.inputContainerDark : styles.inputContainerLight]}
        >
          <View style={[styles.inputWrapper, theme === "dark" && styles.inputWrapperDark]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, theme === "dark" && styles.inputDark]}
              placeholder="メッセージを入力..."
              placeholderTextColor={theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isGenerating}
              onSubmitEditing={() => handleSendMessage()}
            />

            {inputText.length > 0 && (
              <TouchableOpacity
                onPress={() => setInputText("")}
                style={[styles.clearButton, theme === "dark" && styles.clearButtonDark]}
              >
                <X size={16} color={theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)"} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isGenerating}
            style={[
              styles.sendButton,
              (!inputText.trim() || isGenerating) && styles.disabledButton,
              { backgroundColor: characterData.themeColors.primary },
            ]}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  containerDark: {
    backgroundColor: "transparent",
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    position: "relative",
    zIndex: 10,
  },
  headerLight: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerDark: {
    backgroundColor: "rgba(30,30,30,0.9)",
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  closeButtonDark: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 40, // Make room for the close button
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  titleDark: {
    color: colors.darkText,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitleDark: {
    color: colors.darkTextSecondary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonDark: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  mutedButton: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  mutedButtonDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  speakingIndicator: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "center",
  },
  speakingIndicatorDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  speakingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 6,
  },
  speakingTextDark: {
    color: colors.darkTextSecondary,
  },
  speakingBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 12,
  },
  speakingBar: {
    width: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  barDark: {
    backgroundColor: colors.primary,
  },
  bar1: {
    height: 4,
    animationName: "sound-wave-1",
    animationDuration: "1.2s",
    animationIterationCount: "infinite",
  },
  bar2: {
    height: 7,
    animationName: "sound-wave-2",
    animationDuration: "1.2s",
    animationIterationCount: "infinite",
    animationDelay: "0.2s",
  },
  bar3: {
    height: 5,
    animationName: "sound-wave-3",
    animationDuration: "1.2s",
    animationIterationCount: "infinite",
    animationDelay: "0.4s",
  },

  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messagesContainerDark: {
    backgroundColor: "transparent",
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: "flex-end",
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  assistantBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  assistantBubbleDark: {
    backgroundColor: "rgba(60,60,60,0.9)",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  userBubbleDark: {
    backgroundColor: colors.primaryDark,
    borderBottomRightRadius: 4,
  },
  junBubble: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  junBubbleDark: {
    backgroundColor: colors.accentDark,
    borderBottomRightRadius: 4,
  },
  thinkingBubble: {
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  thinkingBubbleDark: {
    backgroundColor: "rgba(60,60,60,0.7)",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  assistantMessage: {
    justifyContent: "flex-start",
  },
  userMessage: {
    justifyContent: "flex-end",
    marginLeft: "auto",
  },
  assistantText: {
    color: colors.text,
  },
  assistantTextDark: {
    color: colors.darkText,
  },
  userText: {
    color: "white",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  timestamp: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
  },
  timestampDark: {
    color: "rgba(255,255,255,0.4)",
  },
  translateButton: {
    padding: 2,
  },
  thinkingIndicator: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  inputContainerLight: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  inputContainerDark: {
    backgroundColor: "rgba(30,30,30,0.9)",
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputWrapperDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
  },
  inputDark: {
    color: colors.darkText,
  },
  clearButton: {
    padding: 6,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 50,
  },
  clearButtonDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
})

