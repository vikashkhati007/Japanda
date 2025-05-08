// @ts-nocheck
"use client"
import { useState, useEffect, useRef } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Keyboard } from "react-native"
import { Search, Star, X, Clock, Heart } from "lucide-react-native"
import { StyleSheet } from "react-native"
import { globalStyles, colors } from "../../styles/globalStyles"
import { searchWord } from "../../lib/utils"
import AsyncStorage from "@react-native-async-storage/async-storage"
import GradientBackground from "../GradientBackground"
import { LinearGradient } from "expo-linear-gradient"

export default function SearchScreen({
  theme,
  recentSearches,
  setRecentSearches,
  favorites,
  addToRecentSearches,
  toggleFavorite,
  setSelectedWord,
}: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [result, setResult] = useState({})
  const [showNoResults, setShowNoResults] = useState(false)
  // Change the initial activeTab state to null to prevent immediate rendering with "search"
  const [activeTab, setActiveTab] = useState<string | null>(null)
  // Add a loading state to track when we're ready to show content
  const [isTabsLoaded, setIsTabsLoaded] = useState(false)
  // Add a new state variable to track the previous tab before viewing details
  const [previousTab, setPreviousTab] = useState("search")

  // Add these refs and state variables at the beginning of the SearchScreen component, after the existing state variables
  const scrollViewRef = useRef<ScrollView>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const saveScrollPositionTimeout = useRef<NodeJS.Timeout | null>(null)

  // Add this useEffect to handle saving and restoring scroll position
  useEffect(() => {
    const restoreScrollPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem("searchScrollPosition")
        if (savedPosition) {
          const position = Number.parseInt(savedPosition, 10)
          // Small delay to ensure the ScrollView has rendered
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: position, animated: false })
          }, 100)
        }
      } catch (error) {
        console.error("Error restoring search scroll position:", error)
      }
    }

    restoreScrollPosition()

    return () => {
      if (saveScrollPositionTimeout.current) {
        clearTimeout(saveScrollPositionTimeout.current)
      }
    }
  }, [])

  // Add this function to handle scroll events
  const handleScroll = (event) => {
    const position = event.nativeEvent.contentOffset.y
    setScrollPosition(position)

    // Debounce saving to AsyncStorage to avoid too many writes
    if (saveScrollPositionTimeout.current) {
      clearTimeout(saveScrollPositionTimeout.current)
    }

    saveScrollPositionTimeout.current = setTimeout(() => {
      AsyncStorage.setItem("searchScrollPosition", position.toString())
    }, 300)
  }

  // Add a function to save the active tab to AsyncStorage
  const saveSearchActiveTab = async (tab) => {
    try {
      await AsyncStorage.setItem("searchActiveTab", tab)
    } catch (error) {
      console.error("Error saving search active tab:", error)
    }
  }

  // Add a function to load the active tab from AsyncStorage
  const loadSearchActiveTab = async () => {
    try {
      const savedTab = await AsyncStorage.getItem("searchActiveTab")
      if (savedTab) {
        setActiveTab(savedTab)
      } else {
        // If no saved tab, default to search
        setActiveTab("search")
      }
      setIsTabsLoaded(true)
    } catch (error) {
      console.error("Error loading search active tab:", error)
      setActiveTab("search") // Fallback to default on error
      setIsTabsLoaded(true)
    }
  }

  // Load recent searches from AsyncStorage
  useEffect(() => {
    // Load the active tab first, then load recent searches
    loadSearchActiveTab()
    loadRecentSearches()
  }, [])

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

  // Updated function to store complete search result objects
  const addToRecentSearchesWithData = async (searchTerm: any, resultData: any) => {
    // Create a new object with the search term and the result data
    const newRecentSearch = {
      ...resultData,
      searchTerm: searchTerm, // Add the original search term for reference
    }

    // Filter out any existing entries with the same kanji or id
    const filteredSearches = recentSearches.filter((item) => item.word !== resultData.word && item.id !== resultData.id)

    // Add the new search to the beginning and limit to 5 items
    const updatedSearches = [newRecentSearch, ...filteredSearches].slice(0, 5)

    setRecentSearches(updatedSearches)

    try {
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    } catch (error) {
      console.error("Error saving recent searches:", error)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowNoResults(false)
  }

  const onSubmit = async (query = searchQuery) => {
    if (!query.trim()) return

    setIsLoading(true)
    setResult({})
    setSearchResults([])
    setShowNoResults(false)
    setActiveTab("search") // Switch to search tab when submitting

    try {
      const { result, formattedResult, allResults } = await searchWord(query)
      setResult(result)

      if (formattedResult) {
        // Use all results instead of just the first one
        setSearchResults(allResults || [formattedResult])
        // Add to recent searches with the complete data
        addToRecentSearchesWithData(query, formattedResult)
      } else {
        setShowNoResults(true)
      }
    } catch (error) {
      console.error("Error in search:", error)
      setShowNoResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Modify the handleSelectWord function to save the active tab and scroll position
  const handleSelectWord = (word) => {
    // Save current scroll position before navigating
    AsyncStorage.setItem("searchScrollPosition", scrollPosition.toString())

    // Save which tab we're on before viewing details
    saveSearchActiveTab(activeTab)

    // Save that we're coming from search screen
    AsyncStorage.setItem("previousScreen", "search")

    setSelectedWord(word)
  }

  // Update the renderWordCard function to handle text overflow properly
  const renderWordCard = (item, isFavorite) => (
    <TouchableOpacity
      key={item.id || item.word}
      style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.wordCard]}
      onPress={() => handleSelectWord(item)}
    >
      <View style={globalStyles.wordHeader}>
        <Text
          style={[globalStyles.kanjiText, theme === "dark" && globalStyles.darkText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.word}
        </Text>
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(item)}
        >
          <Star size={20} fill={isFavorite ? "#FFD700" : "transparent"} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {item.hiragana && (
        <Text
          style={[globalStyles.hiraganaText, theme === "dark" && globalStyles.darkText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.hiragana}
        </Text>
      )}
      <Text
        style={[globalStyles.romajiText, theme === "dark" && globalStyles.darkText]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.romaji}
      </Text>
      <Text
        style={[globalStyles.meaningText, theme === "dark" && globalStyles.darkText]}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {item.meaning}
      </Text>

      {/* Add JLPT level badge if available */}
      {item.jlpt && (
        <View style={[styles.jlptBadge, styles[`n${item.jlpt}Badge`] || styles.n5Badge]}>
          <Text style={styles.jlptBadgeText}>JLPT N{item.jlpt}</Text>
        </View>
      )}

      {/* Add common word indicator */}
      {item.common && (
        <View style={styles.commonBadge}>
          <Text style={styles.commonBadgeText}>Common</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const handleSubmit = () => {
    Keyboard.dismiss()
    onSubmit()
  }

  const renderTabButton = (tabName, label, icon) => {
    const isActive = activeTab === tabName
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => {
          setActiveTab(tabName)
          saveSearchActiveTab(tabName) // Save the tab when it changes
        }}
      >
        <LinearGradient
          colors={
            isActive
              ? [colors.primary, colors.accent]
              : [
                  theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)",
                  theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tabButtonGradient}
        >
          {icon}
          <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  // Add a useEffect to restore the previous tab when returning from details
  useEffect(() => {
    // When selectedWord becomes null (user returned from details)
    // and we have a previousTab saved, restore that tab
    if (setSelectedWord === null && previousTab) {
      setActiveTab(previousTab)
    }
  }, [setSelectedWord])

  // Update the return statement to conditionally render based on isTabsLoaded
  return (
    <View style={styles.container}>
      <GradientBackground theme={theme} />

      {isTabsLoaded && activeTab === "search" && (
        <View style={styles.searchBarContainer}>
          <LinearGradient
            colors={
              theme === "dark"
                ? ["rgba(40,40,40,0.8)", "rgba(30,30,30,0.6)"]
                : ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.6)"]
            }
            style={styles.searchBarGradient}
          >
            <View
              style={[
                styles.searchBar,
                theme === "dark"
                  ? {
                      backgroundColor: "rgba(40, 40, 40, 0.8)",
                      borderColor: "rgba(60, 60, 60, 0.8)",
                    }
                  : null,
              ]}
            >
              <Search
                size={20}
                color={theme === "dark" ? colors.darkText : colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, theme === "dark" && { color: colors.darkText }]}
                placeholder="Search Japanese or English words..."
                placeholderTextColor={theme === "dark" ? colors.darkTextTertiary : colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSubmit}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <X size={16} color={theme === "dark" ? colors.darkTextTertiary : colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSubmit}
              disabled={isLoading || !searchQuery.trim()}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Tab buttons */}
      {isTabsLoaded && (
        <View style={[styles.tabsContainer, activeTab !== "search" && { marginTop: 16 }]}>
          {renderTabButton(
            "search",
            "Search",
            <Search
              size={16}
              color={activeTab === "search" ? "#FFFFFF" : theme === "dark" ? colors.darkText : colors.text}
              style={styles.tabIcon}
            />,
          )}
          {renderTabButton(
            "favorites",
            "Favorites",
            <Heart
              size={16}
              color={activeTab === "favorites" ? "#FFFFFF" : theme === "dark" ? colors.darkText : colors.text}
              style={styles.tabIcon}
            />,
          )}
          {renderTabButton(
            "recent",
            "Recent",
            <Clock
              size={16}
              color={activeTab === "recent" ? "#FFFFFF" : theme === "dark" ? colors.darkText : colors.text}
              style={styles.tabIcon}
            />,
          )}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Throttle scroll events for better performance
      >
        {/* Loading Indicator */}
        {isLoading && (
          <View
            style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.loadingContainer]}
          >
            <ActivityIndicator size="large" color={theme === "dark" ? colors.darkText : colors.primary} />
            <Text style={[styles.loadingText, theme === "dark" && globalStyles.darkText]}>Searching...</Text>
          </View>
        )}

        {/* No Results Message */}
        {isTabsLoaded && showNoResults && !isLoading && activeTab === "search" && (
          <View
            style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.noResultsContainer]}
          >
            <Image source={{ uri: "/placeholder.svg?height=80&width=80" }} style={styles.noResultsImage} />
            <Text style={[styles.noResultsTitle, theme === "dark" && globalStyles.darkText]}>No results found</Text>
            <Text style={[styles.noResultsText, theme === "dark" && globalStyles.darkText]}>
              Try searching for a different word or phrase
            </Text>
          </View>
        )}

        {/* Search Results Section */}
        {isTabsLoaded && activeTab === "search" && searchResults.length > 0 && !isLoading && (
          <View style={styles.resultsContainer}>
            <View style={styles.sectionHeader}>
              <View style={[globalStyles.iconCircle, { backgroundColor: colors.accent }]}>
                <Search size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Search Results</Text>
            </View>

            {searchResults.map((item) => {
              const isFavorite = favorites.some((fav) => fav.id === item.id || fav.word === item.word)
              return renderWordCard(item, isFavorite)
            })}
          </View>
        )}

        {/* Favorites Section */}
        {isTabsLoaded && activeTab === "favorites" && (
          <View style={styles.favoritesContainer}>
            <View style={styles.sectionHeader}>
              <View style={[globalStyles.iconCircle, { backgroundColor: colors.primary }]}>
                <Heart size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Favorites</Text>
            </View>

            {favorites.length > 0 ? (
              favorites.map((item) => renderWordCard(item, true))
            ) : (
              <View
                style={[
                  globalStyles.glassCard,
                  theme === "dark" && globalStyles.darkGlassCard,
                  styles.emptyStateContainer,
                ]}
              >
                <View style={styles.emptyIconContainer}>
                  <Heart
                    size={64}
                    fill={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.5)"}
                    color={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.5)"}
                  />
                </View>
                <Text style={[styles.emptyStateTitle, theme === "dark" && globalStyles.darkText]}>
                  No Favorites Yet
                </Text>
                <Text style={[styles.emptyStateText, theme === "dark" && globalStyles.darkText]}>
                  Words you favorite will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Searches Section */}
        {isTabsLoaded && activeTab === "recent" && (
          <View style={styles.recentSearchesContainer}>
            <View style={styles.sectionHeader}>
              <View style={[globalStyles.iconCircle, { backgroundColor: colors.tertiary }]}>
                <Clock size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Recent Searches</Text>
            </View>

            {recentSearches.length > 0 ? (
              recentSearches.map((item, index) => {
                const isFavorite = favorites.some((fav) => fav.id === item.id || fav.word === item.word)
                return renderWordCard(item, isFavorite)
              })
            ) : (
              <View
                style={[
                  globalStyles.glassCard,
                  theme === "dark" && globalStyles.darkGlassCard,
                  styles.emptyStateContainer,
                ]}
              >
                <Image source={{ uri: "/placeholder.svg?height=100&width=100" }} style={styles.emptyStateImage} />
                <Text style={[styles.emptyStateTitle, theme === "dark" && globalStyles.darkText]}>
                  No Recent Searches
                </Text>
                <Text style={[styles.emptyStateText, theme === "dark" && globalStyles.darkText]}>
                  Search for Japanese words or phrases to see them here
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Empty State - Initial View */}
        {isTabsLoaded &&
          activeTab === "search" &&
          recentSearches.length === 0 &&
          !isLoading &&
          searchResults.length === 0 &&
          !showNoResults && (
            <View
              style={[
                globalStyles.glassCard,
                theme === "dark" && globalStyles.darkGlassCard,
                styles.emptyStateContainer,
              ]}
            >
              <Image source={{ uri: "/placeholder.svg?height=100&width=100" }} style={styles.emptyStateImage} />
              <Text style={[styles.emptyStateTitle, theme === "dark" && globalStyles.darkText]}>Start Searching</Text>
              <Text style={[styles.emptyStateText, theme === "dark" && globalStyles.darkText]}>
                Search for Japanese words or phrases to see them here
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  searchBarGradient: {
    borderRadius: 30,
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 50,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: "space-between",
    marginTop: 0,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  activeTabButton: {
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  activeTabButtonText: {
    color: "#FFFFFF",
  },
  tabIcon: {
    marginRight: 6,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  resultsContainer: {
    marginBottom: 24,
  },
  recentSearchesContainer: {
    marginBottom: 16,
  },
  favoritesContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 12,
  },
  wordCard: {
    marginBottom: 16,
  },
  noResultsContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  noResultsImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.6,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
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
  jlptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.info,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  jlptBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  n1Badge: {
    backgroundColor: colors.error,
  },
  n2Badge: {
    backgroundColor: colors.warning,
  },
  n3Badge: {
    backgroundColor: colors.primary,
  },
  n4Badge: {
    backgroundColor: colors.info,
  },
  n5Badge: {
    backgroundColor: colors.success,
  },
  commonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.tertiary,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  commonBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
})

