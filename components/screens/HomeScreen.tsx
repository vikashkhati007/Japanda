"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  type FlatList,
  ScrollView,
  Animated,
  Easing,
} from "react-native"
import {
  Star,
  Calendar,
  Sparkles,
  TrendingUp,
  GraduationCap,
  RefreshCw,
  BookOpen,
  Book,
  Radio,
} from "lucide-react-native"
import { globalStyles, colors } from "../../styles/globalStyles"
import { searchWord } from "../../lib/utils"
import AsyncStorage from "@react-native-async-storage/async-storage"
import GradientBackground from "../GradientBackground"
import { wordCategories } from "@/lib/wordCategories"
import { useFocusEffect } from "@react-navigation/native"
import WordCardSkeleton from "../WordCardSkeleton"
import { getUserProfile } from "@/lib/user-store"
import { DeviceEventEmitter } from "react-native"
// Add the import for vocab.json at the top of the file, after the other imports
import vocab from "../../data/vocab.json"

interface Word {
  id?: string
  kanji: string
  romaji: string
  meaning: string
  sentence: string
  sentence_romaji?: string
  sentence_translation?: string
  hiragana?: string
  category?: string
  word?: string
  jlpt?: string | number
  level?: number
}

interface HomeScreenProps {
  theme: "light" | "dark"
  toggleFavorite: (word: Word) => void
  favorites: Word[]
  setSelectedWord: (word: Word) => void
  navigation?: any
}

// Update the clearHomeScreenCache function to clear all home screen data
export const clearHomeScreenCache = async () => {
  try {
    // Clear all home screen cached data
    await AsyncStorage.removeItem("dailyWords")
    await AsyncStorage.removeItem("cachedHomeScreenData")
    await AsyncStorage.removeItem("homeScrollPosition")
    console.log("Home screen cache cleared")
  } catch (error) {
    console.error("Error clearing home screen cache:", error)
  }
}

// Add a function to handle app restart
export const handleAppRestart = async () => {
  try {
    // Check when the app was last opened
    const lastOpened = await AsyncStorage.getItem("lastAppOpen")
    const now = new Date().toDateString()

    if (lastOpened !== now) {
      // If it's a new day, clear the cache
      await clearHomeScreenCache()
      // Update the last opened date
      await AsyncStorage.setItem("lastAppOpen", now)
    }
  } catch (error) {
    console.error("Error handling app restart:", error)
  }
}

