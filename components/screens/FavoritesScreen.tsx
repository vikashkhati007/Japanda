import { View, Text, FlatList, TouchableOpacity } from "react-native"
import { Star } from "lucide-react-native"
import { StyleSheet } from "react-native"
import { globalStyles, colors } from "../../styles/globalStyles"
import GradientBackground from "../GradientBackground"

export default function FavoritesScreen({ theme, favorites, toggleFavorite, setSelectedWord }: any) {
  return (
    <View style={styles.container}>
      <GradientBackground theme={theme} />

      <View style={styles.centeredContainer}>
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            renderItem={({ item }) => {
              const isFavorite = favorites.some((fav: any) => fav.id === item.id || fav.word === item.word)
              const wordToDisplay = item.word || item.kanji || ""

              return (
                <TouchableOpacity
                  style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard]}
                  onPress={() => setSelectedWord(item)}
                >
                  <View style={globalStyles.wordHeader}>
                    <Text
                      style={[globalStyles.kanjiText, theme === "dark" && globalStyles.darkText]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {wordToDisplay}
                    </Text>
                    <TouchableOpacity
                      style={[styles.favoriteButton, styles.favoriteButtonActive]}
                      onPress={() => toggleFavorite(item)}
                    >
                      <Star size={20} fill="#FFD700" color="#FFFFFF" />
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
                </TouchableOpacity>
              )
            }}
            keyExtractor={(item) => item.id || item.word || item.kanji}
            style={styles.wordList}
            contentContainerStyle={globalStyles.wordListContent}
          />
        ) : (
          <View
            style={[globalStyles.glassCard, theme === "dark" && globalStyles.darkGlassCard, styles.emptyStateContainer]}
          >
            <View style={styles.emptyIconContainer}>
              <Star
                size={64}
                fill={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.5)"}
                color={theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.5)"}
              />
            </View>
            <Text style={[styles.emptyStateTitle, theme === "dark" && globalStyles.darkText]}>No Favorites Yet</Text>
            <Text style={[styles.emptyStateText, theme === "dark" && globalStyles.darkText]}>
              Words you favorite will appear here
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    padding: 16,
  },
  wordList: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
    marginBottom: 40,
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
    maxWidth: 240,
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
})

