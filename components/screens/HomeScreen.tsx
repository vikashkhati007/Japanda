import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native"
import { Star, Calendar, Sparkles, TrendingUp, GraduationCap } from "lucide-react-native"
import { globalStyles } from "../../styles/globalStyles"
import { searchWord } from "../../lib/utils"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Word {
  id?: string;
  kanji: string;
  romaji: string;
  meaning: string;
  sentence: string;
}

interface HomeScreenProps {
  theme: "light" | "dark";
  toggleFavorite: (word: Word) => void;
  favorites: Word[];
  setSelectedWord: (word: Word) => void;
}

export default function HomeScreen({ theme, toggleFavorite, favorites, setSelectedWord }: HomeScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null)
  const [funnyWord, setFunnyWord] = useState<Word | null>(null)
  const [popularWords, setPopularWords] = useState<Word[]>([])
  const [jlptWords, setJlptWords] = useState<Word[]>([])

  useEffect(() => {
    loadDailyWords()
  }, [])

  const loadDailyWords = async () => {
    setIsLoading(true)
    try {
      // Check if we already have today's words and if they're still valid
      const today = new Date().toDateString()
      const storedData = await AsyncStorage.getItem('dailyWords')
      const dailyData = storedData ? JSON.parse(storedData) : null
      
      if (dailyData && dailyData.date === today) {
        // Use cached data if it's from today
        setWordOfDay(dailyData.wordOfDay)
        setFunnyWord(dailyData.funnyWord)
        setPopularWords(dailyData.popularWords || [])
        setJlptWords(dailyData.jlptWords || [])
      } else {
        // Fetch new data
        await fetchDailyWords()
      }
    } catch (error) {
      console.error("Error loading daily words:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDailyWords = async () => {
    try {
      // Fetch word of the day
      const wordPromise = searchWord("Give me a common Japanese word that would be useful for beginners")
      
      // Fetch funny word of the day
      const funnyPromise = searchWord("Give me a funny or interesting Japanese slang word or phrase")
      
      // Fetch popular words (simplified for demo)
      const popularPromise = Promise.all([
        searchWord("food in Japanese"),
        searchWord("hello in Japanese"),
        searchWord("thank you in Japanese")
      ])
      
      // Fetch JLPT N5 words (simplified for demo)
      const jlptPromise = Promise.all([
        searchWord("JLPT N5 word for water"),
        searchWord("JLPT N5 word for book")
      ])
      
      // Wait for all promises to resolve
      const [wordResult, funnyResult, popularResults, jlptResults] = await Promise.all([
        wordPromise, 
        funnyPromise, 
        popularPromise,
        jlptPromise
      ])
      
      setWordOfDay(wordResult.formattedResult)
      setFunnyWord(funnyResult.formattedResult)
      setPopularWords(popularResults.map(result => result.formattedResult))
      setJlptWords(jlptResults.map(result => result.formattedResult))
      
      // Save to AsyncStorage with today's date
      const dailyData = {
        date: new Date().toDateString(),
        wordOfDay: wordResult.formattedResult,
        funnyWord: funnyResult.formattedResult,
        popularWords: popularResults.map(result => result.formattedResult),
        jlptWords: jlptResults.map(result => result.formattedResult)
      }
      
      await AsyncStorage.setItem('dailyWords', JSON.stringify(dailyData))
    } catch (error) {
      console.error("Error fetching daily words:", error)
    }
  }

  const renderWordCard = (word: Word | null, subtitle: string) => {
    if (!word) return null
    
    const isFavorite = favorites.some((fav) => fav.id === word.id || fav.kanji === word.kanji)
    
    return (
      <TouchableOpacity 
        style={[styles.wordOfDayCard, theme === "dark" && globalStyles.darkCard]}
        onPress={() => setSelectedWord(word)}
      >
        <View style={styles.wordCardHeader}>
          <Text style={[styles.wordCardSubtitle, theme === "dark" && globalStyles.darkText]}>{subtitle}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(word)}>
            <Star size={24} fill={isFavorite ? "#FFD700" : "transparent"} color={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.wordCardKanji, theme === "dark" && globalStyles.darkText]}>{word.kanji}</Text>
        <Text style={[styles.wordCardRomaji, theme === "dark" && globalStyles.darkText]}>{word.romaji}</Text>
        <Text style={[styles.wordCardMeaning, theme === "dark" && globalStyles.darkText]}>{word.meaning}</Text>
        
        <View style={[styles.wordCardExample, theme === "dark" && styles.darkWelcomeBanner]}>
          <Text style={[styles.wordCardExampleText, theme === "dark" && globalStyles.darkText]}>{word.sentence}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderSmallWordCard = (word: Word | null) => {
    if (!word) return null
    
    const isFavorite = favorites.some((fav) => fav.id === word.id || fav.kanji === word.kanji)
    
    return (
      <TouchableOpacity 
        style={[styles.smallWordCard, theme === "dark" && globalStyles.darkCard]}
        onPress={() => setSelectedWord(word)}
      >
        <View style={styles.smallWordHeader}>
          <Text style={[styles.smallWordKanji, theme === "dark" && globalStyles.darkText]}>{word.kanji}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(word)}>
            <Star size={20} fill={isFavorite ? "#FFD700" : "transparent"}  color={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.smallWordMeaning, theme === "dark" && globalStyles.darkText]}>{word.meaning}</Text>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, theme === "dark" && globalStyles.darkBackground]}>
        <ActivityIndicator size="large" color={theme === "dark" ? "#fff" : "#333"} />
        <Text style={[styles.loadingText, theme === "dark" && globalStyles.darkText]}>
          Loading today's Japanese words...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, theme === "dark" && globalStyles.darkBackground]}>
      {/* Welcome Banner */}
      <View style={[styles.welcomeBanner, theme === "dark" && styles.darkWelcomeBanner]}>
        <Text style={[styles.welcomeText, theme === "dark" && globalStyles.darkText]}>
          こんにちは! Welcome to your daily Japanese!
        </Text>
      </View>
      
      {/* Word of the Day */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color={theme === "dark" ? "#fff" : "#333"} />
          <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>
            Word of the Day
          </Text>
        </View>
        {renderWordCard(wordOfDay, "Today's Word")}
      </View>
      
      {/* Funny Word of the Day */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sparkles size={20} color={theme === "dark" ? "#fff" : "#333"} />
          <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>
            Fun Japanese Expression
          </Text>
        </View>
        {renderWordCard(funnyWord, "Interesting Phrase")}
      </View>
      
      {/* Popular Words */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={theme === "dark" ? "#fff" : "#333"} />
          <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>
            Popular Words
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {popularWords.map((word, index) => (
            <View key={`popular-${index}`} style={styles.horizontalCardContainer}>
              {renderSmallWordCard(word)}
            </View>
          ))}
        </ScrollView>
      </View>
      
      {/* JLPT Study Words */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <GraduationCap size={20} color={theme === "dark" ? "#fff" : "#333"} />
          <Text style={[styles.sectionTitle, theme === "dark" && globalStyles.darkText]}>
            JLPT N5 Study Words
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {jlptWords.map((word, index) => (
            <View key={`jlpt-${index}`} style={styles.horizontalCardContainer}>
              {renderSmallWordCard(word)}
            </View>
          ))}
        </ScrollView>
      </View>
      
      {/* Refresh Button */}
      <TouchableOpacity 
        style={[styles.refreshButton, theme === "dark" && styles.darkRefreshButton]}
        onPress={fetchDailyWords}
      >
        <Text style={[styles.refreshButtonText, theme === "dark" && globalStyles.darkText]}>
          Refresh Daily Words
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  welcomeBanner: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkWelcomeBanner: {
    backgroundColor: '#493D9E',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  wordOfDayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  wordCardKanji: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  wordCardRomaji: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  wordCardMeaning: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  wordCardExample: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
  },
  wordCardExampleText: {
    fontSize: 16,
  },
  horizontalScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  horizontalCardContainer: {
    marginRight: 12,
    width: 160,
  },
  smallWordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    height: 100,
  },
  smallWordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  smallWordKanji: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  smallWordMeaning: {
    fontSize: 14,
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
    marginTop: 24,
  },
  darkRefreshButton: {
    backgroundColor: '#333',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
})