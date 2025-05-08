"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useColorScheme,
  Keyboard,
  Modal,
  DeviceEventEmitter, // Import DeviceEventEmitter for React Native
  Alert,
} from "react-native"
import { Home, Search, Settings, Layers } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"

// Import screens
import SearchScreen from "../../components/screens/SearchScreen"
import DetailScreen from "../../components/screens/DetailScreen"
import SettingsScreen from "../../components/screens/SettingsScreen"
import AssistantScreen from "../../components/screens/AssistantScreen"
import FlashcardScreen from "../../components/screens/FlashcardScreen"
import FloatingAssistantButton from "../../components/FloatingAssistantButton"
import OnboardingScreen from "../../components/screens/OnboardingScreen"
import ProfileSetupScreen from "../../components/screens/ProfileSetupScreen"
import LiveScreen from "../../components/screens/LiveScreen" // Import the LiveScreen component

// Import shared styles
import { globalStyles, colors } from "../../styles/globalStyles"
// Import the handleAppRestart function
import HomeScreen, { handleAppRestart, clearHomeScreenCache } from "@/components/screens/HomeScreen"
import GradientBackground from "@/components/GradientBackground"
import { type CharacterType, getUserProfile, saveUserProfile } from "@/lib/user-store"

// Event name constants
const CHARACTER_CHANGED_EVENT = "CHARACTER_CHANGED_EVENT"
const OPEN_LIVE_SCREEN_EVENT = "OPEN_LIVE_SCREEN" // Add constant for the live screen event

