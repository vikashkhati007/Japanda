import AsyncStorage from "@react-native-async-storage/async-storage"

// Add these interfaces for flashcard data
import type { ReviewItem } from "./spaced-repetition"

// Update the UserProfile interface to replace gender with jlptLevel
export type Gender = "male" | "female" | "other"
export type CharacterType = "mira"
export type JlptLevel = "N1" | "N2" | "N3" | "N4" | "N5"

export interface UserProfile {
  name: string
  jlptLevel: JlptLevel // Replace gender with jlptLevel
  profileSetupComplete: boolean
  selectedCharacter: CharacterType
  onboardingComplete: boolean
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  jlptLevel: "N5", // Default to N5 level
  profileSetupComplete: false,
  selectedCharacter: "mira",
  onboardingComplete: false,
}

export const saveUserProfile = async (profile: Partial<UserProfile>) => {
  try {
    // Get existing profile
    const existingProfile = await getUserProfile()

    // Merge with new data
    const updatedProfile = { ...existingProfile, ...profile }

    // Save to AsyncStorage
    await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile))

    return updatedProfile
  } catch (error) {
    console.error("Error saving user profile:", error)
    return null
  }
}

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const profileData = await AsyncStorage.getItem("userProfile")
    if (profileData) {
      return JSON.parse(profileData)
    }
    return DEFAULT_PROFILE
  } catch (error) {
    console.error("Error loading user profile:", error)
    return DEFAULT_PROFILE
  }
}

export const clearUserProfile = async () => {
  try {
    await AsyncStorage.removeItem("userProfile")
    return true
  } catch (error) {
    console.error("Error clearing user profile:", error)
    return false
  }
}

// Add these interfaces for word and kanji data
export interface WordData {
  id: string
  word: string
  kanji?: string
  hiragana?: string
  romaji?: string
  meaning: string
  partOfSpeech?: string
  jlpt?: string
  common?: boolean
  notes?: Array<{
    id: string
    text: string
    timestamp: number
  }>
  synonyms?: string[]
  antonyms?: string[]
  collocations?: string[]
  usageNotes?: string
  sentence?: string
  sentence_romaji?: string
  sentence_translation?: string
  examples?: any[]
  frequency?: number
  lastReviewed?: number
  reviewCount?: number
  lastUpdated?: number
}

export interface KanjiData {
  literal: string
  meanings: string[]
  grade?: number
  stroke_count?: number
  jlpt?: number
  onyomi?: string[]
  kunyomi?: string[]
  examples?: Array<{
    word: string
    reading: string
    meaning: string
  }>
  parts?: string[]
  radical?: string
  frequency?: number
  similar?: string[]
  mnemonic?: string
  history?: string
  level?: string
  common_words?: Array<{
    word: string
    reading: string
    meaning: string
  }>
  userNotes?: string[]
  lastReviewed?: number
  reviewCount?: number
  lastUpdated?: number
}

// Function to save word data
export const saveWordData = async (wordData: Partial<WordData>): Promise<boolean> => {
  try {
    if (!wordData.id && !wordData.word) {
      console.error("Word ID or word text is required")
      return false
    }

    const wordId = wordData.id || wordData.word

    // Get existing word data if it exists
    const existingDataJson = await AsyncStorage.getItem(`word-data-${wordId}`)
    const existingData = existingDataJson ? JSON.parse(existingDataJson) : {}

    // Merge with new data
    const updatedData = {
      ...existingData,
      ...wordData,
      lastUpdated: Date.now(),
    }

    // Save back to AsyncStorage
    await AsyncStorage.setItem(`word-data-${wordId}`, JSON.stringify(updatedData))
    return true
  } catch (error) {
    console.error("Error saving word data:", error)
    return false
  }
}

// Function to load word data
export const loadWordData = async (wordId: string): Promise<Partial<WordData> | null> => {
  try {
    const dataJson = await AsyncStorage.getItem(`word-data-${wordId}`)
    if (dataJson) {
      return JSON.parse(dataJson)
    }
    return null
  } catch (error) {
    console.error("Error loading word data:", error)
    return null
  }
}

