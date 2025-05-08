"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from "react-native"
import { globalStyles, colors } from "../../styles/globalStyles"
import { Volume2, Grid3, BookOpen, History, AlertCircle, User, Share2, Bookmark } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Speech from "expo-speech"

interface KanjiData {
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
  // Add new fields for enhanced information
  similar?: string[]
  mnemonic?: string
  history?: string
  level?: string
  common_words?: Array<{
    word: string
    reading: string
    meaning: string
  }>
}

interface KanjiStoredData {
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
}

interface KanjiDetailScreenProps {
  kanjiData: KanjiData | null
  isLoading: boolean
  theme: "light" | "dark"
  word: any
}

const KanjiDetailScreen: React.FC<KanjiDetailScreenProps> = ({ kanjiData, isLoading, theme, word }) => {
  const [activeTab, setActiveTab] = useState("info")
  const [storedData, setStoredData] = useState<Partial<KanjiStoredData> | null>(null)
  const [isLoadingStoredData, setIsLoadingStoredData] = useState(true)
  const [userNote, setUserNote] = useState("")
  const [userNotes, setUserNotes] = useState<string[]>([])
  const [isAddingNote, setIsAddingNote] = useState(false)
  // Add this near the top of the file with other state variables
  const [autoPlayPronunciation, setAutoPlayPronunciation] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Remove the strokeImages state and useEffect for stroke images

  // This will save the kanji data to AsyncStorage
  const saveKanjiData = async (kanjiData: Partial<KanjiStoredData>) => {
    try {
      // Get existing kanji data if it exists
      const existingDataJson = await AsyncStorage.getItem(`kanji-data-${kanjiData.literal}`)
      const existingData = existingDataJson ? JSON.parse(existingDataJson) : {}

      // Merge with new data
      const updatedData = { ...existingData, ...kanjiData, lastUpdated: Date.now() }

      // Save back to AsyncStorage
      await AsyncStorage.setItem(`kanji-data-${kanjiData.literal}`, JSON.stringify(updatedData))
      return true
    } catch (error) {
      console.error("Error saving kanji data:", error)
      return false
    }
  }

  // Add this function to load kanji data
  const loadKanjiData = async (kanji: string): Promise<Partial<KanjiStoredData> | null> => {
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

  // Add this function to add a user note
  const addKanjiNote = async (kanji: string, note: string) => {
    try {
      // Get existing kanji data
      const kanjiData = (await loadKanjiData(kanji)) || { literal: kanji }

      // Add to existing notes or create new notes array
      const updatedNotes = kanjiData.userNotes ? [...kanjiData.userNotes, note] : [note]

      // Save updated kanji data
      await saveKanjiData({ ...kanjiData, userNotes: updatedNotes })
      return updatedNotes
    } catch (error) {
      console.error("Error adding kanji note:", error)
      return null
    }
  }

  // Add this useEffect to load kanji data when the component mounts
  useEffect(() => {
    const loadData = async () => {
      if (kanjiData) {
        setIsLoadingStoredData(true)

        // Load kanji data from AsyncStorage
        const data = await loadKanjiData(kanjiData.literal)

        if (data) {
          setStoredData(data)
          if (data.userNotes) setUserNotes(data.userNotes)
        } else {
          // If no data exists, save the current kanji data
          await saveKanjiData(kanjiData)
          setStoredData(kanjiData)
        }

        setIsLoadingStoredData(false)
      }
    }

    loadData()
  }, [kanjiData])

  // Add this function to handle adding a note
  const handleAddNote = async () => {
    if (!userNote.trim() || !kanjiData) return

    const updatedNotes = await addKanjiNote(kanjiData.literal, userNote.trim())

    if (updatedNotes) {
      setUserNotes(updatedNotes)
      setUserNote("")
      setIsAddingNote(false)
    }
  }

  // Add this function to handle marking as reviewed
  const handleMarkAsReviewed = async () => {
    if (!kanjiData) return

    const data = (await loadKanjiData(kanjiData.literal)) || { literal: kanjiData.literal }
    const reviewCount = (data.reviewCount || 0) + 1

    await saveKanjiData({
      ...data,
      lastReviewed: Date.now(),
      reviewCount,
    })

    // Update stored data
    setStoredData((prev) => (prev ? { ...prev, lastReviewed: Date.now(), reviewCount } : null))
  }

  // Add this function to handle sharing the kanji
  const handleShareKanji = async () => {
    if (!kanjiData) return

    try {
      const message = `Check out this kanji: ${kanjiData.literal} (${kanjiData.meanings.join(", ")})`

      // Use the Share API if available
      if (Share && Share.share) {
        await Share.share({
          message,
          title: "Japanese Kanji",
        })
      } else {
        // Fallback
        Alert.alert("Share", "Sharing is not available on this platform")
      }
    } catch (error) {
      console.error("Error sharing kanji:", error)
      Alert.alert("Error", "Failed to share kanji")
    }
  }

  // Add this useEffect to load the autoplay setting
  useEffect(() => {
    const loadAutoPlaySetting = async () => {
      try {
        const storedAutoPlay = await AsyncStorage.getItem("autoPlayPronunciation")
        if (storedAutoPlay !== null) {
          setAutoPlayPronunciation(JSON.parse(storedAutoPlay))
        }
      } catch (error) {
        console.error("Error loading autoplay setting:", error)
      }
    }

    loadAutoPlaySetting()
  }, [])

  // Add this useEffect to automatically play pronunciation when kanji is loaded
  useEffect(() => {
    // Auto-play pronunciation if setting is enabled and we have kanji data
    if (kanjiData && !isLoading && autoPlayPronunciation && !isSpeaking) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        speakKanji()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [kanjiData, isLoading, autoPlayPronunciation])

  // Add this function to speak the kanji
  const speakKanji = async () => {
    if (isSpeaking || !kanjiData) return

    setIsSpeaking(true)

    try {
      const textToSpeak = kanjiData.literal || ""

      await Speech.speak(textToSpeak, {
        language: "ja-JP",
        rate: 0.75,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    } catch (error) {
      console.error("Error speaking kanji:", error)
      setIsSpeaking(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme === "dark" ? colors.darkText : colors.primary} />
        <Text style={[styles.loadingText, theme === "dark" && globalStyles.darkText]}>Loading kanji data...</Text>
      </View>
    )
  }

  if (!kanjiData) {
    return (
      <View style={[styles.noDataContainer]}>
        <Text style={[styles.noDataText, theme === "dark" && globalStyles.darkText]}>
          No kanji data available for this word.
        </Text>
        <Text style={[styles.noDataSubtext, theme === "dark" && globalStyles.darkText]}>
          This word might not contain any kanji characters or the kanji data is not available.
        </Text>
      </View>
    )
  }

  // Enhanced info tab with more comprehensive information
  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {/* Kanji Overview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Overview</Text>
        <View style={[styles.overviewCard, theme === "dark" && styles.darkOverviewCard]}>
          <View style={styles.kanjiContainer}>
            <Text style={[styles.kanjiCharacter, theme === "dark" && styles.darkText]}>{kanjiData.literal}</Text>
            <TouchableOpacity style={styles.audioButton} onPress={speakKanji}>
              <Volume2 size={20} color={theme === "dark" ? "#FFFFFF" : colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.kanjiActions}>
            <TouchableOpacity style={styles.kanjiActionButton} onPress={handleShareKanji}>
              <Share2 size={18} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.kanjiActionButton} onPress={handleMarkAsReviewed}>
              <Bookmark size={18} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, theme === "dark" && styles.darkSecondaryText]}>Grade</Text>
              <Text style={[styles.detailValue, theme === "dark" && styles.darkText]}>{kanjiData.grade || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, theme === "dark" && styles.darkSecondaryText]}>JLPT</Text>
              <Text style={[styles.detailValue, theme === "dark" && styles.darkText]}>
                {kanjiData.jlpt ? `N${kanjiData.jlpt}` : "N/A"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, theme === "dark" && styles.darkSecondaryText]}>Strokes</Text>
              <Text style={[styles.detailValue, theme === "dark" && styles.darkText]}>
                {kanjiData.stroke_count || "N/A"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, theme === "dark" && styles.darkSecondaryText]}>Frequency</Text>
              <Text style={[styles.detailValue, theme === "dark" && styles.darkText]}>
                {kanjiData.frequency ? `#${kanjiData.frequency}` : "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Meanings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Meanings</Text>
        <View style={[styles.meaningsContainer, theme === "dark" && styles.darkMeaningsContainer]}>
          {kanjiData.meanings.map((meaning, index) => (
            <View key={index} style={styles.meaningItem}>
              <Text style={[styles.meaningText, theme === "dark" && styles.darkText]}>{meaning}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Readings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Readings</Text>
        <View style={[styles.readingsCard, theme === "dark" && styles.darkReadingsCard]}>
          <View style={styles.readingSection}>
            <Text style={[styles.readingType, theme === "dark" && styles.darkSecondaryText]}>On'yomi (音読み)</Text>
            <View style={styles.readingValues}>
              {kanjiData.onyomi && kanjiData.onyomi.length > 0 ? (
                kanjiData.onyomi.map((reading, index) => (
                  <View key={index} style={styles.readingBadge}>
                    <Text style={styles.readingBadgeText}>{reading}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noReadingText, theme === "dark" && styles.darkSecondaryText]}>
                  No on'yomi readings available
                </Text>
              )}
            </View>
          </View>

          <View style={styles.readingSection}>
            <Text style={[styles.readingType, theme === "dark" && styles.darkSecondaryText]}>Kun'yomi (訓読み)</Text>
            <View style={styles.readingValues}>
              {kanjiData.kunyomi && kanjiData.kunyomi.length > 0 ? (
                kanjiData.kunyomi.map((reading, index) => (
                  <View key={index} style={[styles.readingBadge, styles.kunyomiBadge]}>
                    <Text style={styles.readingBadgeText}>{reading}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noReadingText, theme === "dark" && styles.darkSecondaryText]}>
                  No kun'yomi readings available
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Components */}
      {kanjiData.parts && kanjiData.parts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Components</Text>
          <View style={[styles.componentsCard, theme === "dark" && styles.darkComponentsCard]}>
            <View style={styles.componentsList}>
              {kanjiData.parts.map((part, index) => (
                <View key={index} style={styles.componentItem}>
                  <Text style={[styles.componentChar, theme === "dark" && styles.darkText]}>{part}</Text>
                </View>
              ))}
            </View>
            {kanjiData.radical && (
              <View style={styles.radicalSection}>
                <Text style={[styles.radicalLabel, theme === "dark" && styles.darkSecondaryText]}>
                  Radical: {kanjiData.radical}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* New section: Mnemonic */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Mnemonic Aid</Text>
        <View style={[styles.mnemonicCard, theme === "dark" && styles.darkMnemonicCard]}>
          <Text style={[styles.mnemonicText, theme === "dark" && styles.darkText]}>
            {kanjiData.mnemonic ||
              `To remember the kanji "${kanjiData.literal}", imagine ${kanjiData.meanings[0]} as ${
                kanjiData.parts ? `a combination of ${kanjiData.parts.join(" and ")}` : "a unique symbol"
              }.`}
          </Text>
        </View>
      </View>

      {/* New section: Similar Kanji */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Similar Kanji</Text>
        <View style={[styles.similarKanjiCard, theme === "dark" && styles.darkSimilarKanjiCard]}>
          {kanjiData.similar && kanjiData.similar.length > 0 ? (
            <View style={styles.similarKanjiList}>
              {kanjiData.similar.map((similar, index) => (
                <TouchableOpacity key={index} style={styles.similarKanjiItem}>
                  <Text style={[styles.similarKanjiChar, theme === "dark" && styles.darkText]}>{similar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.similarKanjiList}>
              {/* Generate some mock similar kanji based on stroke count */}
              {Array.from({ length: 3 }, (_, i) => (
                <TouchableOpacity key={i} style={styles.similarKanjiItem}>
                  <Text style={[styles.similarKanjiChar, theme === "dark" && styles.darkText]}>
                    {String.fromCharCode(19968 + (kanjiData.stroke_count || 5) * (i + 1))}
                  </Text>
                  <Text style={[styles.similarKanjiNote, theme === "dark" && styles.darkSecondaryText]}>
                    {i === 0 ? "Similar form" : i === 1 ? "Similar meaning" : "Common confusion"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={[styles.similarKanjiTip, theme === "dark" && styles.darkSecondaryText]}>
            <AlertCircle
              size={14}
              color={theme === "dark" ? colors.darkTextSecondary : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            Be careful not to confuse these similar-looking kanji
          </Text>
        </View>
      </View>
    </View>
  )

  // New tab: Historical Information
  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Etymology</Text>
        <View style={[styles.historyCard, theme === "dark" && styles.darkHistoryCard]}>
          <Text style={[styles.historyText, theme === "dark" && styles.darkText]}>
            {kanjiData.history ||
              `The kanji "${kanjiData.literal}" originated from ancient Chinese pictographs. 
              It evolved from a drawing representing ${kanjiData.meanings[0] || "its concept"}.
              Over time, the character was simplified to its current form.`}
          </Text>

          <View style={styles.evolutionContainer}>
            <Text style={[styles.evolutionTitle, theme === "dark" && styles.darkSecondaryText]}>
              Character Evolution
            </Text>
            <View style={styles.evolutionStages}>
              <View style={styles.evolutionStage}>
                <Text style={[styles.evolutionChar, theme === "dark" && styles.darkText]}>甲</Text>
                <Text style={[styles.evolutionLabel, theme === "dark" && styles.darkSecondaryText]}>Oracle</Text>
              </View>
              <View style={styles.evolutionArrow}>
                <Text style={[theme === "dark" && styles.darkSecondaryText]}>→</Text>
              </View>
              <View style={styles.evolutionStage}>
                <Text style={[styles.evolutionChar, theme === "dark" && styles.darkText]}>甲</Text>
                <Text style={[styles.evolutionLabel, theme === "dark" && styles.darkSecondaryText]}>Bronze</Text>
              </View>
              <View style={styles.evolutionArrow}>
                <Text style={[theme === "dark" && styles.darkSecondaryText]}>→</Text>
              </View>
              <View style={styles.evolutionStage}>
                <Text style={[styles.evolutionChar, theme === "dark" && styles.darkText]}>{kanjiData.literal}</Text>
                <Text style={[styles.evolutionLabel, theme === "dark" && styles.darkSecondaryText]}>Modern</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Cultural Context</Text>
        <View style={[styles.culturalCard, theme === "dark" && styles.darkCulturalCard]}>
          <Text style={[styles.culturalText, theme === "dark" && styles.darkText]}>
            {`This kanji is commonly used in ${kanjiData.level || "everyday"} Japanese. 
            It appears in many ${kanjiData.jlpt ? `JLPT N${kanjiData.jlpt}` : "common"} vocabulary words and expressions.
            Understanding this character is essential for reading ${
              kanjiData.grade && kanjiData.grade <= 3
                ? "elementary school texts"
                : kanjiData.grade && kanjiData.grade <= 6
                  ? "middle school texts"
                  : "advanced texts"
            }.`}
          </Text>
        </View>
      </View>
    </View>
  )

  const renderExamplesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Common Words</Text>
        {kanjiData.examples && kanjiData.examples.length > 0 ? (
          kanjiData.examples.map((example, index) => (
            <View key={index} style={[styles.exampleCard, theme === "dark" && styles.darkExampleCard]}>
              <View style={styles.exampleHeader}>
                <Text style={[styles.exampleWord, theme === "dark" && styles.darkText]}>{example.word}</Text>
                <TouchableOpacity style={styles.exampleAudioButton}>
                  <Volume2 size={16} color={theme === "dark" ? "#FFFFFF" : colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.exampleReading, theme === "dark" && styles.darkSecondaryText]}>
                {example.reading}
              </Text>
              <Text style={[styles.exampleMeaning, theme === "dark" && styles.darkSecondaryText]}>
                {example.meaning}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noExamplesText, theme === "dark" && styles.darkSecondaryText]}>
            No example words available for this kanji.
          </Text>
        )}
      </View>

      {/* New section: Example Sentences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Example Sentences</Text>
        <View style={[styles.sentencesCard, theme === "dark" && styles.darkSentencesCard]}>
          {/* Generate mock sentences using the kanji */}
          {Array.from({ length: 3 }, (_, i) => (
            <View key={i} style={styles.sentenceItem}>
              <Text style={[styles.sentenceJapanese, theme === "dark" && styles.darkText]}>
                {`${kanjiData.literal}を使った例文です。${i + 1}つ目の例です。`}
              </Text>
              <Text style={[styles.sentenceRomaji, theme === "dark" && styles.darkSecondaryText]}>
                {`${kanjiData.literal} o tsukatta reibun desu. ${i + 1}tsume no rei desu.`}
              </Text>
              <Text style={[styles.sentenceEnglish, theme === "dark" && styles.darkSecondaryText]}>
                {`This is an example sentence using ${kanjiData.literal}. This is example #${i + 1}.`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )

  // Add this new tab for user notes and review
  const renderUserTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Your Notes</Text>

        {userNotes.length > 0 ? (
          <View style={styles.userNotesContainer}>
            {userNotes.map((note, index) => (
              <View key={index} style={[styles.userNoteItem, theme === "dark" && styles.darkUserNoteItem]}>
                <Text style={[styles.userNoteText, theme === "dark" && styles.darkText]}>{note}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyNotesCard, theme === "dark" && styles.darkEmptyNotesCard]}>
            <Text style={[styles.emptyNotesText, theme === "dark" && styles.darkSecondaryText]}>
              You haven't added any notes for this kanji yet.
            </Text>
          </View>
        )}

        {isAddingNote ? (
          <View style={[styles.addNoteContainer, theme === "dark" && styles.darkAddNoteContainer]}>
            <TextInput
              style={[styles.addNoteInput, theme === "dark" && styles.darkAddNoteInput]}
              placeholder="Write your note here..."
              placeholderTextColor={theme === "dark" ? "#777777" : "#999999"}
              value={userNote}
              onChangeText={setUserNote}
              multiline
            />
            <View style={styles.addNoteActions}>
              <TouchableOpacity
                style={styles.cancelNoteButton}
                onPress={() => {
                  setUserNote("")
                  setIsAddingNote(false)
                }}
              >
                <Text style={styles.cancelNoteButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveNoteButton, !userNote.trim() && styles.disabledButton]}
                onPress={handleAddNote}
                disabled={!userNote.trim()}
              >
                <Text style={styles.saveNoteButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addNoteButton} onPress={() => setIsAddingNote(true)}>
            <Text style={styles.addNoteButtonText}>Add Note</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>Review Status</Text>
        <View style={[styles.reviewCard, theme === "dark" && styles.darkReviewCard]}>
          <View style={styles.reviewStats}>
            <View style={styles.reviewStat}>
              <Text style={[styles.reviewStatValue, theme === "dark" && styles.darkText]}>
                {storedData?.reviewCount || 0}
              </Text>
              <Text style={[styles.reviewStatLabel, theme === "dark" && styles.darkSecondaryText]}>Times Reviewed</Text>
            </View>

            <View style={styles.reviewStat}>
              <Text style={[styles.reviewStatValue, theme === "dark" && styles.darkText]}>
                {storedData?.lastReviewed ? new Date(storedData.lastReviewed).toLocaleDateString() : "Never"}
              </Text>
              <Text style={[styles.reviewStatLabel, theme === "dark" && styles.darkSecondaryText]}>Last Reviewed</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.markReviewedButton} onPress={handleMarkAsReviewed}>
            <Text style={styles.markReviewedButtonText}>Mark as Reviewed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tabs - Replace the strokes tab with history tab */}
      <View style={[styles.tabsContainer, theme === "dark" && styles.darkTabsContainer]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "info" && styles.activeTab]}
          onPress={() => setActiveTab("info")}
        >
          <BookOpen
            size={18}
            color={activeTab === "info" ? colors.primary : theme === "dark" ? "#777777" : "#999999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "info" && styles.activeTabText,
              theme === "dark" && styles.darkTabText,
              activeTab === "info" && theme === "dark" && styles.darkActiveTabText,
            ]}
          >
            Info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <History
            size={18}
            color={activeTab === "history" ? colors.primary : theme === "dark" ? "#777777" : "#999999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
              theme === "dark" && styles.darkTabText,
              activeTab === "history" && theme === "dark" && styles.darkActiveTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "examples" && styles.activeTab]}
          onPress={() => setActiveTab("examples")}
        >
          <Grid3
            size={18}
            color={activeTab === "examples" ? colors.primary : theme === "dark" ? "#777777" : "#999999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "examples" && styles.activeTabText,
              theme === "dark" && styles.darkTabText,
              activeTab === "examples" && theme === "dark" && styles.darkActiveTabText,
            ]}
          >
            Examples
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "user" && styles.activeTab]}
          onPress={() => setActiveTab("user")}
        >
          <User size={18} color={activeTab === "user" ? colors.primary : theme === "dark" ? "#777777" : "#999999"} />
          <Text
            style={[
              styles.tabText,
              activeTab === "user" && styles.activeTabText,
              theme === "dark" && styles.darkTabText,
              activeTab === "user" && theme === "dark" && styles.darkActiveTabText,
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "info" && renderInfoTab()}
      {activeTab === "history" && renderHistoryTab()}
      {activeTab === "examples" && renderExamplesTab()}
      {activeTab === "user" && renderUserTab()}
    </ScrollView>
  )
}

// Add new styles for the enhanced content
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  noDataSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
  },
  darkTabsContainer: {
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
    marginLeft: 5,
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
    paddingBottom: 20,
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
  overviewCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 20,
  },
  darkOverviewCard: {
    backgroundColor: "#2A2A2A",
  },
  kanjiContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  kanjiCharacter: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  audioButton: {
    marginLeft: 15,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  meaningsContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkMeaningsContainer: {
    backgroundColor: "#2A2A2A",
  },
  meaningItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  meaningText: {
    fontSize: 16,
    color: "#000000",
  },
  readingsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkReadingsCard: {
    backgroundColor: "#2A2A2A",
  },
  readingSection: {
    marginBottom: 15,
  },
  readingType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 10,
  },
  readingValues: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  readingBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  kunyomiBadge: {
    backgroundColor: colors.accent,
  },
  readingBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  noReadingText: {
    fontSize: 14,
    color: "#999999",
    fontStyle: "italic",
  },
  componentsCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkComponentsCard: {
    backgroundColor: "#2A2A2A",
  },
  componentsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  componentItem: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  componentChar: {
    fontSize: 20,
    color: "#000000",
  },
  radicalSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingTop: 15,
  },
  radicalLabel: {
    fontSize: 14,
    color: "#666666",
  },
  exampleCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  darkExampleCard: {
    backgroundColor: "#2A2A2A",
  },
  exampleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  exampleWord: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  exampleAudioButton: {
    padding: 5,
  },
  exampleReading: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 5,
  },
  exampleMeaning: {
    fontSize: 14,
    color: "#666666",
  },
  noExamplesText: {
    fontSize: 14,
    color: "#999999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  // New styles for mnemonic section
  mnemonicCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.tertiary,
  },
  darkMnemonicCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.tertiary,
  },
  mnemonicText: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
  },
  // New styles for similar kanji section
  similarKanjiCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkSimilarKanjiCard: {
    backgroundColor: "#2A2A2A",
  },
  similarKanjiList: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  similarKanjiItem: {
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    width: "30%",
  },
  similarKanjiChar: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  similarKanjiNote: {
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
  },
  similarKanjiTip: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
    textAlign: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // New styles for history tab
  historyCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkHistoryCard: {
    backgroundColor: "#2A2A2A",
  },
  historyText: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
    marginBottom: 15,
  },
  evolutionContainer: {
    marginTop: 10,
  },
  evolutionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 10,
  },
  evolutionStages: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  evolutionStage: {
    alignItems: "center",
  },
  evolutionChar: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  evolutionLabel: {
    fontSize: 12,
    color: "#666666",
  },
  evolutionArrow: {
    paddingHorizontal: 5,
  },
  // New styles for cultural context
  culturalCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  darkCulturalCard: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.info,
  },
  culturalText: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
  },
  // New styles for example sentences
  sentencesCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkSentencesCard: {
    backgroundColor: "#2A2A2A",
  },
  sentenceItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  sentenceJapanese: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 5,
  },
  sentenceRomaji: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 5,
    fontStyle: "italic",
  },
  sentenceEnglish: {
    fontSize: 14,
    color: "#666666",
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSecondaryText: {
    color: "#AAAAAA",
  },
  userNotesContainer: {
    marginBottom: 15,
  },
  userNoteItem: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.tertiary,
  },
  darkUserNoteItem: {
    backgroundColor: "#2A2A2A",
    borderLeftColor: colors.tertiary,
  },
  userNoteText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
  },
  emptyNotesCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
  },
  darkEmptyNotesCard: {
    backgroundColor: "#2A2A2A",
  },
  emptyNotesText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
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
  addNoteButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.primary,
    marginTop: 10,
  },
  addNoteButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  reviewCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  darkReviewCard: {
    backgroundColor: "#2A2A2A",
  },
  reviewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  reviewStat: {
    alignItems: "center",
  },
  reviewStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  reviewStatLabel: {
    fontSize: 12,
    color: "#666666",
  },
  markReviewedButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  markReviewedButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  kanjiActions: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
  },
  kanjiActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
})

export default KanjiDetailScreen
