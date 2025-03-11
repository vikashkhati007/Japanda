//@ts-nocheck
import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { Search, Star } from "lucide-react-native"
import { StyleSheet } from "react-native"
import { globalStyles } from "../../styles/globalStyles"
import { searchWord } from "../../lib/utils"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function SearchScreen({
  theme,
  recentSearches,
  setRecentSearches,
  favorites,
  addToRecentSearches,
  toggleFavorite,
  setSelectedWord,
}:any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [result, setResult] = useState({})

  // Load recent searches from AsyncStorage
  useEffect(() => {
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
  const addToRecentSearchesWithData = async (searchTerm:any, resultData:any) => {
    // Create a new object with the search term and the result data
    const newRecentSearch = {
      ...resultData,
      searchTerm: searchTerm // Add the original search term for reference
    }
    
    // Filter out any existing entries with the same kanji or id
    const filteredSearches = recentSearches.filter(
      item => item.kanji !== resultData.kanji && item.id !== resultData.id
    )
    
    // Add the new search to the beginning and limit to 5 items
    const updatedSearches = [newRecentSearch, ...filteredSearches].slice(0, 5)
    
    setRecentSearches(updatedSearches)
    
    try {
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    } catch (error) {
      console.error("Error saving recent searches:", error)
    }
  }

  const onSubmit = async (query = searchQuery) => {
    if (!query.trim()) return

    setIsLoading(true)
    setResult({})
    setSearchResults([])

    try {
      const { result, formattedResult } = await searchWord(query)
      setResult(result)
      setSearchResults([formattedResult])
      
      // Add to recent searches with the complete data
      addToRecentSearchesWithData(query, formattedResult)
    } catch (error) {
      console.error("Error in search:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.searchScrollView, theme === "dark" && globalStyles.darkBackground]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, theme === "dark" && globalStyles.darkSearchBar]}>
          <Search size={20} color={theme === "dark" ? "#fff" : "#666"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, theme === "dark" && globalStyles.darkText]}
            placeholder="Search in Japanese or English"
            placeholderTextColor={theme === "dark" ? "#999" : "#666"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => onSubmit()}
          />
        </View>
        <TouchableOpacity
          style={[styles.searchButton, theme === "dark" && globalStyles.darkButton]}
          onPress={() => onSubmit()}
          disabled={isLoading}
        >
          <Text style={[styles.searchButtonText, theme === "dark" && globalStyles.darkButtonText]}>Search </Text>
        </TouchableOpacity>
      </View>

      {/* Search Results Section */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Search Results</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme === "dark" ? "#fff" : "#333"} />
            <Text style={[styles.loadingText, theme === "dark" && globalStyles.darkText]}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <View style={globalStyles.wordListContent}>
            {searchResults.map((item) => {
              const isFavorite = favorites.some((fav) => fav.id === item.id || fav.kanji === item.kanji)
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[globalStyles.wordCard, theme === "dark" && globalStyles.darkCard]}
                  onPress={() => setSelectedWord(item)}
                >
                  <View style={globalStyles.wordHeader}>
                    <Text style={[globalStyles.kanjiText, theme === "dark" && globalStyles.darkText]}>{item.kanji}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(item)}>
                      <Star size={24} fill={isFavorite ? "#FFD700" : "transparent"}  color={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"} />
                    </TouchableOpacity>
                  </View>
                  {item.hiragana && (
                    <Text style={[globalStyles.hiraganaText, theme === "dark" && globalStyles.darkText]}>
                      {item.hiragana}
                    </Text>
                  )}
                  <Text style={[globalStyles.romajiText, theme === "dark" && globalStyles.darkText]}>{item.romaji}</Text>
                  <Text style={[globalStyles.meaningText, theme === "dark" && globalStyles.darkText]}>{item.meaning}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ) : searchQuery && !isLoading ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, theme === "dark" && globalStyles.darkText]}>No results found</Text>
          </View>
        ) : null}
      </View>

      {/* Recent Searches Section - Always visible */}
      {recentSearches.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>Recent Searches</Text>
          <View style={globalStyles.wordListContent}>
            {recentSearches.map((item, index) => {
              const isFavorite = favorites.some((fav) => fav.id === item.id || fav.kanji === item.kanji)
              return (
                <TouchableOpacity
                  key={`recent-${index}`}
                  style={[globalStyles.wordCard, theme === "dark" && globalStyles.darkCard]}
                  onPress={() => setSelectedWord(item)}
                >
                  <View style={globalStyles.wordHeader}>
                    <Text style={[globalStyles.kanjiText, theme === "dark" && globalStyles.darkText]}>{item.kanji}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(item)}>
                      <Star size={24} fill={isFavorite ? "#FFD700" : "transparent"}  color={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"} />
                    </TouchableOpacity>
                  </View>
                  {item.hiragana && (
                    <Text style={[globalStyles.hiraganaText, theme === "dark" && globalStyles.darkText]}>
                      {item.hiragana}
                    </Text>
                  )}
                  <Text style={[globalStyles.romajiText, theme === "dark" && globalStyles.darkText]}>{item.romaji}</Text>
                  <Text style={[globalStyles.meaningText, theme === "dark" && globalStyles.darkText]}>{item.meaning}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  searchScrollView: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recentSearchesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 18,
    color: "#666",
  },
})