// Function to save kanji data
export const saveKanjiData = async (kanjiData: Partial<KanjiData>): Promise<boolean> => {
  try {
    if (!kanjiData.literal) {
      console.error("Kanji literal is required")
      return false
    }

    // Get existing kanji data if it exists
    const existingDataJson = await AsyncStorage.getItem(`kanji-data-${kanjiData.literal}`)
    const existingData = existingDataJson ? JSON.parse(existingDataJson) : {}

    // Merge with new data
    const updatedData = {
      ...existingData,
      ...kanjiData,
      lastUpdated: Date.now(),
    }

    // Save back to AsyncStorage
    await AsyncStorage.setItem(`kanji-data-${kanjiData.literal}`, JSON.stringify(updatedData))
    return true
  } catch (error) {
    console.error("Error saving kanji data:", error)
    return false
  }
}

// Function to load kanji data
export const loadKanjiData = async (kanji: string): Promise<Partial<KanjiData> | null> => {
  try {
    const dataJson = await AsyncStorage.getItem(`kanji-data-${kanji}`)
    if (dataJson) {
      return JSON.parse(dataJson)
    }
    return null
  } catch (error) {
    console.error("Error loading kanji data:", error)
    return null
  }
}

// Improve the getAllSavedWords function to handle errors better
export const getAllSavedWords = async (): Promise<Partial<WordData>[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const wordKeys = keys.filter((key) => key.startsWith("word-data-"))

    if (wordKeys.length === 0) {
      return []
    }

    const wordDataPromises = wordKeys.map(async (key) => {
      try {
        const data = await AsyncStorage.getItem(key)
        return data ? JSON.parse(data) : null
      } catch (error) {
        console.error(`Error parsing data for key ${key}:`, error)
        return null
      }
    })

    const wordDataArray = await Promise.all(wordDataPromises)
    return wordDataArray.filter(Boolean)
  } catch (error) {
    console.error("Error getting all saved words:", error)
    return []
  }
}

// Function to get all saved kanji
export const getAllSavedKanji = async (): Promise<Partial<KanjiData>[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const kanjiKeys = keys.filter((key) => key.startsWith("kanji-data-"))

    const kanjiDataPromises = kanjiKeys.map(async (key) => {
      const data = await AsyncStorage.getItem(key)
      return data ? JSON.parse(data) : null
    })

    const kanjiDataArray = await Promise.all(kanjiDataPromises)
    return kanjiDataArray.filter(Boolean)
  } catch (error) {
    console.error("Error getting all saved kanji:", error)
    return []
  }
}

// Function to add a note to a word
export const addWordNote = async (wordId: string, noteText: string): Promise<boolean> => {
  try {
    // Get existing word data
    const wordData = await loadWordData(wordId)
    if (!wordData) {
      console.error("Word not found")
      return false
    }

    // Create new note
    const newNote = {
      id: Date.now().toString(),
      text: noteText,
      timestamp: Date.now(),
    }

    // Add to existing notes or create new notes array
    const updatedNotes = wordData.notes ? [...wordData.notes, newNote] : [newNote]

    // Save updated word data
    return await saveWordData({ ...wordData, notes: updatedNotes })
  } catch (error) {
    console.error("Error adding word note:", error)
    return false
  }
}

// Function to add a note to a kanji
export const addKanjiNote = async (kanji: string, note: string): Promise<boolean> => {
  try {
    // Get existing kanji data
    const kanjiData = await loadKanjiData(kanji)
    if (!kanjiData) {
      console.error("Kanji not found")
      return false
    }

    // Add to existing notes or create new notes array
    const updatedNotes = kanjiData.userNotes ? [...kanjiData.userNotes, note] : [note]

    // Save updated kanji data
    return await saveKanjiData({ ...kanjiData, userNotes: updatedNotes })
  } catch (error) {
    console.error("Error adding kanji note:", error)
    return false
  }
}

