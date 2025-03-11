"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  useColorScheme,
} from "react-native"
import { Home, Search, BookOpen, Star, Settings } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Import screens
import SearchScreen from "../../components/screens/SearchScreen"
import DetailScreen from "../../components/screens/DetailScreen"
import FavoritesScreen from "../../components/screens/FavoritesScreen"
import DictionaryScreen from "../../components/screens/DictionaryScreen"
import SettingsScreen from "../../components/screens/SettingsScreen"

// Import shared styles
import { globalStyles } from "../../styles/globalStyles"
import HomeScreen from "@/components/screens/HomeScreen"

export default function App() {
  const [selectedWord, setSelectedWord] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("home") // Changed default to home
  const [favorites, setFavorites] = useState<any>([])
  const [recentSearches, setRecentSearches] = useState<any>([])
  const colorScheme = useColorScheme()
  const [theme, setTheme] = useState<any>(colorScheme === "dark" ? "dark" : "light")

  useEffect(() => {
    loadFavorites()
    loadRecentSearches()
  }, [])

  useEffect(() => {
    if (activeTab !== "search" && activeTab !== "home") {
      setSelectedWord(null)
    }
  }, [activeTab])

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

  const addToRecentSearches = async (term:any) => {
    const updatedSearches = [term, ...recentSearches.filter((item:any) => item !== term)].slice(0, 5)
    setRecentSearches(updatedSearches)
    try {
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    } catch (error) {
      console.error("Error saving recent searches:", error)
    }
  }

  const toggleFavorite = async (word:any) => {
    let newFavorites
    if (favorites.some((fav:any) => fav.id === word.id || fav.kanji === word.kanji)) {
      newFavorites = favorites.filter((fav:any) => fav.id !== word.id && fav.kanji !== word.kanji)
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

  const toggleTheme = () => {
    setTheme((prevTheme:any) => (prevTheme === "light" ? "dark" : "light"))
  }

  const renderContent = () => {
    // If a word is selected, show the DetailScreen regardless of which tab initiated it
    if (selectedWord) {
      return (
        <DetailScreen
          selectedWord={selectedWord}
          setSelectedWord={setSelectedWord}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          theme={theme}
        />
      )
    }
  
    // Otherwise, show the appropriate screen based on activeTab
    if (activeTab === "home") {
      return (
        <HomeScreen
          theme={theme}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          setSelectedWord={setSelectedWord}
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
          setSelectedWord={setSelectedWord}
        />
      )
    } else if (activeTab === "favorites") {
      return (
        <FavoritesScreen
          theme={theme}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          setSelectedWord={setSelectedWord}
        />
      )
    } else if (activeTab === "dictionary") {
      return <DictionaryScreen theme={theme} />
    } else {
      return <SettingsScreen theme={theme} toggleTheme={toggleTheme} />
    }
  }

  return (
    <SafeAreaView style={[globalStyles.container, theme === "dark" && globalStyles.darkBackground]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <View style={[globalStyles.header, theme === "dark" && globalStyles.darkHeader]}>
        <Text style={[globalStyles.headerTitle, theme === "dark" && globalStyles.darkText]}>
          {activeTab === "home"
            ? "Home (日本語)"
            : activeTab === "search"
              ? "Search (検索)"
              : activeTab === "favorites"
                ? "Favorites (お気に入り)"
                : activeTab === "dictionary"
                  ? "Dictionary (辞書)"
                  : "Settings (設定)"}
        </Text>
      </View>

      <View style={globalStyles.content}>{renderContent()}</View>

      <View style={[globalStyles.tabBar, theme === "dark" && globalStyles.darkTabBar]}>
      <TouchableOpacity
    style={[globalStyles.tab, activeTab === "home" && globalStyles.activeTab]}
    onPress={() => {
      // Clear selectedWord when switching to home tab
      setSelectedWord(null)
      setActiveTab("home")
    }}
  >
    <Home size={24} color={activeTab === "home" ? "#333" : "#999"} />
    <Text style={[globalStyles.tabText, activeTab === "home" && globalStyles.activeTabText]}>Home</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[globalStyles.tab, activeTab === "search" && globalStyles.activeTab]}
    onPress={() => {
      // Clear selectedWord when switching to search tab
      setSelectedWord(null)
      setActiveTab("search")
    }}
  >
    <Search size={24} color={activeTab === "search" ? "#333" : "#999"} />
    <Text style={[globalStyles.tabText, activeTab === "search" && globalStyles.activeTabText]}>Search</Text>
  </TouchableOpacity>


  <TouchableOpacity
    style={[globalStyles.tab, activeTab === "favorites" && globalStyles.activeTab]}
    onPress={() => {
      // Clear selectedWord when switching to favorites tab
      setSelectedWord(null)
      setActiveTab("favorites")
    }}
  >
    <Star size={24} color={activeTab === "favorites" ? "#333" : "#999"} />
    <Text style={[globalStyles.tabText, activeTab === "favorites" && globalStyles.activeTabText]}>Favorites</Text>
  </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.tab, activeTab === "dictionary" && globalStyles.activeTab]}
          onPress={() => setActiveTab("dictionary")}
        >
          <BookOpen size={24} color={activeTab === "dictionary" ? "#333" : "#999"} />
          <Text style={[globalStyles.tabText, activeTab === "dictionary" && globalStyles.activeTabText]}>Dictionary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.tab, activeTab === "settings" && globalStyles.activeTab]}
          onPress={() => setActiveTab("settings")}
        >
          <Settings size={24} color={activeTab === "settings" ? "#333" : "#999"} />
          <Text style={[globalStyles.tabText, activeTab === "settings" && globalStyles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}