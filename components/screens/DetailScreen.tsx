"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
  Share,
} from "react-native"
import {
  ArrowLeft,
  Heart,
  Volume2,
  BookOpen,
  Brush,
  Grid,
  List,
  Share2,
  Bookmark,
  MessageCircle,
  AlertTriangle,
  Zap,
  Lightbulb,
  Repeat,
  ArrowUpDown,
  Layers,
} from "lucide-react-native"
import { colors } from "../../styles/globalStyles"
import * as Speech from "expo-speech"
import KanjiDetailScreen from "./KanjiDetailScreen"
import AsyncStorage from "@react-native-async-storage/async-storage"
// Add import for the addWordToFlashcards function
import { saveWordData, loadWordData, addWordToFlashcards } from "../../lib/user-store"

// Add this import at the top of the file
import { getAutoPlayPronunciation } from "@/lib/user-store"

// Update the interface to include more fields
interface DetailScreenProps {
  selectedWord: any
  setSelectedWord: (word: any) => void
  favorites: any[]
  toggleFavorite: (word: any) => void
  theme: string
}

// Add these new interfaces for better type safety
interface Note {
  id: string
  text: string
  timestamp: number
}

interface WordData {
  id: string
  word: string
  kanji?: string
  hiragana?: string
  romaji?: string
  meaning: string
  partOfSpeech?: string
  jlpt?: string
  common?: boolean
  notes?: Note[]
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
  studyHistory?: number[]
  lastStudied?: number
}

const { width } = Dimensions.get("window")