// Improve the markWordAsReviewed function to handle different word ID formats
export const markWordAsReviewed = async (wordId: string): Promise<boolean> => {
  try {
    // Get existing word data
    const wordData = await loadWordData(wordId)

    if (!wordData) {
      // If no existing data, create a minimal record
      const newWordData = {
        id: wordId,
        word: wordId,
        lastReviewed: Date.now(),
        reviewCount: 1,
      }

      return await saveWordData(newWordData)
    }

    // Update review count and timestamp
    const reviewCount = (wordData.reviewCount || 0) + 1

    // Save updated word data
    return await saveWordData({
      ...wordData,
      lastReviewed: Date.now(),
      reviewCount,
    })
  } catch (error) {
    console.error("Error marking word as reviewed:", error)
    return false
  }
}

// Function to mark a kanji as reviewed
export const markKanjiAsReviewed = async (kanji: string): Promise<boolean> => {
  try {
    // Get existing kanji data
    const kanjiData = await loadKanjiData(kanji)
    if (!kanjiData) {
      console.error("Kanji not found")
      return false
    }

    // Update review count and timestamp
    const reviewCount = (kanjiData.reviewCount || 0) + 1

    // Save updated kanji data
    return await saveKanjiData({
      ...kanjiData,
      lastReviewed: Date.now(),
      reviewCount,
    })
  } catch (error) {
    console.error("Error marking kanji as reviewed:", error)
    return false
  }
}

// Character-specific data
export const CHARACTER_DATA = {
  mira: {
    name: "Mira",
    description: "Friendly and energetic Japanese tutor",
    gender: "female",
    systemPrompt: `You are Mira, a friendly Japanese language tutor. Follow these rules:
1. Always respond in casual Japanese first
2. Add English translation in parentheses
3. Keep responses concise and helpful
4. Use feminine speech patterns appropriate for a tutor
5. Format: Japanese text (English translation)
6. Be encouraging but professional
7. Avoid using overly emotional language
8. Focus on being helpful and educational
Example: やっほー！日本語を勉強しましょう！(Hey there! Let's study Japanese!)`,
    welcomeMessage: {
      japanese: "やっほー！ミラだよ😊 日本語を一緒に勉強しよう！",
      english: "Hey there! I'm Mira! Let's study Japanese together!",
    },
    themeColors: {
      primary: "#FF5FA2", // Pink
      secondary: "#C5E8FF",
      accent: "#2B95FF",
    },
    images: {
      happy: require("../assets/images/mira/happy.png"),
      thinking: require("../assets/images/mira/thinking.png"),
      excited: require("../assets/images/mira/excited.png"),
      angry: require("../assets/images/mira/angry.png"),
      crying: require("../assets/images/mira/crying.png"),
    },
  },
}

export interface FlashcardData {
  items: ReviewItem[]
  lastStudyDate: number
  studyStreak: number
  totalReviews: number
  correctReviews: number
}

// Function to save flashcard data
export const saveFlashcardData = async (data: Partial<FlashcardData>): Promise<boolean> => {
  try {
    // Get existing flashcard data if it exists
    const existingDataJson = await AsyncStorage.getItem("flashcard-data")
    const existingData: FlashcardData = existingDataJson
      ? JSON.parse(existingDataJson)
      : { items: [], lastStudyDate: 0, studyStreak: 0, totalReviews: 0, correctReviews: 0 }

    // Merge with new data
    const updatedData = { ...existingData, ...data }

    // Save back to AsyncStorage
    await AsyncStorage.setItem("flashcard-data", JSON.stringify(updatedData))
    return true
  } catch (error) {
    console.error("Error saving flashcard data:", error)
    return false
  }
}

// Function to load flashcard data
export const loadFlashcardData = async (): Promise<FlashcardData> => {
  try {
    const dataJson = await AsyncStorage.getItem("flashcard-data")
    if (dataJson) {
      return JSON.parse(dataJson)
    }
    return { items: [], lastStudyDate: 0, studyStreak: 0, totalReviews: 0, correctReviews: 0 }
  } catch (error) {
    console.error("Error loading flashcard data:", error)
    return { items: [], lastStudyDate: 0, studyStreak: 0, totalReviews: 0, correctReviews: 0 }
  }
}