export default function App() {
  const [selectedWord, setSelectedWord] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("home")
  const [favorites, setFavorites] = useState<any>([])
  const [recentSearches, setRecentSearches] = useState<any>([])
  const colorScheme = useColorScheme()
  const [theme, setTheme] = useState<any>("light")
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [assistantVisible, setAssistantVisible] = useState(false)
  const [assistantEnabled, setAssistantEnabled] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [showCharacterSelection, setShowCharacterSelection] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)
  const [showOnboardingForTesting, setShowOnboardingForTesting] = useState(false)
  // Add state for LiveScreen visibility
  const [liveScreenVisible, setLiveScreenVisible] = useState(false)

  // Add a ref to force re-renders when character changes
  const forceUpdateRef = useRef(0)
  // Add a ref to store the previous tab before viewing details
  const previousTabRef = useRef(activeTab)
  // Add a flag to track if we're coming back from details
  const [isReturningFromDetails, setIsReturningFromDetails] = useState(false)
  const flatListRef = useRef(null)

  // Listen for character changes using DeviceEventEmitter
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(CHARACTER_CHANGED_EVENT, (character) => {
      console.log("Character changed event received:", character)
      setSelectedCharacter(character)
      // Increment to force re-render of components that depend on character
      forceUpdateRef.current += 1
    })

    // Listen for the OPEN_LIVE_SCREEN event
    const liveScreenSubscription = DeviceEventEmitter.addListener(OPEN_LIVE_SCREEN_EVENT, () => {
      console.log("Open live screen event received")
      setLiveScreenVisible(true)
    })

    // Clean up the subscriptions
    return () => {
      subscription.remove()
      liveScreenSubscription.remove()
    }
  }, [])

  // Add a function to save the active tab to AsyncStorage
  const saveActiveTab = async (tab: any) => {
    try {
      await AsyncStorage.setItem("activeTab", tab)
    } catch (error) {
      console.error("Error saving active tab:", error)
    }
  }

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      setIsLoading(true)
      try {
        // Check if developer mode is enabled to show onboarding
        const showOnboardingEnabled = await AsyncStorage.getItem("showOnboardingEnabled")
        if (showOnboardingEnabled === "true") {
          setShowOnboardingForTesting(true)
          setOnboardingComplete(false)
          setIsLoading(false)
          return
        }

        // Normal onboarding check
        const profile = await getUserProfile()

        if (!profile.onboardingComplete) {
          // Show onboarding first
          setOnboardingComplete(false)
        } else if (!profile.profileSetupComplete) {
          // Then show profile setup
          setShowProfileSetup(true)
        } else {
          // Onboarding is complete
          setOnboardingComplete(true)
          setSelectedCharacter(profile.selectedCharacter || null)
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
        // Default to showing onboarding
        setOnboardingComplete(false)
      }
      setIsLoading(false)
    }

    checkOnboarding()
  }, [])

  // Add a function to load the active tab from AsyncStorage
  const loadActiveTab = async () => {
    try {
      const savedTab = await AsyncStorage.getItem("activeTab")
      if (savedTab) {
        setActiveTab(savedTab)
      }
    } catch (error) {
      console.error("Error loading active tab:", error)
    }
  }

  useEffect(() => {
    loadFavorites()
    loadRecentSearches()
    loadThemePreference()
    loadActiveTab() // Load the saved active tab
  }, [])

  useEffect(() => {
    if (activeTab !== "search" && activeTab !== "home") {
      setSelectedWord(null)
    }
  }, [activeTab])

  // When selectedWord changes to null (user goes back from details)
  // and we have the returning flag set, restore the previous tab
  useEffect(() => {
    if (selectedWord === null && isReturningFromDetails) {
      // Check which screen we were on before viewing details
      AsyncStorage.getItem("previousScreen")
        .then((previousScreen) => {
          if (previousScreen === "search") {
            // If coming from search, restore search tab
            setActiveTab("search")
          } else {
            // Otherwise restore the previous tab
            setActiveTab(previousTabRef.current)
          }
          setIsReturningFromDetails(false)
        })
        .catch((error) => {
          console.error("Error checking previous screen:", error)
          // Default to previous tab if error
          setActiveTab(previousTabRef.current)
          setIsReturningFromDetails(false)
        })
    }
  }, [selectedWord, isReturningFromDetails])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true)
    })
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false)
    })

    // Clean up listeners when component unmounts
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme")
      if (savedTheme) {
        setTheme(savedTheme)
      }
    } catch (error) {
      console.error("Error loading theme preference:", error)
    }
  }

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem("favorites")
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites))
      }
    } catch (error) {
      console.error("Error loading favorites:", error)
    }
  }

  const loadRecentSearches = async () => {
    try {
      const storedSearches = await AsyncStorage.getItem("recentSearches")
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches))
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
    }
  }

  const addToRecentSearches = async (term: any) => {
    const updatedSearches = [term, ...recentSearches.filter((item: any) => item !== term)].slice(0, 5)
    setRecentSearches(updatedSearches)
    try {
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    } catch (error) {
      console.error("Error saving recent searches:", error)
    }
  }

  const toggleFavorite = async (word: any) => {
    let newFavorites
    if (favorites.some((fav: any) => fav.id === word.id || fav.kanji === word.kanji)) {
      newFavorites = favorites.filter((fav: any) => fav.id !== word.id && fav.kanji !== word.kanji)
    } else {
      newFavorites = [...favorites, word]
    }
    setFavorites(newFavorites)
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites))
    } catch (error) {
      console.error("Error saving favorites:", error)
    }
  }

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    try {
      await AsyncStorage.setItem("theme", newTheme)
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  // Modified function to handle word selection and remember the current tab
  const handleSelectWord = (word: any) => {
    // Just set the selected word - no need to save the active tab anymore
    setSelectedWord(word)

    // Still save which screen we're on for reference
    AsyncStorage.setItem("previousScreen", activeTab)
  }

  // Modified function to handle going back from details
  const handleBackFromDetails = () => {
    // Simply set selectedWord to null to close the modal
    setSelectedWord(null)
  }

  // Update the handlePress function in the App component to record interaction time
  const toggleAssistant = async () => {
    // Record the interaction time
    try {
      await AsyncStorage.setItem("lastAssistantInteraction", Date.now().toString())
    } catch (error) {
      console.error("Error saving interaction time:", error)
    }

    setAssistantVisible(!assistantVisible)
  }

  const handleOnboardingComplete = async (character: CharacterType) => {
    setSelectedCharacter(character)
    setOnboardingComplete(true)

    // If in testing mode, don't show profile setup and disable testing mode
    if (showOnboardingForTesting) {
      setShowOnboardingForTesting(false)
      await AsyncStorage.setItem("showOnboardingEnabled", "false")
      Alert.alert("Testing Complete", "Onboarding testing mode has been disabled.")
    } else {
      setShowProfileSetup(true)
      // Save that onboarding is complete
      await saveUserProfile({
        selectedCharacter: character,
        onboardingComplete: true,
      })
    }

    // Emit character change event
    DeviceEventEmitter.emit(CHARACTER_CHANGED_EVENT, character)
  }

  const handleProfileSetupComplete = async () => {
    setShowProfileSetup(false)

    // Save that profile setup is complete
    await saveUserProfile({
      profileSetupComplete: true,
    })
  }

  // Modify the renderContent function to handle the details view as a modal instead of a page replacement
  const renderContent = () => {
    // Show the appropriate screen based on activeTab
    if (activeTab === "home") {
      return (
        <HomeScreen
          theme={theme}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          setSelectedWord={handleSelectWord}
          flatListRef={flatListRef}
        />
      )
    } else if (activeTab === "search") {
      return (
        <SearchScreen
          theme={theme}
          recentSearches={recentSearches}
          setRecentSearches={setRecentSearches}
          favorites={favorites}
          addToRecentSearches={addToRecentSearches}
          toggleFavorite={toggleFavorite}
          setSelectedWord={handleSelectWord}
        />
      )
    } else if (activeTab === "flashcards") {
      return (
        <FlashcardScreen
          theme={theme}
          favorites={favorites}
          setSelectedWord={handleSelectWord}
          setActiveTab={setActiveTab}
        />
      )
    } else {
      return (
        <SettingsScreen
          theme={theme}
          toggleTheme={toggleTheme}
          assistantEnabled={assistantEnabled}
          setAssistantEnabled={setAssistantEnabled}
          onCharacterChange={(character: CharacterType) => {
            setSelectedCharacter(character)
            // Emit character change event
            DeviceEventEmitter.emit(CHARACTER_CHANGED_EVENT, character)
          }}
        />
      )
    }
  }

  // Add this right after the renderContent function
  // Add a modal for the details view instead of replacing the content
  const renderDetailsModal = () => {
    if (!selectedWord) return null

    return (
      <Modal
        visible={!!selectedWord}
        animationType="slide"
        transparent={false}
        onRequestClose={handleBackFromDetails}
        statusBarTranslucent={true}
      >
        <GradientBackground theme={theme} />
        <StatusBar
          backgroundColor="transparent"
          translucent
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <DetailScreen
          selectedWord={selectedWord}
          setSelectedWord={handleBackFromDetails}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          theme={theme}
        />
      </Modal>
    )
  }

  // Update the renderTabButton function in the App component to include the Flashcards tab
  const renderTabButton = (tabName: string, label: string, Icon: any) => {
    const isActive = activeTab === tabName

    return (
      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          setSelectedWord(null)
          setActiveTab(tabName)
          saveActiveTab(tabName) // Save the tab when it changes
        }}
      >
        {isActive ? (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeTabBackground}
          >
            <Icon size={20} color="#FFFFFF" />
            <Text style={styles.activeTabText}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveTabContent}>
            <Icon size={20} color={theme === "dark" ? colors.darkTextSecondary : colors.textSecondary} />
            <Text style={[styles.inactiveTabText, theme === "dark" && { color: colors.darkTextSecondary }]}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const loadAssistantSetting = async () => {
    try {
      const storedSetting = await AsyncStorage.getItem("assistantEnabled")
      if (storedSetting !== null) {
        setAssistantEnabled(JSON.parse(storedSetting))
      }
    } catch (error) {
      console.error("Error loading assistant setting:", error)
    }
  }

  useEffect(() => {
    loadFavorites()
    loadRecentSearches()
    loadThemePreference()
    loadActiveTab() // Load the saved active tab
    loadAssistantSetting()
  }, [])

  // Listen for JLPT level changes
  useEffect(() => {
    const jlptLevelChangedSubscription = DeviceEventEmitter.addListener("JLPT_LEVEL_CHANGED_EVENT", async (level) => {
      console.log("JLPT level changed to:", level)

      // Clear home screen cache
      await clearHomeScreenCache()

      // If currently on home screen, force a refresh
      if (activeTab === "home") {
        // Set a flag to indicate we need to refresh
        AsyncStorage.setItem("forceHomeRefresh", "true")

        // Force a re-render of the home screen
        setActiveTab("home")
      }
    })

    return () => {
      jlptLevelChangedSubscription.remove()
    }
  }, [activeTab])

  // Add a useEffect to handle app restart
  useEffect(() => {
    // Call handleAppRestart when the app starts
    handleAppRestart()
  }, [])

  // Keep selectedCharacter in sync with user profile
  useEffect(() => {
    const syncCharacter = async () => {
      const profile = await getUserProfile()
      setSelectedCharacter(profile.selectedCharacter)
    }

    // Sync character when assistant is about to be shown
    if (assistantEnabled) {
      syncCharacter()
    }
  }, [assistantEnabled, assistantVisible])

  // Show loading screen while checking onboarding status
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground theme={theme} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, theme === "dark" && { color: colors.darkText }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Show onboarding screen if needed
  if (!onboardingComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <OnboardingScreen theme={theme} onComplete={handleOnboardingComplete} />
      </SafeAreaView>
    )
  }

  // Show profile setup if needed
  if (showProfileSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <ProfileSetupScreen theme={theme} onComplete={handleProfileSetupComplete} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground theme={theme} character={selectedCharacter} />

      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      <View style={[styles.header, theme === "dark" && globalStyles.darkHeader]} />

      <View style={globalStyles.content}>{renderContent()}</View>

      {/* Details Modal */}
      {renderDetailsModal()}

      {/* Floating Assistant Button */}
      {!isKeyboardVisible && !assistantVisible && assistantEnabled && (
        <FloatingAssistantButton
          key={`floating-button-${selectedCharacter}-${forceUpdateRef.current}`}
          onPress={toggleAssistant}
          theme={theme}
          character={selectedCharacter || "mira"}
        />
      )}

      {/* Assistant Modal */}
      <Modal visible={assistantVisible} animationType="slide" transparent={true} onRequestClose={toggleAssistant}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, theme === "dark" && { backgroundColor: "#121212" }]}>
            <AssistantScreen
              key={`assistant-${selectedCharacter}-${forceUpdateRef.current}`}
              theme={theme}
              onClose={toggleAssistant}
              character={selectedCharacter || "mira"}
            />
          </View>
        </View>
      </Modal>

      {/* LiveScreen Modal */}
      <Modal
        visible={liveScreenVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLiveScreenVisible(false)}
      >
        <LiveScreen theme={theme} onClose={() => setLiveScreenVisible(false)} />
      </Modal>

      {/* Update the tab bar to include the Flashcards tab */}
      {!isKeyboardVisible && (
        <View style={[styles.tabBar, theme === "dark" && globalStyles.darkTabBar]}>
          {renderTabButton("home", "Home", Home)}
          {renderTabButton("search", "Search", Search)}
          {renderTabButton("flashcards", "Study", Layers)}
          {renderTabButton("settings", "Settings", Settings)}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 30,
    margin: 16,
    marginTop: 0,
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  activeTabBackground: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%",
    height: "100%",
  },
  inactiveTabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 10,
    marginLeft: 4,
  },
  inactiveTabText: {
    color: colors.textSecondary,
    fontWeight: "500",
    fontSize: 10,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  detailsModalContainer: {
    flex: 1,
    // Remove the semi-transparency to make it look like a full page
    // backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
  },
})
