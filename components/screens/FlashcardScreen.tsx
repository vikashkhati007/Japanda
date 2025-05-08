"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions, Alert } from "react-native"
import { ArrowLeft, Check, X, RotateCcw, Settings, Clock, List, BookOpen, Bookmark } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"
import { getAllSavedWords, markWordAsReviewed, getUserProfile } from "@/lib/user-store"
import { DeviceEventEmitter } from "react-native"

const { width, height } = Dimensions.get("window")
const SWIPE_THRESHOLD = 120

export default function FlashcardScreen({ theme, favorites, setSelectedWord, setActiveTab }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [studyStats, setStudyStats] = useState({
    cardsReviewed: 0,
    knownCards: 0,
    unknownCards: 0,
    streak: 0,
    lastStudyDate: null,
  })
  const [userJlptLevel, setUserJlptLevel] = useState("N5")
  const [studyMode, setStudyMode] = useState("all") // "all", "favorites", "recent", "jlpt"
  const [showedTutorial, setShowedTutorial] = useState(false)

  // Animation values
  const flipAnimation = useRef(new Animated.Value(0)).current
  const swipeAnimation = useRef(new Animated.Value(0)).current
  const nextCardOpacity = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(1)).current

  // Calculate card rotation and opacity based on animation values
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  })

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  })

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  })

  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  })

  // Set up pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow horizontal swiping when card is flipped (showing answer)
        if (isFlipped) {
          swipeAnimation.setValue(gestureState.dx)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isFlipped) return

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right - mark as known
          handleKnown()
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left - mark as unknown
          handleUnknown()
        } else {
          // Return to center
          Animated.spring(swipeAnimation, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  // Load user profile to get JLPT level
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile()
        setUserJlptLevel(profile.jlptLevel || "N5")
      } catch (error) {
        console.error("Error loading user profile:", error)
      }
    }

    loadUserProfile()

    // Add listener for JLPT level changes
    const jlptLevelChangedSubscription = DeviceEventEmitter.addListener("JLPT_LEVEL_CHANGED_EVENT", (level) => {
      setUserJlptLevel(level)
      // Reload cards when JLPT level changes
      loadCards(studyMode)
    })

    return () => {
      jlptLevelChangedSubscription.remove()
    }
  }, [])

  // Load study stats from AsyncStorage
  useEffect(() => {
    const loadStudyStats = async () => {
      try {
        const statsJson = await AsyncStorage.getItem("flashcardStudyStats")
        if (statsJson) {
          const stats = JSON.parse(statsJson)
          setStudyStats(stats)

          // Check if we need to reset daily stats
          const today = new Date().toDateString()
          if (stats.lastStudyDate !== today) {
            setStudyStats({
              ...stats,
              cardsReviewed: 0,
              knownCards: 0,
              unknownCards: 0,
              lastStudyDate: today,
            })
          }
        }
      } catch (error) {
        console.error("Error loading study stats:", error)
      }
    }

    loadStudyStats()
  }, [])

  // Load cards when component mounts
  useEffect(() => {
    loadCards("all")
  }, [])

  // Show tutorial on first load
  useEffect(() => {
    const showTutorial = async () => {
      try {
        const tutorialShown = await AsyncStorage.getItem("flashcardTutorialShown")
        if (!tutorialShown && !showedTutorial) {
          setShowedTutorial(true)
          Alert.alert(
            "How to Use Flashcards",
            "1. TAP on a card to flip it and see the meaning\n\n" +
              "2. After seeing the meaning, either:\n" +
              "   • SWIPE RIGHT if you know the word\n" +
              "   • SWIPE LEFT if you don't know it\n" +
              "   • Or use the buttons at the bottom\n\n" +
              "3. Use the gear icon to change study modes",
            [{ text: "Got it!" }],
          )
          await AsyncStorage.setItem("flashcardTutorialShown", "true")
        }
      } catch (error) {
        console.error("Error showing tutorial:", error)
      }
    }

    showTutorial()
  }, [])

  // Save study stats to AsyncStorage
  const saveStudyStats = async (stats) => {
    try {
      await AsyncStorage.setItem("flashcardStudyStats", JSON.stringify(stats))
    } catch (error) {
      console.error("Error saving study stats:", error)
    }
  }

  // Load cards based on study mode
  const loadCards = async (mode) => {
    setIsLoading(true)
    setShowEmpty(false)
    setStudyMode(mode)

    try {
      let wordsList = []

      switch (mode) {
        case "favorites":
          // Use favorites passed from props
          wordsList = [...favorites]
          break

        case "recent":
          // Load recent searches
          const recentJson = await AsyncStorage.getItem("recentSearches")
          if (recentJson) {
            wordsList = JSON.parse(recentJson)
          }
          break

        case "jlpt":
          // Load words filtered by current JLPT level
          const allWords = await getAllSavedWords()
          const jlptLevel = Number.parseInt(userJlptLevel.substring(1))

          wordsList = allWords.filter((word) => {
            // Check if word has jlpt property as a number or string like "N5"
            if (word.jlpt) {
              if (typeof word.jlpt === "number") {
                return word.jlpt === jlptLevel
              } else if (typeof word.jlpt === "string") {
                const wordLevel = Number.parseInt(word.jlpt.replace("N", ""))
                return !isNaN(wordLevel) && wordLevel === jlptLevel
              }
            }
            return false
          })
          break

        case "all":
        default:
          // Load all saved words
          wordsList = await getAllSavedWords()

          // If no saved words, use favorites as fallback
          if (wordsList.length === 0) {
            wordsList = [...favorites]
          }

          // If still no words, use recent searches as fallback
          if (wordsList.length === 0) {
            const recentJson = await AsyncStorage.getItem("recentSearches")
            if (recentJson) {
              wordsList = JSON.parse(recentJson)
            }
          }
          break
      }

      // Filter out invalid words and shuffle the cards
      const shuffledCards = wordsList
        .filter((word) => word && (word.kanji || word.word) && word.meaning) // Filter out invalid words
        .sort(() => Math.random() - 0.5)

      setCards(shuffledCards)
      setCurrentIndex(0)
      setIsFlipped(false)
      setShowEmpty(shuffledCards.length === 0)

      // Reset animation values
      flipAnimation.setValue(0)
      swipeAnimation.setValue(0)
      nextCardOpacity.setValue(0)
      cardScale.setValue(1)

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading cards:", error)
      setIsLoading(false)
      setShowEmpty(true)
    }
  }

  // Flip the card
  const flipCard = () => {
    if (cards.length === 0 || currentIndex >= cards.length) return // Don't try to flip if there are no cards

    // Add haptic feedback if available
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10) // Light vibration for feedback
    }

    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start()
    }

    setIsFlipped(!isFlipped)
  }

  // Handle marking a card as known
  const handleKnown = async () => {
    if (cards.length === 0 || currentIndex >= cards.length) return

    // Animate card swiping right
    Animated.timing(swipeAnimation, {
      toValue: width + 100,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      try {
        // Update study stats
        const today = new Date().toDateString()
        const newStats = {
          ...studyStats,
          cardsReviewed: studyStats.cardsReviewed + 1,
          knownCards: studyStats.knownCards + 1,
          streak: studyStats.lastStudyDate === today ? studyStats.streak : studyStats.streak + 1,
          lastStudyDate: today,
        }

        setStudyStats(newStats)
        await saveStudyStats(newStats)

        // Mark word as reviewed in storage
        const currentCard = cards[currentIndex]
        if (currentCard && (currentCard.id || currentCard.word)) {
          const wordId = currentCard.id || currentCard.word
          await markWordAsReviewed(wordId)
        }

        // Move to next card
        moveToNextCard()
      } catch (error) {
        console.error("Error handling known card:", error)
        // Still move to next card even if there's an error
        moveToNextCard()
      }
    })
  }

  // Handle marking a card as unknown
  const handleUnknown = () => {
    if (cards.length === 0 || currentIndex >= cards.length) return

    // Animate card swiping left
    Animated.timing(swipeAnimation, {
      toValue: -width - 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      try {
        // Update study stats
        const today = new Date().toDateString()
        const newStats = {
          ...studyStats,
          cardsReviewed: studyStats.cardsReviewed + 1,
          unknownCards: studyStats.unknownCards + 1,
          streak: studyStats.lastStudyDate === today ? studyStats.streak : studyStats.streak + 1,
          lastStudyDate: today,
        }

        setStudyStats(newStats)
        saveStudyStats(newStats)

        // Move to next card
        moveToNextCard()
      } catch (error) {
        console.error("Error handling unknown card:", error)
        // Still move to next card even if there's an error
        moveToNextCard()
      }
    })
  }

  // Move to the next card
  const moveToNextCard = () => {
    // Show next card with animation
    if (currentIndex < cards.length - 1) {
      // Reset animations
      swipeAnimation.setValue(0)
      flipAnimation.setValue(0)
      setIsFlipped(false)

      // Animate next card appearing
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      // Update index
      setCurrentIndex(currentIndex + 1)
    } else if (cards.length > 0) {
      // End of deck
      Alert.alert(
        "Study Session Complete",
        `You've reviewed all ${cards.length} cards!\n\nKnown: ${studyStats.knownCards}\nUnknown: ${studyStats.unknownCards}`,
        [
          {
            text: "Restart Deck",
            onPress: () => {
              // Shuffle cards and start over
              const shuffledCards = [...cards].sort(() => Math.random() - 0.5)
              setCards(shuffledCards)
              setCurrentIndex(0)
              setIsFlipped(false)
              flipAnimation.setValue(0)
              swipeAnimation.setValue(0)
            },
          },
          {
            text: "Done",
            style: "cancel",
          },
        ],
      )
    }
  }

  // Restart the current deck
  const restartDeck = () => {
    if (cards.length === 0) return

    // Shuffle cards and reset state
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffledCards)
    setCurrentIndex(0)
    setIsFlipped(false)
    flipAnimation.setValue(0)
    swipeAnimation.setValue(0)
  }

  // View word details
  const viewWordDetails = () => {
    if (cards.length === 0 || currentIndex >= cards.length) return

    const currentCard = cards[currentIndex]
    setSelectedWord(currentCard)
  }

  // Render the front of the card (Japanese word)
  const renderCardFront = () => {
    if (cards.length === 0 || currentIndex >= cards.length) return null

    const currentCard = cards[currentIndex]
    const displayText = currentCard.kanji || currentCard.word || "No text available"

    return (
      <Animated.View
        style={[
          styles.card,
          theme === "dark" && styles.darkCard,
          {
            transform: [{ rotateY: frontInterpolate }, { scale: cardScale }, { translateX: swipeAnimation }],
            opacity: frontOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={theme === "dark" ? ["#2a2a2a", "#1a1a1a"] : ["#ffffff", "#f5f5f5"]}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardIndex, theme === "dark" && styles.darkText]}>
              {currentIndex + 1}/{cards.length}
            </Text>

            <View style={styles.cardMain}>
              <Text style={[styles.cardKanji, theme === "dark" && styles.darkText]}>{displayText}</Text>

              {currentCard.hiragana && (
                <Text style={[styles.cardHiragana, theme === "dark" && styles.darkSecondaryText]}>
                  {currentCard.hiragana}
                </Text>
              )}

              {/* Add a pulsing indicator */}
              <View style={styles.tapIndicator}>
                <View style={styles.tapCircle}>
                  <Text style={styles.tapIcon}>👆</Text>
                </View>
              </View>
            </View>

            <Text
              style={[
                styles.cardInstructions,
                theme === "dark" && styles.darkSecondaryText,
                styles.highlightedInstructions,
              ]}
            >
              TAP CARD TO REVEAL MEANING
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    )
  }

  // Render the back of the card (meaning)
  const renderCardBack = () => {
    if (cards.length === 0 || currentIndex >= cards.length) return null

    const currentCard = cards[currentIndex]
    const fullMeaning = currentCard.meaning || "No meaning available"
    const displayMeaning = extractMainMeaning(fullMeaning)
    const displayRomaji = currentCard.romaji || ""

    return (
      <Animated.View
        style={[
          styles.card,
          theme === "dark" && styles.darkCard,
          {
            transform: [{ rotateY: backInterpolate }, { scale: cardScale }, { translateX: swipeAnimation }],
            opacity: backOpacity,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={theme === "dark" ? ["#2a2a2a", "#1a1a1a"] : ["#ffffff", "#f5f5f5"]}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardIndex, theme === "dark" && styles.darkText]}>
              {currentIndex + 1}/{cards.length}
            </Text>

            <View style={styles.cardMain}>
              <Text style={[styles.cardMeaning, theme === "dark" && styles.darkText]}>{displayMeaning}</Text>

              {displayRomaji && (
                <Text style={[styles.cardRomaji, theme === "dark" && styles.darkSecondaryText]}>{displayRomaji}</Text>
              )}

              {currentCard.sentence && (
                <View style={styles.exampleContainer}>
                  <Text style={[styles.exampleLabel, theme === "dark" && styles.darkSecondaryText]}>Example:</Text>
                  <Text style={[styles.exampleText, theme === "dark" && styles.darkText]}>{currentCard.sentence}</Text>
                  {currentCard.sentence_translation && (
                    <Text style={[styles.exampleTranslation, theme === "dark" && styles.darkSecondaryText]}>
                      {currentCard.sentence_translation}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <Text style={[styles.cardInstructions, theme === "dark" && styles.darkSecondaryText]}>
              Swipe right if you know it, left if you don't
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    )
  }

  // Render empty state when no cards are available
  const renderEmptyState = () => {
    return (
      <View style={[styles.emptyContainer, theme === "dark" && styles.darkEmptyContainer]}>
        <BookOpen size={64} color={theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} />
        <Text style={[styles.emptyTitle, theme === "dark" && styles.darkText]}>No Cards Available</Text>
        <Text style={[styles.emptyText, theme === "dark" && styles.darkSecondaryText]}>
          {studyMode === "favorites"
            ? "You haven't added any words to your favorites yet."
            : studyMode === "recent"
              ? "You haven't searched for any words yet."
              : studyMode === "jlpt"
                ? `No words found for JLPT level ${userJlptLevel}.`
                : "Try searching for words or adding favorites to study."}
        </Text>

        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={[styles.emptyButton, theme === "dark" && styles.darkEmptyButton]}
            onPress={() => loadCards("all")}
          >
            <Text style={[styles.emptyButtonText, theme === "dark" && styles.darkText]}>Try All Words</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emptyButton, theme === "dark" && styles.darkEmptyButton]}
            onPress={() => setActiveTab("search")}
          >
            <Text style={[styles.emptyButtonText, theme === "dark" && styles.darkText]}>Search Words</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Render loading state
  const renderLoading = () => {
    return (
      <View style={[styles.loadingContainer, theme === "dark" && styles.darkLoadingContainer]}>
        <Text style={[styles.loadingText, theme === "dark" && styles.darkText]}>Loading cards...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <GradientBackground theme={theme} />

      {/* Header */}
      <View style={[styles.header, theme === "dark" && styles.darkHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveTab("home")}>
          <ArrowLeft size={24} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, theme === "dark" && styles.darkText]}>Flashcards</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {
              Alert.alert(
                "How to Use Flashcards",
                "1. TAP on a card to flip it and see the meaning\n\n" +
                  "2. After seeing the meaning, either:\n" +
                  "   • SWIPE RIGHT if you know the word\n" +
                  "   • SWIPE LEFT if you don't know it\n\n" +
                  "3. Use the gear icon to change study modes",
                [{ text: "Got it!" }],
              )
            }}
          >
            <BookOpen size={20} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              // Show study mode options
              Alert.alert("Study Mode", "Choose which cards to study:", [
                {
                  text: "All Words",
                  onPress: () => loadCards("all"),
                },
                {
                  text: "Favorites",
                  onPress: () => loadCards("favorites"),
                },
                {
                  text: "Recent Searches",
                  onPress: () => loadCards("recent"),
                },
                {
                  text: `JLPT ${userJlptLevel}`,
                  onPress: () => loadCards("jlpt"),
                },
                {
                  text: "Cancel",
                  style: "cancel",
                },
              ])
            }}
          >
            <Settings size={24} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, theme === "dark" && styles.darkStatsBar]}>
        <View style={styles.statItem}>
          <Clock size={16} color={theme === "dark" ? colors.darkText : colors.primary} />
          <Text style={[styles.statText, theme === "dark" && styles.darkText]}>{studyStats.cardsReviewed} Today</Text>
        </View>

        <View style={styles.statItem}>
          <Check size={16} color={theme === "dark" ? colors.darkText : colors.success} />
          <Text style={[styles.statText, theme === "dark" && styles.darkText]}>{studyStats.knownCards} Known</Text>
        </View>

        <View style={styles.statItem}>
          <X size={16} color={theme === "dark" ? colors.darkText : colors.error} />
          <Text style={[styles.statText, theme === "dark" && styles.darkText]}>{studyStats.unknownCards} Unknown</Text>
        </View>

        <View style={styles.statItem}>
          <List size={16} color={theme === "dark" ? colors.darkText : colors.accent} />
          <Text style={[styles.statText, theme === "dark" && styles.darkText]}>{cards.length} Cards</Text>
        </View>
      </View>

      {/* Study Mode Indicator */}
      <View style={[styles.studyModeContainer, theme === "dark" && styles.darkStudyModeContainer]}>
        <Text style={[styles.studyModeText, theme === "dark" && styles.darkSecondaryText]}>
          Studying:{" "}
          {studyMode === "all"
            ? "All Words"
            : studyMode === "favorites"
              ? "Favorites"
              : studyMode === "recent"
                ? "Recent Searches"
                : `JLPT ${userJlptLevel}`}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {isLoading ? (
          renderLoading()
        ) : showEmpty || cards.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.cardContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={flipCard}
              style={styles.cardTouchable}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              {renderCardFront()}
              {renderCardBack()}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {!isLoading && !showEmpty && cards.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.unknownButton,
              theme === "dark" && styles.darkUnknownButton,
              !isFlipped && styles.disabledButton,
            ]}
            onPress={isFlipped ? handleUnknown : undefined}
            disabled={!isFlipped}
          >
            <X size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Don't Know</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton, theme === "dark" && styles.darkDetailsButton]}
            onPress={viewWordDetails}
          >
            <Bookmark size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.restartButton, theme === "dark" && styles.darkRestartButton]}
            onPress={restartDeck}
          >
            <RotateCcw size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.knownButton,
              theme === "dark" && styles.darkKnownButton,
              !isFlipped && styles.disabledButton,
            ]}
            onPress={isFlipped ? handleKnown : undefined}
            disabled={!isFlipped}
          >
            <Check size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Know It</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  darkHeader: {
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  darkStatsBar: {
    backgroundColor: "rgba(40, 40, 40, 0.8)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#000000",
  },
  studyModeContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  darkStudyModeContainer: {
    // No specific dark styles needed
  },
  studyModeText: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: width - 40,
    height: height * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTouchable: {
    width: "100%",
    height: "100%",
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: "hidden",
  },
  darkCard: {
    backgroundColor: "#2A2A2A",
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardIndex: {
    fontSize: 14,
    color: "#666666",
    alignSelf: "flex-end",
  },
  cardMain: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardKanji: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  cardHiragana: {
    fontSize: 24,
    color: colors.secondary,
    marginBottom: 8,
    textAlign: "center",
  },
  cardMeaning: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  cardRomaji: {
    fontSize: 20,
    color: colors.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  exampleContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 4,
  },
  exampleTranslation: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },
  cardInstructions: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  unknownButton: {
    backgroundColor: colors.error,
  },
  darkUnknownButton: {
    backgroundColor: colors.error,
  },
  knownButton: {
    backgroundColor: colors.success,
  },
  darkKnownButton: {
    backgroundColor: colors.success,
  },
  restartButton: {
    backgroundColor: colors.info,
  },
  darkRestartButton: {
    backgroundColor: colors.info,
  },
  detailsButton: {
    backgroundColor: colors.accent,
  },
  darkDetailsButton: {
    backgroundColor: colors.accent,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    width: "100%",
  },
  darkEmptyContainer: {
    backgroundColor: "rgba(40, 40, 40, 0.8)",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  darkEmptyButton: {
    backgroundColor: colors.primary,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
  },
  darkLoadingContainer: {
    backgroundColor: "rgba(40, 40, 40, 0.8)",
  },
  loadingText: {
    fontSize: 18,
    color: "#000000",
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSecondaryText: {
    color: "#AAAAAA",
  },
  disabledButton: {
    opacity: 0.5,
  },
  highlightedInstructions: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginRight: 8,
  },
  tapIndicator: {
    marginTop: 20,
    alignItems: "center",
  },
  tapCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 95, 162, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 95, 162, 0.5)",
  },
  tapIcon: {
    fontSize: 24,
  },
})

const extractMainMeaning = (meaning: string): string => {
  if (!meaning) return ""

  // Extract the first meaning before any delimiter
  // Common delimiters in dictionary meanings: semicolons, commas, periods
  const firstPart = meaning.split(/[;,.]/, 1)[0].trim()

  // If the first part is still too long, truncate it
  if (firstPart.length > 40) {
    return firstPart.substring(0, 40) + "..."
  }

  return firstPart
}
