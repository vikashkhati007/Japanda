"use client"

import { View, Text, TouchableOpacity, FlatList } from "react-native"
import { StyleSheet } from "react-native"
import { globalStyles, colors } from "../../styles/globalStyles"
import { useState, useEffect } from "react"
import vocal from "../../data/vocab.json"
import { BookOpen } from "lucide-react-native"
import GradientBackground from "../GradientBackground"

interface Vocabulary {
  word: string
  meaning: string
  furigana: string
  romaji: string
  level: number
}

export default function DictionaryScreen({ theme }: any) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Vocabulary[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    handleSearch()
  }, [selectedLevel, page])

  const toggleLevel = (level: string) => {
    setSelectedLevel((prev) => (prev === level ? null : level))
    setPage(1)
  }

  const handleSearch = async () => {
    setLoading(true)
    const filteredResults = vocal.filter((item: Vocabulary) => {
      const levelMatch = !selectedLevel || selectedLevel === `N${item.level}`
      return levelMatch
    })

    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedResults = filteredResults.slice(startIndex, endIndex)

    setSearchResults((prevResults) => (page === 1 ? paginatedResults : [...prevResults, ...paginatedResults]))
    setLoading(false)
  }

  const getLevelString = (level: number) => {
    return `N${level}`
  }

  const loadMore = () => {
    if (!loading) {
      setPage((prevPage) => prevPage + 1)
    }
  }

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "N5":
        return styles.n5Badge
      case "N4":
        return styles.n4Badge
      case "N3":
        return styles.n3Badge
      case "N2":
        return styles.n2Badge
      case "N1":
        return styles.n1Badge
      default:
        return {}
    }
  }

  const getIconBgColor = (level: string) => {
    switch (level) {
      case "N5":
        return { backgroundColor: colors.success }
      case "N4":
        return { backgroundColor: colors.info }
      case "N3":
        return { backgroundColor: colors.primary }
      case "N2":
        return { backgroundColor: colors.warning }
      case "N1":
        return { backgroundColor: colors.error }
      default:
        return { backgroundColor: colors.primary }
    }
  }

  const renderItem = ({ item }: { item: Vocabulary }) => (
    <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard]}>
      <View style={styles.resultHeader}>
        <Text
          style={[styles.resultWord, theme === "dark" && globalStyles.darkText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.word}
        </Text>
        <View style={[styles.levelBadge, getBadgeStyle(`N${item.level}`)]}>
          <Text style={styles.levelBadgeText}>N{item.level}</Text>
        </View>
      </View>
      <Text
        style={[styles.resultFurigana, theme === "dark" && globalStyles.darkText]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.furigana}
      </Text>
      <Text
        style={[styles.resultRomaji, theme === "dark" && globalStyles.darkText]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.romaji}
      </Text>
      <Text
        style={[styles.resultMeaning, theme === "dark" && globalStyles.darkText]}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {item.meaning}
      </Text>
    </View>
  )

  return (
    <View style={styles.dictionaryContainer}>
      <GradientBackground theme={theme} />

      <View style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <View style={[globalStyles.iconCircle, { backgroundColor: colors.tertiary }]}>
            <BookOpen size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.categoryTitle, theme === "dark" && globalStyles.darkText]}>JLPT Levels</Text>
        </View>
        <View style={styles.categoryGrid}>
          {[5, 4, 3, 2, 1].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.categoryCard,
                theme === "dark" && globalStyles.darkGlassCard,
                selectedLevel === `N${level}` && styles.selectedCategory,
                selectedLevel === `N${level}` && getBadgeStyle(`N${level}`),
              ]}
              onPress={() => toggleLevel(`N${level}`)}
            >
              <Text
                style={[
                  styles.categoryText,
                  theme === "dark" && globalStyles.darkText,
                  selectedLevel === `N${level}` && styles.selectedCategoryText,
                ]}
              >
                {`N${level}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsTitle, theme === "dark" && globalStyles.darkText]}>
          Results: {searchResults.length}
        </Text>
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.resultsList}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, theme === "dark" && globalStyles.darkText]}>Loading...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.emptyContainer]}>
            <Text style={[styles.emptyText, theme === "dark" && globalStyles.darkText]}>
              {selectedLevel ? `No words found for ${selectedLevel}` : "Select a JLPT level to see words"}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  dictionaryContainer: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginLeft: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  selectedCategory: {
    borderColor: "transparent",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  n5Badge: {
    backgroundColor: colors.success,
  },
  n4Badge: {
    backgroundColor: colors.info,
  },
  n3Badge: {
    backgroundColor: colors.primary,
  },
  n2Badge: {
    backgroundColor: colors.warning,
  },
  n1Badge: {
    backgroundColor: colors.error,
  },
  resultsHeader: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  resultWord: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  resultFurigana: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  resultRomaji: {
    fontSize: 14,
    fontStyle: "italic",
    color: colors.textTertiary,
    marginBottom: 8,
  },
  resultMeaning: {
    fontSize: 16,
    color: colors.text,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
})