export default function HomeScreen({ theme, toggleFavorite, favorites, setSelectedWord, navigation }: HomeScreenProps) {
  // Add this state variable at the top of the component
  const [userJlptLevel, setUserJlptLevel] = useState<string>("N5")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null)
  const [funnyWord, setFunnyWord] = useState<Word | null>(null)
  const [popularWords, setPopularWords] = useState<Word[]>([])
  const [studyWords, setStudyWords] = useState<Word[]>([])
  const [grammarWords, setGrammarWords] = useState<Word[]>([])
  const [previouslyShownWords, setPreviouslyShownWords] = useState<string[]>([])

  // Add state variables for dictionary words and loading state after the other state variables
  const [dictionaryWords, setDictionaryWords] = useState<Word[]>([])
  const [dictionaryWordsLoading, setDictionaryWordsLoading] = useState(true)

  // Add blinking animation for Live button
  const [blinkAnim] = useState(new Animated.Value(0))

  // Start blinking animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])



  // Skeleton loading states
  const [wordOfDayLoading, setWordOfDayLoading] = useState(true)
  const [funnyWordLoading, setFunnyWordLoading] = useState(true)
  const [popularWordsLoading, setPopularWordsLoading] = useState(true)
  const [studyWordsLoading, setStudyWordsLoading] = useState(true)
  const [grammarWordsLoading, setGrammarWordsLoading] = useState(true)

  // Scroll position tracking
  const flatListRef = useRef<FlatList>(null)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Save scroll position when navigating away and restore when coming back
  // Modify the useFocusEffect callback to better handle cached data
  useFocusEffect(
    useCallback(() => {
      // Check if we need to force a refresh (after JLPT level change)
      const checkForceRefresh = async () => {
        const forceRefresh = await AsyncStorage.getItem("forceHomeRefresh")
        if (forceRefresh === "true") {
          console.log("Forcing home screen refresh due to JLPT level change")
          // Clear the flag
          await AsyncStorage.removeItem("forceHomeRefresh")
          // Force a refresh
          setIsLoading(true)
          setWordOfDayLoading(true)
          setFunnyWordLoading(true)
          setPopularWordsLoading(true)
          setStudyWordsLoading(true)
          setGrammarWordsLoading(true)
          // Load fresh data
          await loadDailyWords()
          setIsLoading(false)
          // Reset scroll position
          setScrollPosition(0)
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
        }
      }

      checkForceRefresh()

      // Immediately turn off all skeleton loaders when the screen comes into focus
      setWordOfDayLoading(false)
      setFunnyWordLoading(false)
      setPopularWordsLoading(false)
      setStudyWordsLoading(false)
      setGrammarWordsLoading(false)
      setDictionaryWordsLoading(false)

      // When screen comes into focus, restore scroll position and check cached data
      const restoreScrollPosition = async () => {
        try {
          const savedPosition = await AsyncStorage.getItem("homeScrollPosition")
          if (savedPosition) {
            const position = Number.parseInt(savedPosition, 10)
            // Small delay to ensure the ScrollView has rendered
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({ offset: position, animated: false })
            }, 100)
          }
        } catch (error) {
          console.error("Error restoring scroll position:", error)
        }
      }

      if (!isLoading) {
        restoreScrollPosition()
      }

      // Check for cached data
      const checkCachedData = async () => {
        try {
          const cachedData = await AsyncStorage.getItem("cachedHomeScreenData")
          if (cachedData) {
            const parsedData = JSON.parse(cachedData)

            // Always use cached data when returning to the screen
            setWordOfDay(parsedData.wordOfDay)
            setFunnyWord(parsedData.funnyWord)
            setPopularWords(parsedData.popularWords || [])
            setStudyWords(parsedData.studyWords || [])
            setGrammarWords(parsedData.grammarWords || [])
            setDictionaryWords(parsedData.dictionaryWords || [])
            setPreviouslyShownWords(parsedData.previouslyShownWords || [])

            // Set loading to false since we have data
            setIsLoading(false)
          }
        } catch (error) {
          console.error("Error checking cached data:", error)
        }
      }

      checkCachedData()

      return () => {}
    }, []),
  )

  // Handle scroll events to save position
  const handleScroll = (event) => {
    const position = event.nativeEvent.contentOffset.y
    setScrollPosition(position)

    // Debounce saving to AsyncStorage to avoid too many writes
    if (saveScrollPositionTimeout.current) {
      clearTimeout(saveScrollPositionTimeout.current)
    }

    saveScrollPositionTimeout.current = setTimeout(() => {
      AsyncStorage.setItem("homeScrollPosition", position.toString())
    }, 300)
  }

  // Ref for debounce timeout
  const saveScrollPositionTimeout = useRef<NodeJS.Timeout | null>(null)

  // Add this function to filter words based on JLPT level
  const filterWordsByJlptLevel = (words: Word[], jlptLevel: string): Word[] => {
    // Convert JLPT level from "N5" format to number format (5)
    const targetLevel = Number.parseInt(jlptLevel.substring(1), 10)

    if (!targetLevel || isNaN(targetLevel)) {
      return words // Return all words if level is invalid
    }

    // Filter words to match EXACTLY the selected JLPT level
    const exactLevelWords = words.filter((word) => {
      // If word has jlpt property as a number
      if (word.jlpt && typeof word.jlpt === "number") {
        return word.jlpt === targetLevel
      }

      // If word has jlpt property as a string like "N5"
      if (word.jlpt && typeof word.jlpt === "string") {
        const wordLevel = Number.parseInt(word.jlpt.substring(1), 10)
        return !isNaN(wordLevel) && wordLevel === targetLevel
      }

      // If word has level property (some words might use this instead)
      if (word.level && typeof word.level === "number") {
        return word.level === targetLevel
      }

      // Default to showing the word if we can't determine its level
      // but only for N5 to ensure we have enough words
      return targetLevel === 5
    })

    // If we don't have enough words at the exact level, supplement with words from adjacent levels
    // This ensures we maintain similar quantity as N5 level
    if (exactLevelWords.length < 3 && targetLevel !== 5) {
      // First try to get words from one level higher (if not at N1)
      if (targetLevel > 1) {
        const higherLevelWords = words.filter((word) => {
          if (word.jlpt && typeof word.jlpt === "number") {
            return word.jlpt === targetLevel - 1
          }
          if (word.jlpt && typeof word.jlpt === "string") {
            const wordLevel = Number.parseInt(word.jlpt.substring(1), 10)
            return !isNaN(wordLevel) && wordLevel === targetLevel - 1
          }
          if (word.level && typeof word.level === "number") {
            return word.level === targetLevel - 1
          }
          return false
        })

        // Add higher level words until we have at least 3 words
        let i = 0
        while (exactLevelWords.length < 3 && i < higherLevelWords.length) {
          exactLevelWords.push(higherLevelWords[i])
          i++
        }
      }

      // If still not enough, add words from one level lower
      if (exactLevelWords.length < 3 && targetLevel < 5) {
        const lowerLevelWords = words.filter((word) => {
          if (word.jlpt && typeof word.jlpt === "number") {
            return word.jlpt === targetLevel + 1
          }
          if (word.jlpt && typeof word.jlpt === "string") {
            const wordLevel = Number.parseInt(word.jlpt.substring(1), 10)
            return !isNaN(wordLevel) && wordLevel === targetLevel + 1
          }
          if (word.level && typeof word.level === "number") {
            return word.level === targetLevel + 1
          }
          return false
        })

        // Add lower level words until we have at least 3 words
        let i = 0
        while (exactLevelWords.length < 3 && i < lowerLevelWords.length) {
          exactLevelWords.push(lowerLevelWords[i])
          i++
        }
      }
    }

    return exactLevelWords
  }

  // Modify the useEffect that loads initial data to better handle cached data
  // Modify the useEffect that loads initial data to prevent unnecessary fetching
  // Update the useEffect that loads initial data to remove references to the Explore section
  useEffect(() => {
    const loadUserJlptLevel = async () => {
      try {
        const profile = await getUserProfile()
        const userJlptLevel = profile.jlptLevel || "N5"
        setUserJlptLevel(userJlptLevel)
      } catch (error) {
        console.error("Error loading user JLPT level:", error)
      }
    }

    loadUserJlptLevel()

    // Add listener for JLPT level changes
    const jlptLevelChangedSubscription = DeviceEventEmitter.addListener("JLPT_LEVEL_CHANGED_EVENT", (level) => {
      console.log("HomeScreen received JLPT level change:", level)
      setUserJlptLevel(level)
    })

    // Improved initial data loading with better error handling and sequencing
    const loadInitialData = async () => {
      setIsLoading(true)

      try {
        // First check if we have cached screen state data (this is the most complete)
        const cachedScreenData = await AsyncStorage.getItem("cachedHomeScreenData")

        if (cachedScreenData) {
          const parsedData = JSON.parse(cachedScreenData)

          // Immediately set all data without showing skeleton loaders
          setWordOfDay(parsedData.wordOfDay)
          setFunnyWord(parsedData.funnyWord)
          setPopularWords(parsedData.popularWords || [])
          setStudyWords(parsedData.studyWords || [])
          setGrammarWords(parsedData.grammarWords || [])
          setDictionaryWords(parsedData.dictionaryWords || [])
          setPreviouslyShownWords(parsedData.previouslyShownWords || [])

          // Turn off all skeleton loaders immediately
          setWordOfDayLoading(false)
          setFunnyWordLoading(false)
          setPopularWordsLoading(false)
          setStudyWordsLoading(false)
          setGrammarWordsLoading(false)
          setDictionaryWordsLoading(false)
          setIsLoading(false)
          return // Exit early since we have complete data
        }

        // If no cached screen state, check for daily words cache
        const storedData = await AsyncStorage.getItem("dailyWords")
        if (storedData) {
          const dailyData = JSON.parse(storedData)
          const today = new Date().toDateString()

          // Use cached data if it exists, regardless of date
          if (dailyData.wordOfDay) setWordOfDay(dailyData.wordOfDay)
          if (dailyData.funnyWord) setFunnyWord(dailyData.funnyWord)
          if (dailyData.popularWords) setPopularWords(dailyData.popularWords)
          if (dailyData.studyWords) setStudyWords(dailyData.studyWords)
          if (dailyData.grammarWords) setGrammarWords(dailyData.grammarWords)
          if (dailyData.dictionaryWords) setDictionaryWords(dailyData.dictionaryWords)

          // Turn off loading states for data we have
          if (dailyData.wordOfDay) setWordOfDayLoading(false)
          if (dailyData.funnyWord) setFunnyWordLoading(false)
          if (dailyData.popularWords) setPopularWordsLoading(false)
          if (dailyData.studyWords) setStudyWordsLoading(false)
          if (dailyData.grammarWords) setGrammarWordsLoading(false)
          if (dailyData.dictionaryWords) setDictionaryWordsLoading(false)

          // If data is from today, we're fully loaded
          if (dailyData.date === today) {
            setIsLoading(false)
            // Save to screen state cache for future navigation
            saveScreenState()
            return
          }
        }

        // If we reach here, we need to load fresh data
        // Show skeleton loaders while fetching
        setWordOfDayLoading(true)
        setFunnyWordLoading(true)
        setPopularWordsLoading(true)
        setStudyWordsLoading(true)
        setGrammarWordsLoading(true)
        setDictionaryWordsLoading(true)

        // Fetch all data and wait for it to complete
        await fetchDailyWords()

        // Ensure loading is set to false after all data is loaded
        setIsLoading(false)
      } catch (error) {
        console.error("Error in initial data loading:", error)
        // Turn off loading states even if there's an error
        setWordOfDayLoading(false)
        setFunnyWordLoading(false)
        setPopularWordsLoading(false)
        setStudyWordsLoading(false)
        setGrammarWordsLoading(false)
        setDictionaryWordsLoading(false)
        setIsLoading(false)
      }
    }

    // Load initial data
    loadInitialData()

    // Clean up timeout on unmount
    return () => {
      jlptLevelChangedSubscription.remove()
      if (saveScrollPositionTimeout.current) {
        clearTimeout(saveScrollPositionTimeout.current)
      }
    }
  }, [])

  // Add a useFocusEffect to handle returning to the screen

  // Add a new effect to handle returning from details page
  useEffect(() => {
    // Check if we're returning from details and have data
    if (wordOfDay && funnyWord && popularWords.length > 0) {
      // Make sure all loading states are turned off
      setWordOfDayLoading(false)
      setFunnyWordLoading(false)
      setPopularWordsLoading(false)
      setStudyWordsLoading(false)
      setGrammarWordsLoading(false)
      setDictionaryWordsLoading(false)
    }
  }, [wordOfDay, funnyWord, popularWords])

  // Add a function to save the entire screen state when navigating to detail
  const saveScreenState = async () => {
    try {
      const screenData = {
        wordOfDay,
        funnyWord,
        popularWords,
        studyWords,
        grammarWords,
        dictionaryWords,
        previouslyShownWords,
        scrollPosition,
        // Add timestamps to help with debugging
        savedAt: Date.now(),
        date: new Date().toDateString(),
      }

      // Only save if we have actual data
      if (
        wordOfDay &&
        funnyWord &&
        popularWords &&
        popularWords.length > 0 &&
        studyWords &&
        studyWords.length > 0 &&
        grammarWords &&
        grammarWords.length > 0
      ) {
        await AsyncStorage.setItem("cachedHomeScreenData", JSON.stringify(screenData))
        console.log("Screen state saved successfully with complete data")
      } else {
        console.warn("Not saving incomplete screen state", {
          hasWordOfDay: !!wordOfDay,
          hasFunnyWord: !!funnyWord,
          popularWordsCount: popularWords?.length || 0,
          studyWordsCount: studyWords?.length || 0,
          grammarWordsCount: grammarWords?.length || 0,
        })
      }
    } catch (error) {
      console.error("Error saving screen state:", error)
    }
  }

  // Modify the handleWordCardPress function to save state before navigating
  const handleWordCardPress = (word: Word) => {
    // Save current scroll position before navigating
    AsyncStorage.setItem("homeScrollPosition", scrollPosition.toString())

    // Save entire screen state with all loading flags set to false
    // to ensure we don't show loaders when returning
    const screenData = {
      wordOfDay,
      funnyWord,
      popularWords,
      studyWords,
      grammarWords,
      dictionaryWords,
      previouslyShownWords,
      scrollPosition,
      // Add loading states to the cache to ensure they're false when we return
      wordOfDayLoading: false,
      funnyWordLoading: false,
      popularWordsLoading: false,
      studyWordsLoading: false,
      grammarWordsLoading: false,
      dictionaryWordsLoading: false,
    }

    AsyncStorage.setItem("cachedHomeScreenData", JSON.stringify(screenData))
      .then(() => {
        // Only navigate after state is saved
        setSelectedWord(word)
      })
      .catch((error) => {
        console.error("Error saving screen state:", error)
        // Still navigate even if saving fails
        setSelectedWord(word)
      })
  }

  // Modify the loadDailyWords function to handle explore words separately
  const loadDailyWords = async () => {
    try {
      // Load previously shown words
      const storedWords = await AsyncStorage.getItem("previouslyShownWords")
      if (storedWords) {
        setPreviouslyShownWords(JSON.parse(storedWords))
      }

      // Check if we already have today's words and if they're still valid
      const today = new Date().toDateString()
      const storedData = await AsyncStorage.getItem("dailyWords")
      const dailyData = storedData ? JSON.parse(storedData) : null

      if (dailyData && dailyData.date === today) {
        // Use cached data if it's from today - IMMEDIATELY without showing loaders
        setWordOfDay(dailyData.wordOfDay)
        setFunnyWord(dailyData.funnyWord)
        setPopularWords(dailyData.popularWords || [])
        setStudyWords(dailyData.studyWords || [])
        setGrammarWords(dailyData.grammarWords || [])
        setDictionaryWords(dailyData.dictionaryWords || [])

        // Turn off all skeleton loaders immediately
        setWordOfDayLoading(false)
        setFunnyWordLoading(false)
        setPopularWordsLoading(false)
        setStudyWordsLoading(false)
        setGrammarWordsLoading(false)
        setDictionaryWordsLoading(false)

        // Save the loaded data to our cache
        saveScreenState()
      } else {
        // Only show skeleton loaders when we actually need to fetch new data
        setWordOfDayLoading(true)
        setFunnyWordLoading(true)
        setPopularWordsLoading(true)
        setStudyWordsLoading(true)
        setGrammarWordsLoading(true)
        setDictionaryWordsLoading(true)

        // Fetch new data
        await fetchDailyWords()
      }
    } catch (error) {
      console.error("Error loading daily words:", error)
      // Turn off loading states even if there's an error
      setWordOfDayLoading(false)
      setFunnyWordLoading(false)
      setPopularWordsLoading(false)
      setStudyWordsLoading(false)
      setGrammarWordsLoading(false)
      setDictionaryWordsLoading(false)
    }
  }

  // Modify the fetchDailyWords function to preserve explore words when saving
  const fetchDailyWords = async () => {
    try {
      // Function to get a random item from an array that hasn't been shown recently
      const getRandomItem = (items: string[], shownItems: string[]) => {
        const availableItems = items.filter((item) => !shownItems.includes(item))
        const sourceArray = availableItems.length > 0 ? availableItems : items
        return sourceArray[Math.floor(Math.random() * sourceArray.length)]
      }

      // Load previously shown words
      const storedWords = await AsyncStorage.getItem("previouslyShownWords")
      if (storedWords) {
        setPreviouslyShownWords(JSON.parse(storedWords))
      }

      // Fetch more words than we need to ensure we have enough after filtering by JLPT level
      const fetchExtraWords = userJlptLevel !== "N5"

      // Fetch word of the day
      const dailyWord = getRandomItem(wordCategories.daily, previouslyShownWords)
      const wordPromise = searchWord(dailyWord)

      // Fetch funny word
      const funnyWordItem = getRandomItem(wordCategories.funny, previouslyShownWords)
      const funnyPromise = searchWord(funnyWordItem)

      // Fetch popular words (increased quantity)
      const popularPromises = []
      const selectedPopular = new Set<string>()
      const popularCount = fetchExtraWords ? 12 : 6 // Increased from 6:3 to 12:6

      while (selectedPopular.size < popularCount && selectedPopular.size < wordCategories.popular.length) {
        const word = getRandomItem(wordCategories.popular, [...previouslyShownWords, ...selectedPopular])
        if (!selectedPopular.has(word)) {
          selectedPopular.add(word)
          popularPromises.push(searchWord(word))
        }
      }

      // Fetch study words (increased quantity)
      const studyPromises = []
      const selectedStudy = new Set<string>()
      const studyCount = fetchExtraWords ? 12 : 6 // Increased from 6:3 to 12:6

      while (selectedStudy.size < studyCount && selectedStudy.size < wordCategories.study.length) {
        const word = getRandomItem(wordCategories.study, [...previouslyShownWords, ...selectedStudy])
        if (!selectedStudy.has(word)) {
          selectedStudy.add(word)
          studyPromises.push(searchWord(word))
        }
      }

      // Fetch grammar words (increased quantity)
      const grammarPromises = []
      const selectedGrammar = new Set<string>()
      const grammarCount = fetchExtraWords ? 12 : 6 // Increased from 6:3 to 12:6

      while (selectedGrammar.size < grammarCount && selectedGrammar.size < wordCategories.grammar.length) {
        const word = getRandomItem(wordCategories.grammar, [...previouslyShownWords, ...selectedGrammar])
        if (!selectedGrammar.has(word)) {
          selectedGrammar.add(word)
          grammarPromises.push(searchWord(word))
        }
      }

      // Wait for all promises to resolve
      const [wordResult, funnyResult, popularResults, studyResults, grammarResults] = await Promise.all([
        wordPromise,
        funnyPromise,
        Promise.all(popularPromises),
        Promise.all(studyPromises),
        Promise.all(grammarPromises),
      ])

      // Store results
      const wordOfDayData = wordResult.formattedResult
      const funnyWordData = funnyResult.formattedResult
      const popularWordsData = popularResults.map((result) => result.formattedResult)
      const studyWordsData = studyResults.map((result) => result.formattedResult)
      const grammarWordsData = grammarResults.map((result) => result.formattedResult)

      // Filter words based on user's JLPT level before setting state
      const filteredWordOfDayData =
        filterWordsByJlptLevel([wordResult.formattedResult], userJlptLevel)[0] || wordResult.formattedResult
      const filteredFunnyWordData =
        filterWordsByJlptLevel([funnyResult.formattedResult], userJlptLevel)[0] || funnyResult.formattedResult

      // Filter and increase limit to 6 words for each category
      const filteredPopularWordsData = filterWordsByJlptLevel(
        popularResults.map((result) => result.formattedResult),
        userJlptLevel,
      ).slice(0, 6) // Increased from 3 to 6

      const filteredStudyWordsData = filterWordsByJlptLevel(
        studyResults.map((result) => result.formattedResult),
        userJlptLevel,
      ).slice(0, 6) // Increased from 3 to 6

      const filteredGrammarWordsData = filterWordsByJlptLevel(
        grammarResults.map((result) => result.formattedResult),
        userJlptLevel,
      ).slice(0, 6) // Increased from 3 to 6

      // Update state with all data at once
      setWordOfDay(filteredWordOfDayData)
      setFunnyWord(filteredFunnyWordData)
      setPopularWords(filteredPopularWordsData)
      setStudyWords(filteredStudyWordsData)
      setGrammarWords(filteredGrammarWordsData)

      // Turn off all loading states
      setWordOfDayLoading(false)
      setFunnyWordLoading(false)
      setPopularWordsLoading(false)
      setStudyWordsLoading(false)
      setGrammarWordsLoading(false)

      // Track words we've shown to avoid repetition
      const newShownWords = [
        ...previouslyShownWords,
        wordOfDayData.kanji,
        funnyWordData.kanji,
        ...popularWordsData.map((w) => w.kanji),
        ...studyWordsData.map((w) => w.kanji),
        ...grammarWordsData.map((w) => w.kanji),
      ]

      // Keep only the last 100 words to avoid the list getting too large but still prevent repetition
      const trimmedShownWords = newShownWords.slice(-100)
      setPreviouslyShownWords(trimmedShownWords)
      await AsyncStorage.setItem("previouslyShownWords", JSON.stringify(trimmedShownWords))

      // Save to AsyncStorage
      const dailyData = {
        date: new Date().toDateString(),
        wordOfDay: wordOfDayData,
        funnyWord: funnyWordData,
        popularWords: popularWordsData,
        studyWords: studyWordsData,
        grammarWords: grammarWordsData,
      }

      await AsyncStorage.setItem("dailyWords", JSON.stringify(dailyData))

      // Save complete screen state
      saveScreenState()

      // Fetch dictionary words after other words are loaded
      await fetchDictionaryWords()
    } catch (error) {
      console.error("Error fetching daily words:", error)
      // Turn off loading states even if there's an error
      setWordOfDayLoading(false)
      setFunnyWordLoading(false)
      setPopularWordsLoading(false)
      setStudyWordsLoading(false)
      setGrammarWordsLoading(false)
      setDictionaryWordsLoading(false)
    }
  }

  // Replace the fetchDictionaryWords function with this updated version
  const fetchDictionaryWords = async () => {
    try {
      setDictionaryWordsLoading(true)

      // Use the vocab data from the imported JSON file
      // Convert the vocab data to the Word format
      const vocabWords: Word[] = vocab.map((item: any) => ({
        id: `vocab-${item.word}`,
        kanji: item.word,
        meaning: item.meaning,
        hiragana: item.furigana,
        romaji: item.romaji,
        level: item.level,
        jlpt: `N${item.level}`, // Convert numeric level to "N" format for consistency
        sentence: item.example || `${item.word}を使った例文です。`, // Use example if available or create a default
        sentence_translation: item.example_translation || `This is an example sentence using ${item.meaning}.`,
        category: "dictionary",
      }))

      // Extract numeric level from userJlptLevel (e.g., "N5" -> 5)
      const targetLevel = Number.parseInt(userJlptLevel.substring(1), 10)

      // Filter dictionary words to match the exact numeric level
      const filteredDictionaryWordsData = vocabWords
        .filter((word) => {
          // Check if the word's level matches the target level
          const wordLevel =
            typeof word.level === "number" ? word.level : word.level ? Number.parseInt(word.level.toString(), 10) : null

          return wordLevel === targetLevel
        })
        .slice(0, 6)

      // If we don't have enough words after filtering, add some from adjacent levels
      if (filteredDictionaryWordsData.length < 6) {
        // Try to get words from adjacent levels
        const additionalWords = vocabWords
          .filter((word) => {
            const wordLevel =
              typeof word.level === "number"
                ? word.level
                : word.level
                  ? Number.parseInt(word.level.toString(), 10)
                  : null

            // Include words from one level higher or lower
            return wordLevel === targetLevel + 1 || wordLevel === targetLevel - 1
          })
          .slice(0, 6 - filteredDictionaryWordsData.length)

        filteredDictionaryWordsData.push(...additionalWords)
      }

      // Ensure we have at least some data
      if (filteredDictionaryWordsData.length === 0) {
        // If no words match the filter, just use the first 6 words from vocab
        filteredDictionaryWordsData.push(...vocabWords.slice(0, 6))
      }

      setDictionaryWords(filteredDictionaryWordsData)
      setDictionaryWordsLoading(false)

      // Update the daily data with dictionary words
      const storedData = await AsyncStorage.getItem("dailyWords")
      if (storedData) {
        const dailyData = JSON.parse(storedData)
        dailyData.dictionaryWords = filteredDictionaryWordsData
        await AsyncStorage.setItem("dailyWords", JSON.stringify(dailyData))
      }

      // Update screen state with dictionary words
      saveScreenState()
    } catch (error) {
      console.error("Error fetching dictionary words:", error)
      // If there's an error, still try to show some data
      try {
        // Use first 6 words from vocab as fallback
        const fallbackWords = vocab.slice(0, 6).map((item: any) => ({
          id: `vocab-${item.word}`,
          kanji: item.word,
          meaning: item.meaning,
          hiragana: item.furigana,
          romaji: item.romaji,
          level: item.level,
          jlpt: `N${item.level}`,
          sentence: `${item.word}を使った例文です。`,
          sentence_translation: `This is an example sentence using ${item.meaning}.`,
          category: "dictionary",
        }))

        setDictionaryWords(fallbackWords)
      } catch (fallbackError) {
        console.error("Error setting fallback dictionary words:", fallbackError)
      }

      setDictionaryWordsLoading(false)
    }
  }

  // 2. Remove the _fetchMoreWords function
  // 3. Remove the _handleLoadMore function
  // 4. Remove the filterWordsByCategory function
  // 5. Remove the getNextCategory function

  const _onRefresh = async () => {
    setIsRefreshing(true)
    setDictionaryWordsLoading(true)

    // Check if we need to fetch new data or can use cache
    const today = new Date().toDateString()
    const storedData = await AsyncStorage.getItem("dailyWords")
    const dailyData = storedData ? JSON.parse(storedData) : null

    if (dailyData && dailyData.date === today) {
      // If we already have today's data, just use it without showing loaders
      setWordOfDay(dailyData.wordOfDay)
      setFunnyWord(dailyData.funnyWord)
      setPopularWords(dailyData.popularWords || [])
      setStudyWords(dailyData.studyWords || [])
      setGrammarWords(dailyData.grammarWords || [])
      setDictionaryWords(dailyData.dictionaryWords || [])

      setIsRefreshing(false)
    } else {
      // Only show loaders if we actually need to fetch new data
      setWordOfDayLoading(true)
      setFunnyWordLoading(true)
      setPopularWordsLoading(true)
      setStudyWordsLoading(true)
      setGrammarWordsLoading(true)
      setDictionaryWordsLoading(true)

      await fetchDailyWords()
      setIsRefreshing(false)
    }

    // Reset scroll position on refresh
    AsyncStorage.removeItem("homeScrollPosition")
    setScrollPosition(0)
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
  }

  // 6. Remove the renderWordItem function
  // 7. Remove the renderFooter function

  const renderWordCard = (word: Word | null, subtitle: string, icon: React.ReactNode, isLoading: boolean) => {
    if (isLoading) {
      return <WordCardSkeleton theme={theme} />
    }

    if (!word) return null

    const isFavorite = favorites.some((fav) => fav.id === word.id || fav.kanji === word.kanji)

    return (
      <TouchableOpacity
        style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard]}
        onPress={() => handleWordCardPress(word)}
        activeOpacity={0.7}
      >
        <View style={styles.wordCardHeader}>
          <View style={styles.wordCardSubtitleContainer}>
            {icon}
            <Text style={[styles.wordCardSubtitle, theme === "dark" && globalStyles.darkText]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={() => toggleFavorite(word)}
          >
            <Star size={20} fill={isFavorite ? "#FFD700" : "transparent"} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.wordCardKanji, theme === "dark" && globalStyles.darkText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {word.kanji}
        </Text>
        <Text
          style={[styles.wordCardRomaji, theme === "dark" && globalStyles.darkText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {word.romaji}
        </Text>
        <Text
          style={[styles.wordCardMeaning, theme === "dark" && globalStyles.darkText]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {word.meaning}
        </Text>

        <View style={[styles.wordCardExample, theme === "dark" && styles.darkWordCardExample]}>
          <Text
            style={[styles.wordCardExampleText, theme === "dark" && globalStyles.darkText]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {word.sentence}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderSmallWordCard = (word: Word | null, cardType = "default", isLoading = false) => {
    if (isLoading) {
      return <WordCardSkeleton type="small" theme={theme} cardType={cardType} />
    }

    if (!word) return null

    const isFavorite = favorites.some((fav) => fav.id === word.id || fav.kanji === word.kanji)

    return (
      <TouchableOpacity
        style={[
          globalStyles.glassCard,
          theme === "dark" && globalStyles.darkGlassCard,
          styles.smallWordCard,
          cardType === "grammar" && styles.grammarCard,
          cardType === "study" && styles.studyCard,
          cardType === "popular" && styles.popularCard,
          cardType === "travel" && styles.travelCard,
          cardType === "food" && styles.foodCard,
          cardType === "technology" && styles.technologyCard,
          cardType === "emotions" && styles.emotionsCard,
          cardType === "dictionary" && styles.dictionaryCard,
        ]}
        onPress={() => handleWordCardPress(word)}
        activeOpacity={0.7}
      >
        <View style={styles.smallWordHeader}>
          <Text
            style={[styles.smallWordKanji, theme === "dark" && globalStyles.darkText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {word.kanji}
          </Text>
        </View>
        <Text
          style={[styles.smallWordMeaning, theme === "dark" && globalStyles.darkText]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {word.meaning}
        </Text>
        {word.category && (
          <View style={[styles.categoryTag, getCategoryTagStyle(word.category)]}>
            <Text style={styles.categoryTagText}>{getCategoryDisplayName(word.category)}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Helper function to get category display name
  const getCategoryDisplayName = (category: string) => {
    const displayNames = {
      daily: "Daily",
      funny: "Expression",
      popular: "Popular",
      study: "Study",
      grammar: "Grammar",
      travel: "Travel",
      food: "Food",
      technology: "Tech",
      emotions: "Emotion",
    }
    return displayNames[category] || category
  }

  // Helper function to get category tag style
  const getCategoryTagStyle = (category: string) => {
    const styles = {
      daily: { backgroundColor: colors.primary + "40" },
      funny: { backgroundColor: colors.accent + "40" },
      popular: { backgroundColor: colors.tertiary + "40" },
      study: { backgroundColor: colors.secondary + "40" },
      grammar: { backgroundColor: colors.info + "40" },
      travel: { backgroundColor: "#4CAF50" + "40" },
      food: { backgroundColor: "#FF9800" + "40" },
      technology: { backgroundColor: "#2196F3" + "40" },
      emotions: { backgroundColor: "#9C27B0" + "40" },
    }
    return styles[category] || {}
  }

  const renderSkeletonGrid = (count: number, cardType: string) => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <View key={`skeleton-${cardType}-${index}`} style={styles.gridCardContainer}>
          <WordCardSkeleton type="small" theme={theme} cardType={cardType} />
        </View>
      ))
  }

  return (
    <View style={styles.container}>
      <GradientBackground theme={theme} />

      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Daily Japanese</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </Text>
        </View>
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity
            style={styles.liveIconButton}
            onPress={() => {
              // Navigate to LiveScreen
              AsyncStorage.setItem("previousScreen", "home")
              DeviceEventEmitter.emit("OPEN_LIVE_SCREEN", true)
            }}
          >
            <Animated.View style={{ opacity: blinkAnim }}>
              <Radio size={20} color="#FF0000" />
            </Animated.View>
            <Text style={styles.liveText}>LIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshIconButton} onPress={_onRefresh} disabled={isRefreshing}>
            <RefreshCw size={20} color="#FFFFFF" style={isRefreshing ? { opacity: 0.5 } : {}} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={flatListRef}
        contentContainerStyle={styles.flatListContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={_onRefresh}
            colors={[theme === "dark" ? colors.darkText : colors.primary]}
            tintColor={theme === "dark" ? colors.darkText : colors.primary}
          />
        }
      >
        {/* Word of the Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[globalStyles.iconCircle, { backgroundColor: colors.primary }]}>
              <Calendar size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Word of the Day</Text>
          </View>
          {renderWordCard(
            wordOfDay,
            "Today's Word",
            <Calendar
              size={16}
              color={theme === "dark" ? colors.darkText : colors.primary}
              style={styles.subtitleIcon}
            />,
            wordOfDayLoading,
          )}
        </View>

        {/* Funny Word of the Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[globalStyles.iconCircle, { backgroundColor: colors.accent }]}>
              <Sparkles size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>
              Fun Japanese Expression
            </Text>
          </View>
          {renderWordCard(
            funnyWord,
            "Interesting Phrase",
            <Sparkles
              size={16}
              color={theme === "dark" ? colors.darkText : colors.accent}
              style={styles.subtitleIcon}
            />,
            funnyWordLoading,
          )}
        </View>

        {/* Popular Words */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[globalStyles.iconCircle, { backgroundColor: colors.tertiary }]}>
              <TrendingUp size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Popular Phrases</Text>
          </View>
          <View style={styles.cardsGrid}>
            {popularWordsLoading
              ? renderSkeletonGrid(6, "popular")
              : popularWords.map((word, index) => (
                  <View key={`popular-${index}`} style={styles.gridCardContainer}>
                    {renderSmallWordCard(word, "popular")}
                  </View>
                ))}
          </View>
        </View>

        {/* Study Words */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[globalStyles.iconCircle, { backgroundColor: colors.secondary }]}>
              <BookOpen size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Essential Kanji</Text>
          </View>
          <View style={styles.cardsGrid}>
            {studyWordsLoading
              ? renderSkeletonGrid(6, "study")
              : studyWords.map((word, index) => (
                  <View key={`study-${index}`} style={styles.gridCardContainer}>
                    {renderSmallWordCard(word, "study")}
                  </View>
                ))}
          </View>
        </View>

        {/* Grammar Words */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[globalStyles.iconCircle, { backgroundColor: colors.info }]}>
              <GraduationCap size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Grammar Points</Text>
          </View>
          <View style={styles.cardsGrid}>
            {grammarWordsLoading
              ? renderSkeletonGrid(6, "grammar")
              : grammarWords.map((word, index) => (
                  <View key={`grammar-${index}`} style={styles.gridCardContainer}>
                    {renderSmallWordCard(word, "grammar")}
                  </View>
                ))}
          </View>
        </View>

        {/* Dictionary Words */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[globalStyles.iconCircle, { backgroundColor: colors.accent }]}>
              <Book size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Dictionary</Text>
          </View>
          <View style={styles.cardsGrid}>
            {dictionaryWordsLoading
              ? renderSkeletonGrid(6, "dictionary")
              : dictionaryWords.map((word, index) => (
                  <View key={`dictionary-${index}`} style={styles.gridCardContainer}>
                    {renderSmallWordCard(word, "dictionary")}
                  </View>
                ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  refreshIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  flatListContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 12,
  },
  wordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  wordCardSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitleIcon: {
    marginRight: 6,
  },
  wordCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 50,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  smallFavoriteButton: {
    padding: 6,
    backgroundColor: colors.primary,
    borderRadius: 50,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardKanji: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  wordCardRomaji: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 8,
  },
  wordCardMeaning: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  wordCardExample: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  darkWordCardExample: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderLeftColor: colors.accentDark,
  },
  wordCardExampleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridCardContainer: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  smallWordCard: {
    height: 120,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  grammarCard: {
    borderTopColor: colors.info,
  },
  studyCard: {
    borderTopColor: colors.secondary,
  },
  popularCard: {
    borderTopColor: colors.tertiary,
  },
  travelCard: {
    borderTopColor: "#4CAF50",
  },
  foodCard: {
    borderTopColor: "#FF9800",
  },
  technologyCard: {
    borderTopColor: "#2196F3",
  },
  emotionsCard: {
    borderTopColor: "#9C27B0",
  },
  dictionaryCard: {
    borderTopColor: colors.accent,
  },
  smallWordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  smallWordKanji: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  smallWordMeaning: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  categoryTag: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.text,
  },
  // Add scrollContent style
  scrollContent: {
    paddingBottom: 24,
  },

  // Add bottomSpacing style
  bottomSpacing: {
    height: 24,
  },
  headerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveIconButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 10,
    justifyContent: "center",
  },
  liveText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 5,
  },
})