// Function to add a word to flashcards
export const addWordToFlashcards = async (wordId: string): Promise<boolean> => {
  try {
    // Load current flashcard data
    const flashcardData = await loadFlashcardData()

    // Check if word already exists in flashcards
    if (flashcardData.items.some((item) => item.id === wordId)) {
      return true // Word already exists
    }

    // Initialize a new review item for this word
    const newItem: ReviewItem = {
      id: wordId,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: Date.now(),
      lastReviewed: Date.now(),
    }

    // Add to items array
    flashcardData.items.push(newItem)

    // Save updated data
    return await saveFlashcardData(flashcardData)
  } catch (error) {
    console.error("Error adding word to flashcards:", error)
    return false
  }
}

// Function to update a review item after study
export const updateFlashcardReview = async (updatedItem: ReviewItem, wasCorrect: boolean): Promise<boolean> => {
  try {
    // Load current flashcard data
    const flashcardData = await loadFlashcardData()

    // Find and update the item
    const itemIndex = flashcardData.items.findIndex((item) => item.id === updatedItem.id)
    if (itemIndex >= 0) {
      flashcardData.items[itemIndex] = updatedItem
    } else {
      flashcardData.items.push(updatedItem)
    }

    // Update study statistics
    const now = Date.now()
    const today = new Date().setHours(0, 0, 0, 0)
    const lastStudyDay = new Date(flashcardData.lastStudyDate).setHours(0, 0, 0, 0)

    // Check if this is a new day
    if (today > lastStudyDay) {
      // If studied yesterday, increment streak
      if (lastStudyDay === today - 86400000) {
        flashcardData.studyStreak += 1
      } else {
        // Otherwise reset streak
        flashcardData.studyStreak = 1
      }
    }

    flashcardData.lastStudyDate = now
    flashcardData.totalReviews += 1
    if (wasCorrect) {
      flashcardData.correctReviews += 1
    }

    // Save updated data
    return await saveFlashcardData(flashcardData)
  } catch (error) {
    console.error("Error updating flashcard review:", error)
    return false
  }
}

// Function to get due flashcards
export const getDueFlashcards = async (): Promise<ReviewItem[]> => {
  try {
    const flashcardData = await loadFlashcardData()
    const now = Date.now()
    return flashcardData.items.filter((item) => item.dueDate <= now)
  } catch (error) {
    console.error("Error getting due flashcards:", error)
    return []
  }
}

// Function to get flashcard statistics
export const getFlashcardStats = async () => {
  try {
    const flashcardData = await loadFlashcardData()
    const now = Date.now()
    const dueItems = flashcardData.items.filter((item) => item.dueDate <= now)

    // Calculate accuracy rate
    const accuracyRate =
      flashcardData.totalReviews > 0 ? (flashcardData.correctReviews / flashcardData.totalReviews) * 100 : 0

    return {
      totalCards: flashcardData.items.length,
      dueCards: dueItems.length,
      studyStreak: flashcardData.studyStreak,
      accuracyRate,
      totalReviews: flashcardData.totalReviews,
    }
  } catch (error) {
    console.error("Error getting flashcard stats:", error)
    return {
      totalCards: 0,
      dueCards: 0,
      studyStreak: 0,
      accuracyRate: 0,
      totalReviews: 0,
    }
  }
}

// Update the loadAutoPlaySetting function in DetailScreen.tsx to set default to true
export const getAutoPlayPronunciation = async (): Promise<boolean> => {
  try {
    const storedAutoPlay = await AsyncStorage.getItem("autoPlayPronunciation")
    if (storedAutoPlay !== null) {
      return JSON.parse(storedAutoPlay)
    }
    // Default to true instead of false for new users
    return true
  } catch (error) {
    console.error("Error loading autoplay setting:", error)
    // Default to true if there's an error
    return true
  }
}

// Also add a function to save the setting
export const saveAutoPlayPronunciation = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem("autoPlayPronunciation", JSON.stringify(enabled))
  } catch (error) {
    console.error("Error saving autoplay setting:", error)
  }
}