const DetailScreen: React.FC<DetailScreenProps> = ({
  selectedWord,
  setSelectedWord,
  favorites,
  toggleFavorite,
  theme,
}) => {
  // Add this near the top of the file with other state variables
  const [autoPlayPronunciation, setAutoPlayPronunciation] = useState(false)
  const [activeTab, setActiveTab] = useState("meaning")
  const [scrollY] = useState(new Animated.Value(0))
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [relatedWords, setRelatedWords] = useState<any[]>([])
  const [kanjiData, setKanjiData] = useState<any[]>([])
  const [isLoadingKanji, setIsLoadingKanji] = useState(false)
  const [selectedKanji, setSelectedKanji] = useState<string | null>(null)
  const [showKanjiDetail, setShowKanjiDetail] = useState(false)
  const [selectedKanjiData, setSelectedKanjiData] = useState<any>(null)
  // New state variables for enhanced features
  const [synonyms, setSynonyms] = useState<string[]>([])
  const [antonyms, setAntonyms] = useState<string[]>([])
  const [collocations, setCollocations] = useState<string[]>([])
  const [usageNotes, setUsageNotes] = useState<string>("")
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [wordData, setWordData] = useState<Partial<WordData> | null>(null)
  const [isLoadingWordData, setIsLoadingWordData] = useState(true)

  const scrollViewRef = useRef<ScrollView>(null)

  const isFavorite = favorites.some((fav) => fav.id === selectedWord.id || fav.kanji === selectedWord.kanji)

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 60],
    extrapolate: "clamp",
  })

  // Extract kanji characters from the word
  useEffect(() => {
    if (selectedWord) {
      // Extract kanji characters from the word
      const extractKanji = (text: string) => {
        if (!text) return []
        const kanjiRegex = /[\u4e00-\u9faf]/g
        const matches = text.match(kanjiRegex)
        return matches ? [...new Set(matches)] : []
      }

      const kanjiChars = extractKanji(selectedWord.kanji || selectedWord.word || "")

      if (kanjiChars.length > 0) {
        fetchKanjiData(kanjiChars)
      }

      // Fetch related words (in a real app, this would be an API call)
      // For now, we'll simulate it with the additional examples if available
      if (selectedWord.additional_examples && selectedWord.additional_examples.length > 0) {
        setRelatedWords(selectedWord.additional_examples)
      } else {
        // Create some mock related words if none are available
        setRelatedWords([
          {
            japanese: `${selectedWord.kanji}的な考え`,
            romaji: `${selectedWord.romaji}teki na kangae`,
            english: `${selectedWord.meaning}-like thinking`,
          },
          {
            japanese: `${selectedWord.kanji}について話す`,
            romaji: `${selectedWord.romaji} ni tsuite hanasu`,
            english: `to talk about ${selectedWord.meaning}`,
          },
        ])
      }

      // Generate mock synonyms and antonyms
      generateSynonymsAndAntonyms()

      // Generate mock collocations
      generateCollocations()

      // Generate mock usage notes
      generateUsageNotes()
    }
  }, [selectedWord])

  // Generate mock synonyms and antonyms
  const generateSynonymsAndAntonyms = () => {
    // In a real app, this would come from an API
    const mockSynonyms = [
      `${selectedWord.kanji}と同じ`,
      `${selectedWord.kanji}に似ている`,
      `${selectedWord.kanji}のような`,
    ]

    const mockAntonyms = [`${selectedWord.kanji}の反対`, `${selectedWord.kanji}ではない`]

    setSynonyms(mockSynonyms)
    setAntonyms(mockAntonyms)
  }

  // Generate mock collocations
  const generateCollocations = () => {
    // In a real app, this would come from an API
    const mockCollocations = [
      `${selectedWord.kanji}を使う`,
      `${selectedWord.kanji}がある`,
      `${selectedWord.kanji}になる`,
      `${selectedWord.kanji}する`,
    ]

    setCollocations(mockCollocations)
  }

  // Generate mock usage notes
  const generateUsageNotes = () => {
    // In a real app, this would come from an API
    const mockUsageNotes = `"${selectedWord.kanji}" is commonly used in ${
      selectedWord.jlpt ? `JLPT N${selectedWord.jlpt}` : "everyday"
    } Japanese. It's frequently seen in ${
      selectedWord.common ? "common expressions" : "specific contexts"
    }. Be careful not to confuse it with similar words.`

    setUsageNotes(mockUsageNotes)
  }

  // Fetch kanji data from API
  const fetchKanjiData = async (kanjiChars: string[]) => {
    setIsLoadingKanji(true)

    try {
      // In a real app, this would be an API call to fetch kanji data
      // For now, we'll create mock data based on the kanji characters
      const mockKanjiData = kanjiChars.map((kanji) => ({
        literal: kanji,
        meanings: ["meaning1", "meaning2", "meaning3"],
        grade: Math.floor(Math.random() * 6) + 1,
        stroke_count: Math.floor(Math.random() * 15) + 5,
        jlpt: Math.floor(Math.random() * 5) + 1,
        onyomi: ["オン", "ヨミ"],
        kunyomi: ["くん", "よみ"],
        examples: [
          {
            word: `${kanji}語`,
            reading: `${kanji}ご`,
            meaning: `${kanji} language`,
          },
          {
            word: `${kanji}文`,
            reading: `${kanji}ぶん`,
            meaning: `${kanji} sentence`,
          },
        ],
        // Add new fields for enhanced information
        similar: [`${String.fromCharCode(kanji.charCodeAt(0) + 1)}`, `${String.fromCharCode(kanji.charCodeAt(0) + 2)}`],
        mnemonic: `To remember ${kanji}, think of it as representing ${kanji.charCodeAt(0) % 2 === 0 ? "water" : "fire"}.`,
        history: `This kanji originated from ancient Chinese pictographs representing ${kanji.charCodeAt(0) % 3 === 0 ? "nature" : "human activities"}.`,
      }))

      setKanjiData(mockKanjiData)
    } catch (error) {
      console.error("Error fetching kanji data:", error)
    } finally {
      setIsLoadingKanji(false)
    }
  }

  // Handle speaking the Japanese text
  const speakJapanese = async () => {
    if (isSpeaking) {
      Speech.stop()
      setIsSpeaking(false)
      return
    }

    setIsSpeaking(true)

    try {
      const textToSpeak = selectedWord.kanji || selectedWord.word || ""

      await Speech.speak(textToSpeak, {
        language: "ja-JP",
        rate: 0.75,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    } catch (error) {
      console.error("Error speaking:", error)
      setIsSpeaking(false)
    }
  }

  // Handle kanji selection
  const handleKanjiSelect = (kanji: string) => {
    const kanjiInfo = kanjiData.find((k) => k.literal === kanji)
    if (kanjiInfo) {
      setSelectedKanji(kanji)
      setSelectedKanjiData(kanjiInfo)
      setShowKanjiDetail(true)
    }
  }

  // Get JLPT level name
  const getJlptLevelName = (level: number): string => {
    if (level >= 1 && level <= 5) {
      return `N${level}`
    }
    return "Unknown"
  }

  // Get school grade name
  const getGradeName = (grade: number): string => {
    if (grade === 8) return "Secondary School"
    if (grade === 9) return "High School"
    if (grade === 10) return "University"
    if (grade >= 1 && grade <= 6) return `Elementary School Grade ${grade}`
    return "Unknown"
  }

  // Add this function to handle marking a word as reviewed
  const handleMarkAsReviewed = async () => {
    if (!selectedWord) return

    const wordId = selectedWord.id || selectedWord.word

    try {
      // Get existing word data
      const data = (await loadWordData(wordId)) || {
        id: wordId,
        word: selectedWord.word || selectedWord.kanji,
        kanji: selectedWord.kanji,
      }

      const reviewCount = (data.reviewCount || 0) + 1

      // Save updated data
      await saveWordData({
        ...data,
        lastReviewed: Date.now(),
        reviewCount,
      })

      // Update local state
      setWordData((prev) => (prev ? { ...prev, lastReviewed: Date.now(), reviewCount } : null))

      // Show confirmation
      Alert.alert("Success", "Word marked as reviewed")
    } catch (error) {
      console.error("Error marking word as reviewed:", error)
      Alert.alert("Error", "Failed to mark word as reviewed")
    }
  }

  // Add this function to handle sharing the word
  const handleShareWord = async () => {
    try {
      const message = `Check out this Japanese word: ${selectedWord.kanji || selectedWord.word} (${selectedWord.meaning})`

      // Use the Share API if available
      if (Share && Share.share) {
        await Share.share({
          message,
          title: "Japanese Word",
        })
      } else {
        // Fallback
        Alert.alert("Share", "Sharing is not available on this platform")
      }
    } catch (error) {
      console.error("Error sharing word:", error)
      Alert.alert("Error", "Failed to share word")
    }
  }

  // Add a function to handle adding the word to flashcards
  const handleAddToFlashcards = async () => {
    if (!selectedWord) return

    const wordId = selectedWord.id || selectedWord.word

    try {
      const success = await addWordToFlashcards(wordId)

      if (success) {
        Alert.alert("Success", "Word added to flashcards")
      } else {
        Alert.alert("Error", "Failed to add word to flashcards")
      }
    } catch (error) {
      console.error("Error adding word to flashcards:", error)
      Alert.alert("Error", "Failed to add word to flashcards")
    }
  }

  // Add this function after the DetailScreen function declaration but before the return statement
  // This will save the word data to AsyncStorage
  const saveWordData = async (wordData: Partial<WordData>) => {
    try {
      // Get existing word data if it exists
      const existingDataJson = await AsyncStorage.getItem(`word-data-${wordData.id || wordData.word}`)
      const existingData = existingDataJson ? JSON.parse(existingDataJson) : {}

      // Merge with new data
      const updatedData = { ...existingData, ...wordData, lastUpdated: Date.now() }

      // Save back to AsyncStorage
      await AsyncStorage.setItem(`word-data-${wordData.id || wordData.word}`, JSON.stringify(updatedData))
      return true
    } catch (error) {
      console.error("Error saving word data:", error)
      return false
    }
  }

  // Add this function to load word data
  const loadWordData = async (wordId: string): Promise<Partial<WordData> | null> => {
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

  // Add this function to save a note
  const saveNote = async (wordId: string, noteText: string) => {
    try {
      // Get existing word data
      const wordData = (await loadWordData(wordId)) || {}

      // Create new note
      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        timestamp: Date.now(),
      }

      // Add to existing notes or create new notes array
      const updatedNotes = wordData.notes ? [...wordData.notes, newNote] : [newNote]

      // Save updated word data
      await saveWordData({ ...wordData, id: wordId, notes: updatedNotes })
      return newNote
    } catch (error) {
      console.error("Error saving note:", error)
      return null
    }
  }

  // Add this function to delete a note
  const deleteNote = async (wordId: string, noteId: string) => {
    try {
      // Get existing word data
      const wordData = (await loadWordData(wordId)) || {}

      // Filter out the note to delete
      const updatedNotes = wordData.notes ? wordData.notes.filter((note) => note.id !== noteId) : []

      // Save updated word data
      await saveWordData({ ...wordData, id: wordId, notes: updatedNotes })
      return true
    } catch (error) {
      console.error("Error deleting note:", error)
      return false
    }
  }

  // Add this useEffect to load word data when the component mounts
  useEffect(() => {
    const loadData = async () => {
      if (selectedWord) {
        setIsLoadingWordData(true)

        // Load word data from AsyncStorage
        const data = await loadWordData(selectedWord.id || selectedWord.word)

        if (data) {
          setWordData(data)
          if (data.notes) setNotes(data.notes)
          if (data.synonyms) setSynonyms(data.synonyms)
          if (data.antonyms) setAntonyms(data.antonyms)
          if (data.collocations) setCollocations(data.collocations)
          if (data.usageNotes) setUsageNotes(data.usageNotes)
        } else {
          // If no data exists, generate and save initial data
          generateInitialWordData()
        }

        setIsLoadingWordData(false)
      }
    }

    loadData()
  }, [selectedWord])

  // Add this function to generate initial word data
  const generateInitialWordData = useCallback(async () => {
    if (!selectedWord) return

    // Generate mock data as before
    const mockSynonyms = [
      `${selectedWord.kanji}と同じ`,
      `${selectedWord.kanji}に似ている`,
      `${selectedWord.kanji}のような`,
    ]

    const mockAntonyms = [`${selectedWord.kanji}の反対`, `${selectedWord.kanji}ではない`]

    const mockCollocations = [
      `${selectedWord.kanji}を使う`,
      `${selectedWord.kanji}がある`,
      `${selectedWord.kanji}になる`,
      `${selectedWord.kanji}する`,
    ]

    const mockUsageNotes = `"${selectedWord.kanji}" is commonly used in ${
      selectedWord.jlpt ? `JLPT N${selectedWord.jlpt}` : "everyday"
    } Japanese. It's frequently seen in ${
      selectedWord.common ? "common expressions" : "specific contexts"
    }. Be careful not to confuse it with similar words.`

    // Set state
    setSynonyms(mockSynonyms)
    setAntonyms(mockAntonyms)
    setCollocations(mockCollocations)
    setUsageNotes(mockUsageNotes)

    // Save to AsyncStorage
    const initialData = {
      id: selectedWord.id || selectedWord.word,
      word: selectedWord.word || selectedWord.kanji,
      kanji: selectedWord.kanji,
      hiragana: selectedWord.hiragana,
      romaji: selectedWord.romaji,
      meaning: selectedWord.meaning,
      partOfSpeech: selectedWord.partOfSpeech || "Noun",
      jlpt: selectedWord.jlpt,
      common: selectedWord.common,
      notes: [],
      synonyms: mockSynonyms,
      antonyms: mockAntonyms,
      collocations: mockCollocations,
      usageNotes: mockUsageNotes,
      sentence: selectedWord.sentence,
      sentence_romaji: selectedWord.sentence_romaji,
      sentence_translation: selectedWord.sentence_translation,
      frequency: Math.floor(Math.random() * 5000) + 1,
      lastReviewed: Date.now(),
      reviewCount: 0,
    }

    await saveWordData(initialData)
    setWordData(initialData)
  }, [selectedWord])

  // Add these functions to handle notes
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedWord) return

    const wordId = selectedWord.id || selectedWord.word
    const savedNote = await saveNote(wordId, newNote.trim())

    if (savedNote) {
      setNotes((prev) => [...prev, savedNote])
      setNewNote("")
      setIsAddingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedWord) return

    const wordId = selectedWord.id || selectedWord.word
    const success = await deleteNote(wordId, noteId)

    if (success) {
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
    }
  }

  // Add this function to track word study progress
  const trackWordProgress = async () => {
    if (!selectedWord) return

    const wordId = selectedWord.id || selectedWord.word

    try {
      // Get existing word data
      const data = (await loadWordData(wordId)) || {
        id: wordId,
        word: selectedWord.word || selectedWord.kanji,
        kanji: selectedWord.kanji,
      }

      // Update study progress
      const now = Date.now()
      const studyHistory = data.studyHistory || []
      studyHistory.push(now)

      // Keep only the last 10 study sessions
      const recentHistory = studyHistory.slice(-10)

      // Save updated data
      await saveWordData({
        ...data,
        studyHistory: recentHistory,
        lastStudied: now,
      })

      console.log("Word study progress tracked")
    } catch (error) {
      console.error("Error tracking word progress:", error)
    }
  }

  // Call this function when the component mounts to track study progress
  useEffect(() => {
    if (selectedWord) {
      trackWordProgress()
    }
  }, [selectedWord])

  // Replace the existing useEffect for loading autoplay setting with this:
  useEffect(() => {
    const loadAutoPlaySetting = async () => {
      try {
        const autoPlay = await getAutoPlayPronunciation()
        setAutoPlayPronunciation(autoPlay)
      } catch (error) {
        console.error("Error loading autoplay setting:", error)
        // Default to true if there's an error
        setAutoPlayPronunciation(true)
      }
    }

    loadAutoPlaySetting()
  }, [])

  // Add this useEffect to automatically play pronunciation when word is loaded
  useEffect(() => {
    // Auto-play pronunciation if setting is enabled and we have a word
    if (selectedWord && autoPlayPronunciation && !isSpeaking) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        speakJapanese()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [selectedWord, autoPlayPronunciation])

  // Add this helper function to extract the main meaning from a longer meaning string
  const extractMainMeaning = (meaning: string): { mainMeaning: string; additionalMeanings: string[] } => {
    if (!meaning) return { mainMeaning: "", additionalMeanings: [] }

    // Split by common delimiters: semicolons, commas, periods
    const parts = meaning
      .split(/[;,.]/)
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length === 0) return { mainMeaning: meaning, additionalMeanings: [] }

    // First part is the main meaning
    const mainMeaning = parts[0]

    // Rest are additional meanings
    const additionalMeanings = parts.slice(1)

    return { mainMeaning, additionalMeanings }
  }

  // Update the renderMeaningTab function to display main meaning separately
  const renderMeaningTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Definition</Text>

        {/* Extract main and additional meanings */}
        {(() => {
          const { mainMeaning, additionalMeanings } = extractMainMeaning(
            selectedWord.meaning || selectedWord.english || "",
          )

          return (
            <>
              {/* Main meaning - with improved design */}
              <View style={[styles.mainDefinitionContainer, theme === "dark" && styles.darkMainDefinitionContainer]}>
                <Text style={[styles.mainDefinition, theme === "dark" && styles.darkMainDefinition]}>
                  {mainMeaning}
                </Text>
              </View>

              {/* Additional meanings - if any */}
              {additionalMeanings.length > 0 && (
                <View
                  style={[
                    styles.additionalMeaningsContainer,
                    theme === "dark" && styles.darkAdditionalMeaningsContainer,
                  ]}
                >
                  <Text style={[styles.additionalMeaningsLabel, theme === "dark" && styles.darkSecondaryText]}>
                    Additional meanings:
                  </Text>
                  {additionalMeanings.map((meaning, index) => (
                    <Text key={index} style={[styles.additionalMeaning, theme === "dark" && styles.darkText]}>
                      • {meaning}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )
        })()}
      </View>

      {/* Rest of the renderMeaningTab function remains unchanged */}
      {/* Part of Speech */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Part of Speech</Text>
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{selectedWord.partOfSpeech || "Noun"}</Text>
          </View>
          {selectedWord.jlpt && (
            <View style={[styles.tag, styles.jlptTag]}>
              <Text style={styles.tagText}>{selectedWord.jlpt}</Text>
            </View>
          )}
          {selectedWord.common && (
            <View style={[styles.tag, styles.commonTag]}>
              <Text style={styles.tagText}>Common</Text>
            </View>
          )}
        </View>
      </View>

      {/* Usage Notes - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Usage Notes</Text>
        <View style={[styles.usageCard, theme === "dark" && styles.darkUsageCard]}>
          <View style={styles.usageHeader}>
            <Lightbulb size={18} color={theme === "dark" ? colors.darkText : colors.accent} />
            <Text style={[styles.usageHeaderText, theme === "dark" && styles.darkText]}>How to use this word</Text>
          </View>
          <Text style={[styles.usageText, theme === "dark" && styles.darkText]}>{usageNotes}</Text>
        </View>
      </View>

      {/* Example Sentence */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Example</Text>
        <View style={[styles.exampleCard, theme === "dark" && styles.darkExampleCard]}>
          <Text style={[styles.japaneseExample, theme === "dark" && styles.darkText]}>
            {selectedWord.sentence || `${selectedWord.kanji}を使った例文です。`}
          </Text>
          <Text style={[styles.romajiExample, theme === "dark" && styles.darkSecondaryText]}>
            {selectedWord.sentence_romaji || `${selectedWord.romaji} o tsukatta reibun desu.`}
          </Text>
          <Text style={[styles.englishExample, theme === "dark" && styles.darkSecondaryText]}>
            {selectedWord.sentence_translation || `This is an example sentence using ${selectedWord.meaning}.`}
          </Text>
        </View>
      </View>

      {/* Collocations - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Common Collocations</Text>
        <View style={[styles.collocationsCard, theme === "dark" && styles.darkCollocationsCard]}>
          <View style={styles.collocationsHeader}>
            <Repeat size={18} color={theme === "dark" ? colors.darkText : colors.tertiary} />
            <Text style={[styles.collocationsHeaderText, theme === "dark" && styles.darkText]}>
              Words commonly used with {selectedWord.kanji}
            </Text>
          </View>
          <View style={styles.collocationsGrid}>
            {collocations.map((collocation, index) => (
              <View key={index} style={styles.collocationItem}>
                <Text style={[styles.collocationText, theme === "dark" && styles.darkText]}>{collocation}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Related Words */}
      {relatedWords.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Related Phrases</Text>
          {relatedWords.map((example, index) => (
            <View key={index} style={[styles.exampleCard, theme === "dark" && styles.darkExampleCard]}>
              <Text style={[styles.japaneseExample, theme === "dark" && styles.darkText]}>{example.japanese}</Text>
              <Text style={[styles.romajiExample, theme === "dark" && styles.darkSecondaryText]}>{example.romaji}</Text>
              <Text style={[styles.englishExample, theme === "dark" && styles.darkSecondaryText]}>
                {example.english}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Synonyms and Antonyms - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Synonyms & Antonyms</Text>
        <View style={styles.synonymsContainer}>
          <View style={[styles.synonymsCard, theme === "dark" && styles.darkSynonymsCard]}>
            <View style={styles.synonymsHeader}>
              <ArrowUpDown size={16} color={theme === "dark" ? colors.darkText : colors.secondary} />
              <Text style={[styles.synonymsHeaderText, theme === "dark" && styles.darkText]}>Synonyms</Text>
            </View>
            {synonyms.map((synonym, index) => (
              <Text key={index} style={[styles.synonymText, theme === "dark" && styles.darkText]}>
                • {synonym}
              </Text>
            ))}
          </View>

          <View style={[styles.antonymsCard, theme === "dark" && styles.darkAntonymsCard]}>
            <View style={styles.antonymsHeader}>
              <Zap size={16} color={theme === "dark" ? colors.darkText : colors.error} />
              <Text style={[styles.antonymsHeaderText, theme === "dark" && styles.darkText]}>Antonyms</Text>
            </View>
            {antonyms.map((antonym, index) => (
              <Text key={index} style={[styles.antonymText, theme === "dark" && styles.darkText]}>
                • {antonym}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Common Mistakes - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Common Mistakes</Text>
        <View style={[styles.mistakesCard, theme === "dark" && styles.darkMistakesCard]}>
          <View style={styles.mistakesHeader}>
            <AlertTriangle size={18} color={theme === "dark" ? colors.darkText : colors.warning} />
            <Text style={[styles.mistakesHeaderText, theme === "dark" && styles.darkText]}>Watch out for</Text>
          </View>
          <Text style={[styles.mistakesText, theme === "dark" && styles.darkText]}>
            {`Don't confuse "${selectedWord.kanji}" with similar-looking or similar-sounding words. Pay attention to the context when using this word.`}
          </Text>
          <View style={styles.mistakeExample}>
            <Text style={[styles.mistakeExampleHeader, theme === "dark" && styles.darkSecondaryText]}>
              Incorrect usage:
            </Text>
            <Text style={[styles.mistakeExampleText, theme === "dark" && styles.darkText]}>
              {`${selectedWord.kanji}を間違えて使う例文です。`}
            </Text>
            <Text style={[styles.mistakeExampleTranslation, theme === "dark" && styles.darkSecondaryText]}>
              {`This is an example of incorrectly using ${selectedWord.meaning}.`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )

  // Render the kanji tab content
  const renderKanjiTab = () => (
    <View style={styles.tabContent}>
      {isLoadingKanji ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === "dark" ? colors.darkText : colors.primary} />
          <Text style={[styles.loadingText, theme === "dark" && styles.darkText]}>Loading kanji data...</Text>
        </View>
      ) : kanjiData.length > 0 ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Kanji Breakdown</Text>
            <View style={styles.kanjiGrid}>
              {kanjiData.map((kanji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.kanjiCard, theme === "dark" && styles.darkKanjiCard]}
                  onPress={() => handleKanjiSelect(kanji.literal)}
                >
                  <Text style={[styles.kanjiChar, theme === "dark" && styles.darkText]}>{kanji.literal}</Text>
                  <View style={styles.kanjiInfoRow}>
                    <Text style={[styles.kanjiGrade, theme === "dark" && styles.darkSecondaryText]}>
                      Grade {kanji.grade}
                    </Text>
                    <Text style={[styles.kanjiJlpt, theme === "dark" && styles.darkSecondaryText]}>
                      JLPT N{kanji.jlpt}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Readings</Text>
            {kanjiData.map((kanji, index) => (
              <View key={index} style={[styles.readingCard, theme === "dark" && styles.darkReadingCard]}>
                <View style={styles.readingHeader}>
                  <Text style={[styles.readingKanji, theme === "dark" && styles.darkText]}>{kanji.literal}</Text>
                </View>
                <View style={styles.readingSection}>
                  <Text style={[styles.readingType, theme === "dark" && styles.darkSecondaryText]}>On'yomi:</Text>
                  <Text style={[styles.readingText, theme === "dark" && styles.darkText]}>
                    {kanji.onyomi.join(", ")}
                  </Text>
                </View>
                <View style={styles.readingSection}>
                  <Text style={[styles.readingType, theme === "dark" && styles.darkSecondaryText]}>Kun'yomi:</Text>
                  <Text style={[styles.readingText, theme === "dark" && styles.darkText]}>
                    {kanji.kunyomi.join(", ")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.noKanjiContainer}>
          <Text style={[styles.noKanjiText, theme === "dark" && styles.darkText]}>No kanji found in this word.</Text>
        </View>
      )}
    </View>
  )

  // Render the conjugation tab content with enhanced information
  const renderConjugationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Verb Forms</Text>
        {selectedWord.partOfSpeech === "Verb" || selectedWord.partOfSpeech === "verb" ? (
          <View style={styles.conjugationTable}>
            {[
              { form: "Dictionary", value: selectedWord.japanese || selectedWord.kanji, notes: "Basic form" },
              { form: "Masu Form", value: selectedWord.japanese + "ます", notes: "Polite present affirmative" },
              { form: "Masen Form", value: selectedWord.japanese + "ません", notes: "Polite present negative" },
              { form: "Mashita Form", value: selectedWord.japanese + "ました", notes: "Polite past affirmative" },
              { form: "Masendeshita", value: selectedWord.japanese + "ませんでした", notes: "Polite past negative" },
              { form: "Te Form", value: selectedWord.japanese + "て", notes: "Used for requests, connecting actions" },
              { form: "Ta Form", value: selectedWord.japanese + "た", notes: "Plain past affirmative" },
              { form: "Negative", value: selectedWord.japanese + "ない", notes: "Plain present negative" },
              { form: "Passive", value: selectedWord.japanese + "られる", notes: "Something is done to the subject" },
              { form: "Causative", value: selectedWord.japanese + "させる", notes: "Make/let someone do something" },
              { form: "Potential", value: selectedWord.japanese + "える", notes: "Can do something" },
              { form: "Conditional", value: selectedWord.japanese + "えば", notes: "If one does something" },
              { form: "Volitional", value: selectedWord.japanese + "おう", notes: "Let's do something" },
            ].map((item, index) => (
              <View
                key={index}
                style={[
                  styles.conjugationRow,
                  index % 2 === 0 && styles.evenRow,
                  theme === "dark" && styles.darkConjugationRow,
                  theme === "dark" && index % 2 === 0 && styles.darkEvenRow,
                ]}
              >
                <View style={styles.conjugationFormContainer}>
                  <Text style={[styles.conjugationForm, theme === "dark" && styles.darkText]}>{item.form}</Text>
                  <Text style={[styles.conjugationNotes, theme === "dark" && styles.darkSecondaryText]}>
                    {item.notes}
                  </Text>
                </View>
                <Text style={[styles.conjugationValue, theme === "dark" && styles.darkText]}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : selectedWord.partOfSpeech === "Adjective" || selectedWord.partOfSpeech === "adjective" ? (
          <View style={styles.conjugationTable}>
            {[
              { form: "Dictionary", value: selectedWord.japanese || selectedWord.kanji, notes: "Basic form" },
              { form: "Negative", value: selectedWord.japanese + "くない", notes: "Not ~" },
              { form: "Past", value: selectedWord.japanese + "かった", notes: "Was ~" },
              { form: "Past Negative", value: selectedWord.japanese + "くなかった", notes: "Was not ~" },
              { form: "Te Form", value: selectedWord.japanese + "くて", notes: "Used for connecting adjectives" },
              { form: "Adverbial", value: selectedWord.japanese + "く", notes: "~ly" },
            ].map((item, index) => (
              <View
                key={index}
                style={[
                  styles.conjugationRow,
                  index % 2 === 0 && styles.evenRow,
                  theme === "dark" && styles.darkConjugationRow,
                  theme === "dark" && index % 2 === 0 && styles.darkEvenRow,
                ]}
              >
                <View style={styles.conjugationFormContainer}>
                  <Text style={[styles.conjugationForm, theme === "dark" && styles.darkText]}>{item.form}</Text>
                  <Text style={[styles.conjugationNotes, theme === "dark" && styles.darkSecondaryText]}>
                    {item.notes}
                  </Text>
                </View>
                <Text style={[styles.conjugationValue, theme === "dark" && styles.darkText]}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noConjugation, theme === "dark" && styles.darkSecondaryText]}>
            No conjugation information available for this word type.
          </Text>
        )}
      </View>

      {/* Grammar Notes - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Grammar Notes</Text>
        <View style={[styles.grammarCard, theme === "dark" && styles.darkGrammarCard]}>
          <Text style={[styles.grammarText, theme === "dark" && styles.darkText]}>
            {selectedWord.partOfSpeech === "Verb" || selectedWord.partOfSpeech === "verb"
              ? `This verb belongs to Group ${Math.floor(Math.random() * 3) + 1}. When conjugating, pay attention to the stem changes.`
              : selectedWord.partOfSpeech === "Adjective" || selectedWord.partOfSpeech === "adjective"
                ? `This is an ${Math.random() > 0.5 ? "i-adjective" : "na-adjective"}. The conjugation pattern follows standard rules.`
                : `This ${selectedWord.partOfSpeech || "noun"} follows standard Japanese grammar rules.`}
          </Text>

          <View style={styles.grammarExample}>
            <Text style={[styles.grammarExampleHeader, theme === "dark" && styles.darkSecondaryText]}>
              Example pattern:
            </Text>
            <Text style={[styles.grammarExampleText, theme === "dark" && styles.darkText]}>
              {selectedWord.partOfSpeech === "Verb" || selectedWord.partOfSpeech === "verb"
                ? `[Subject] は [Object] を ${selectedWord.kanji}ます。`
                : selectedWord.partOfSpeech === "Adjective" || selectedWord.partOfSpeech === "adjective"
                  ? `[Noun] は ${selectedWord.kanji}です。`
                  : `[Sentence] は ${selectedWord.kanji}です。`}
            </Text>
            <Text style={[styles.grammarExampleTranslation, theme === "dark" && styles.darkSecondaryText]}>
              {selectedWord.partOfSpeech === "Verb" || selectedWord.partOfSpeech === "verb"
                ? `[Subject] [Object] ${selectedWord.meaning}.`
                : selectedWord.partOfSpeech === "Adjective" || selectedWord.partOfSpeech === "adjective"
                  ? `[Noun] is ${selectedWord.meaning}.`
                  : `[Sentence] is ${selectedWord.meaning}.`}
            </Text>
          </View>
        </View>
      </View>

      {/* Usage Patterns - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Usage Patterns</Text>
        <View style={[styles.patternsCard, theme === "dark" && styles.darkPatternsCard]}>
          <View style={styles.patternItem}>
            <Text style={[styles.patternTitle, theme === "dark" && styles.darkText]}>{selectedWord.kanji}＋[Noun]</Text>
            <Text style={[styles.patternDescription, theme === "dark" && styles.darkSecondaryText]}>
              Used to describe a noun with this {selectedWord.partOfSpeech || "word"}
            </Text>
          </View>

          <View style={styles.patternItem}>
            <Text style={[styles.patternTitle, theme === "dark" && styles.darkText]}>[Verb]＋{selectedWord.kanji}</Text>
            <Text style={[styles.patternDescription, theme === "dark" && styles.darkSecondaryText]}>
              Used after a verb to indicate {selectedWord.meaning}
            </Text>
          </View>

          <View style={styles.patternItem}>
            <Text style={[styles.patternTitle, theme === "dark" && styles.darkText]}>
              {selectedWord.kanji}＋[Particle]
            </Text>
            <Text style={[styles.patternDescription, theme === "dark" && styles.darkSecondaryText]}>
              Common particle usage with this word
            </Text>
          </View>
        </View>
      </View>
    </View>
  )

  // Update the renderNotesTab function to use real notes
  const renderNotesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Your Notes</Text>

        {notes.length > 0 ? (
          <View style={styles.notesContainer}>
            {notes.map((note) => (
              <View key={note.id} style={[styles.noteItem, theme === "dark" && styles.darkNoteItem]}>
                <Text style={[styles.noteItemText, theme === "dark" && styles.darkText]}>{note.text}</Text>
                <View style={styles.noteItemFooter}>
                  <Text style={[styles.noteItemDate, theme === "dark" && styles.darkSecondaryText]}>
                    {new Date(note.timestamp).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity style={styles.deleteNoteButton} onPress={() => handleDeleteNote(note.id)}>
                    <Text style={styles.deleteNoteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.noteCard, theme === "dark" && styles.darkNoteCard]}>
            <Text style={[styles.noteText, theme === "dark" && styles.darkSecondaryText]}>
              You haven't added any notes for this word yet. Tap the button below to add your first note.
            </Text>
            <TouchableOpacity style={styles.addNoteButton} onPress={() => setIsAddingNote(true)}>
              <Text style={styles.addNoteButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAddingNote && (
          <View style={[styles.addNoteContainer, theme === "dark" && styles.darkAddNoteContainer]}>
            <TextInput
              style={[styles.addNoteInput, theme === "dark" && styles.darkAddNoteInput]}
              placeholder="Write your note here..."
              placeholderTextColor={theme === "dark" ? "#777777" : "#999999"}
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />
            <View style={styles.addNoteActions}>
              <TouchableOpacity
                style={styles.cancelNoteButton}
                onPress={() => {
                  setNewNote("")
                  setIsAddingNote(false)
                }}
              >
                <Text style={styles.cancelNoteButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveNoteButton, !newNote.trim() && styles.disabledButton]}
                onPress={handleAddNote}
                disabled={!newNote.trim()}
              >
                <Text style={styles.saveNoteButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isAddingNote && notes.length > 0 && (
          <TouchableOpacity style={styles.addAnotherNoteButton} onPress={() => setIsAddingNote(true)}>
            <Text style={styles.addAnotherNoteButtonText}>Add Another Note</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Study Tips - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Study Tips</Text>
        <View style={[styles.studyTipsCard, theme === "dark" && styles.darkStudyTipsCard]}>
          <View style={styles.studyTip}>
            <View style={styles.studyTipIconContainer}>
              <Lightbulb size={18} color="#FFFFFF" />
            </View>
            <View style={styles.studyTipContent}>
              <Text style={[styles.studyTipTitle, theme === "dark" && styles.darkText]}>Create a mnemonic</Text>
              <Text style={[styles.studyTipText, theme === "dark" && styles.darkSecondaryText]}>
                {`Associate "${selectedWord.kanji}" with a visual image or story to help remember it.`}
              </Text>
            </View>
          </View>

          <View style={styles.studyTip}>
            <View style={[styles.studyTipIconContainer, { backgroundColor: colors.accent }]}>
              <Repeat size={18} color="#FFFFFF" />
            </View>
            <View style={styles.studyTipContent}>
              <Text style={[styles.studyTipTitle, theme === "dark" && styles.darkText]}>Use in sentences</Text>
              <Text style={[styles.studyTipText, theme === "dark" && styles.darkSecondaryText]}>
                Practice using this word in different contexts to reinforce your memory.
              </Text>
            </View>
          </View>

          <View style={styles.studyTip}>
            <View style={[styles.studyTipIconContainer, { backgroundColor: colors.tertiary }]}>
              <Zap size={18} color="#FFFFFF" />
            </View>
            <View style={styles.studyTipContent}>
              <Text style={[styles.studyTipTitle, theme === "dark" && styles.darkText]}>Review regularly</Text>
              <Text style={[styles.studyTipText, theme === "dark" && styles.darkSecondaryText]}>
                Add this word to your spaced repetition system for optimal retention.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Related Words - New section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Related Words to Study</Text>
        <View style={styles.relatedWordsGrid}>
          {Array.from({ length: 4 }, (_, i) => (
            <TouchableOpacity key={i} style={[styles.relatedWordCard, theme === "dark" && styles.darkRelatedWordCard]}>
              <Text style={[styles.relatedWordText, theme === "dark" && styles.darkText]}>
                {`${selectedWord.kanji}${i + 1}`}
              </Text>
              <Text style={[styles.relatedWordMeaning, theme === "dark" && styles.darkSecondaryText]}>
                {`Related word ${i + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  // If showing kanji detail, render the KanjiDetailScreen
  if (showKanjiDetail && selectedKanjiData) {
    return (
      <SafeAreaView style={[styles.container, theme === "dark" && styles.darkContainer]}>
        <View style={[styles.header, theme === "dark" && styles.darkHeader]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowKanjiDetail(false)}>
            <ArrowLeft size={24} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, theme === "dark" && styles.darkText]}>Kanji Detail: {selectedKanji}</Text>
        </View>
        <KanjiDetailScreen kanjiData={selectedKanjiData} isLoading={false} theme={theme} word={selectedWord} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.darkContainer]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          theme === "dark" && styles.darkAnimatedHeader,
          { opacity: headerOpacity, height: headerHeight },
        ]}
      >
        <Text style={[styles.animatedHeaderTitle, theme === "dark" && styles.darkText]} numberOfLines={1}>
          {selectedWord.japanese || selectedWord.kanji}
        </Text>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={[styles.header, theme === "dark" && styles.darkHeader]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedWord(null)}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <ArrowLeft size={22} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={speakJapanese}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Volume2
                size={22}
                color={theme === "dark" ? "#FFFFFF" : "#000000"}
                style={isSpeaking ? { opacity: 0.5 } : {}}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.favoriteButton, isFavorite && styles.activeFavoriteButton]}
              onPress={() => toggleFavorite(selectedWord)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={22}
                color={isFavorite ? "#FFFFFF" : theme === "dark" ? "#FFFFFF" : "#000000"}
                fill={isFavorite ? colors.accent : "transparent"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Word Info */}
        <View style={styles.wordContainer}>
          <Text style={[styles.wordJapanese, theme === "dark" && styles.darkText]}>
            {selectedWord.japanese || selectedWord.kanji}
          </Text>
          <Text style={[styles.wordReading, theme === "dark" && styles.darkSecondaryText]}>
            {selectedWord.reading || selectedWord.romaji || selectedWord.hiragana}
          </Text>

          {/* JLPT and Grade badges */}
          <View style={styles.badgesContainer}>
            {selectedWord.jlpt && (
              <View style={[styles.badge, styles.jlptBadge]}>
                <Text style={styles.badgeText}>JLPT {selectedWord.jlpt}</Text>
              </View>
            )}
            {selectedWord.common && (
              <View style={[styles.badge, styles.commonBadge]}>
                <Text style={styles.badgeText}>Common</Text>
              </View>
            )}
            {/* New frequency badge */}
            <View style={[styles.badge, styles.frequencyBadge]}>
              <Text style={styles.badgeText}>Frequency: {Math.floor(Math.random() * 5000) + 1}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickAction} onPress={handleMarkAsReviewed}>
            <Bookmark size={20} color={theme === "dark" ? colors.darkText : colors.text} />
            <Text style={[styles.quickActionText, theme === "dark" && styles.darkSecondaryText]}>Review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleShareWord}>
            <Share2 size={20} color={theme === "dark" ? colors.darkText : colors.text} />
            <Text style={[styles.quickActionText, theme === "dark" && styles.darkSecondaryText]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleAddToFlashcards}>
            <Layers size={20} color={theme === "dark" ? colors.darkText : colors.text} />
            <Text style={[styles.quickActionText, theme === "dark" && styles.darkSecondaryText]}>Flashcards</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              setActiveTab("notes")
              setIsAddingNote(true)
            }}
          >
            <MessageCircle size={20} color={theme === "dark" ? colors.darkText : colors.text} />
            <Text style={[styles.quickActionText, theme === "dark" && styles.darkSecondaryText]}>Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContainer}
          style={[styles.tabsContainer, theme === "dark" && styles.darkTabsContainer]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "meaning" && styles.activeTab]}
            onPress={() => setActiveTab("meaning")}
          >
            <BookOpen
              size={16}
              color={activeTab === "meaning" ? colors.primary : theme === "dark" ? "#777777" : "#999999"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "meaning" && styles.activeTabText,
                theme === "dark" && styles.darkTabText,
                activeTab === "meaning" && theme === "dark" && styles.darkActiveTabText,
              ]}
            >
              Meaning
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "kanji" && styles.activeTab]}
            onPress={() => setActiveTab("kanji")}
          >
            <Brush
              size={16}
              color={activeTab === "kanji" ? colors.primary : theme === "dark" ? "#777777" : "#999999"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "kanji" && styles.activeTabText,
                theme === "dark" && styles.darkTabText,
                activeTab === "kanji" && theme === "dark" && styles.darkActiveTabText,
              ]}
            >
              Kanji
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "conjugation" && styles.activeTab]}
            onPress={() => setActiveTab("conjugation")}
          >
            <Grid
              size={16}
              color={activeTab === "conjugation" ? colors.primary : theme === "dark" ? "#777777" : "#999999"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "conjugation" && styles.activeTabText,
                theme === "dark" && styles.darkTabText,
                activeTab === "conjugation" && theme === "dark" && styles.darkActiveTabText,
              ]}
            >
              Conjugation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "notes" && styles.activeTab]}
            onPress={() => setActiveTab("notes")}
          >
            <List size={16} color={activeTab === "notes" ? colors.primary : theme === "dark" ? "#777777" : "#999999"} />
            <Text
              style={[
                styles.tabText,
                activeTab === "notes" && styles.activeTabText,
                theme === "dark" && styles.darkTabText,
                activeTab === "notes" && theme === "dark" && styles.darkActiveTabText,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === "meaning" && renderMeaningTab()}
        {activeTab === "kanji" && renderKanjiTab()}
        {activeTab === "conjugation" && renderConjugationTab()}
        {activeTab === "notes" && renderNotesTab()}
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

// Add new styles for the enhanced content
const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  animatedHeader: {
    position: "absolute",
    top: 15,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 100,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  darkAnimatedHeader: {
    backgroundColor: "rgba(18, 18, 18, 0.95)",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  animatedHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    marginTop: 8,
  },
  darkHeader: {
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
  },
  activeFavoriteButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 8,
  },
  wordContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  wordJapanese: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 5,
    color: "#000000",
  },
  wordReading: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 10,
  },
  badgesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 5,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 5,
    marginBottom: 5,
  },
  jlptBadge: {
    backgroundColor: colors.accent,
  },
  commonBadge: {
    backgroundColor: colors.tertiary,
  },
  frequencyBadge: {
    backgroundColor: colors.info,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAction: {
    alignItems: "center",
    padding: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 5,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999999",
    marginLeft: 4,
  },
  activeTabText: {
    color: colors.primary,
  },
  darkTabText: {
    color: "#777777",
  },
  darkActiveTabText: {
    color: colors.primary,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#000000",
  },
  // New improved styles for main definition
  mainDefinitionContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.03)", // Much more subtle background
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 2, // Thinner border
    borderLeftColor: colors.primary, // Keep the primary color but with a thinner border
    borderRightWidth: 2, // Thinner border
    borderRightColor: colors.primary, // Keep the primary color but with a thinner border
    shadowColor: "rgba(0, 0, 0, 0.05)", // Lighter shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Reduced opacity
    shadowRadius: 4,
    elevation: 2,
  },
  darkMainDefinitionContainer: {
    backgroundColor: "rgba(40, 40, 40, 0.5)", // More subtle dark background
    borderLeftColor: colors.primary,
  },
  mainDefinition: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    color: colors.text, // Changed from primary color to regular text color
    textAlign: "center",
  },
  darkMainDefinition: {
    color: "#FFFFFF",
  },
  additionalMeaningsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  darkAdditionalMeaningsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  additionalMeaningsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 8,
  },
  additionalMeaning: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
    marginBottom: 4,
  },
  definition: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  jlptTag: {
    backgroundColor: colors.accent,
  },
  commonTag: {
    backgroundColor: colors.tertiary,
  },
  tagText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  exampleCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  darkExampleCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.primary,
  },
  japaneseExample: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#000000",
  },
  romajiExample: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666666",
  },
  englishExample: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 10,
  },
  audioButton: {
    alignSelf: "flex-end",
  },
  kanjiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kanjiCard: {
    width: (width - 50) / 2,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  darkKanjiCard: {
    backgroundColor: "#2A2A2A",
  },
  kanjiChar: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 10,
    color: "#000000",
  },
  kanjiInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  kanjiGrade: {
    fontSize: 12,
    color: "#666666",
  },
  kanjiJlpt: {
    fontSize: 12,
    color: "#666666",
  },
  viewDetailsButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  readingCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  darkReadingCard: {
    backgroundColor: "#2A2A2A",
  },
  readingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  readingKanji: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  readingAudioButton: {
    padding: 5,
  },
  readingSection: {
    marginBottom: 8,
  },
  readingType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 4,
  },
  readingText: {
    fontSize: 16,
    color: "#000000",
  },
  noKanjiContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noKanjiText: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
  },
  conjugationTable: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  conjugationRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  darkConjugationRow: {
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  evenRow: {
    backgroundColor: "#F8F8F8",
  },
  darkEvenRow: {
    backgroundColor: "#2A2A2A",
  },
  conjugationFormContainer: {
    flex: 1,
  },
  conjugationForm: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  conjugationNotes: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  conjugationValue: {
    flex: 1,
    fontSize: 14,
    color: "#000000",
    textAlign: "right",
  },
  noConjugation: {
    fontSize: 16,
    color: "#999999",
    fontStyle: "italic",
  },
  noteCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  darkNoteCard: {
    backgroundColor: "#2A2A2A",
  },
  noteText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 15,
  },
  addNoteButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  addNoteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  // New styles for usage notes
  usageCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  darkUsageCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.accent,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  usageHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  usageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
  },
  // New styles for collocations
  collocationsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkCollocationsCard: {
    backgroundColor: "#2A2A2A",
  },
  collocationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  collocationsHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  collocationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  collocationItem: {
    width: "48%",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  collocationText: {
    fontSize: 14,
    color: "#000000",
  },
  // New styles for synonyms and antonyms
  synonymsContainer: {
    flexDirection: "column",
    gap: 10,
  },
  synonymsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  darkSynonymsCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.secondary,
  },
  synonymsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  synonymsHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  synonymText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 5,
  },
  antonymsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  darkAntonymsCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.error,
  },
  antonymsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  antonymsHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  antonymText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 5,
  },
  // New styles for common mistakes
  mistakesCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  darkMistakesCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.warning,
  },
  mistakesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  mistakesHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  mistakesText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
    marginBottom: 12,
  },
  mistakeExample: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  mistakeExampleHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 4,
  },
  mistakeExampleText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  mistakeExampleTranslation: {
    fontSize: 12,
    color: "#666666",
  },
  // New styles for grammar notes
  grammarCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  darkGrammarCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.info,
  },
  grammarText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
    marginBottom: 12,
  },
  grammarExample: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    padding: 10,
  },
  grammarExampleHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 4,
  },
  grammarExampleText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  grammarExampleTranslation: {
    fontSize: 12,
    color: "#666666",
  },
  // New styles for usage patterns
  patternsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkPatternsCard: {
    backgroundColor: "#2A2A2A",
  },
  patternItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  patternDescription: {
    fontSize: 14,
    color: "#666666",
  },
  // New styles for study tips
  studyTipsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkStudyTipsCard: {
    backgroundColor: "#2A2A2A",
  },
  studyTip: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  studyTipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studyTipContent: {
    flex: 1,
  },
  studyTipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  studyTipText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  // New styles for related words
  relatedWordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  relatedWordCard: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  darkRelatedWordCard: {
    backgroundColor: "#2A2A2A",
  },
  relatedWordText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  relatedWordMeaning: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSecondaryText: {
    color: "#AAAAAA",
  },
  // Add these styles for the notes functionality
  notesContainer: {
    marginBottom: 15,
  },
  noteItem: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.tertiary,
  },
  darkNoteItem: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.tertiary,
  },
  noteItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
    marginBottom: 10,
  },
  noteItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteItemDate: {
    fontSize: 12,
    color: "#666666",
  },
  deleteNoteButton: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deleteNoteButtonText: {
    fontSize: 12,
    color: "#FF3B30",
  },
  addNoteContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  darkAddNoteContainer: {
    backgroundColor: "#2A2A2A",
  },
  addNoteInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333333",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  darkAddNoteInput: {
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  addNoteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  cancelNoteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  cancelNoteButtonText: {
    fontSize: 14,
    color: "#666666",
  },
  saveNoteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  saveNoteButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  addAnotherNoteButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginTop: 10,
  },
  addAnotherNoteButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  tabsScrollContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
})

export default DetailScreen
