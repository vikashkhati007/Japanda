import { View, Text, FlatList, TouchableOpacity } from "react-native"
import { Star } from "lucide-react-native"
import { StyleSheet } from "react-native"
import { globalStyles } from "../../styles/globalStyles"

export default function FavoritesScreen({ theme, favorites, toggleFavorite, setSelectedWord }:any) {
  return (
    <View style={[styles.centeredContainer, theme === "dark" && globalStyles.darkBackground]}>
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={({ item }) => {
            const isFavorite = favorites.some((fav:any) => fav.id === item.id || fav.kanji === item.kanji)
            return (
              <TouchableOpacity
                style={[globalStyles.wordCard, theme === "dark" && globalStyles.darkCard]}
                onPress={() => setSelectedWord(item)}
              >
                <View style={globalStyles.wordHeader}>
                  <Text style={[globalStyles.kanjiText, theme === "dark" && globalStyles.darkText]}>{item.kanji}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(item)}>
                    <Star size={24} fill={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"} color={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"} />
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
          }}
          keyExtractor={(item) => item.id}
          style={styles.wordList}
          contentContainerStyle={globalStyles.wordListContent}
        />
      ) : (
        <View style={{display : "flex", alignItems: "center", justifyContent: "center", height: "100%"}}>
          <Star size={64} fill={theme === "dark" ? "#4a4a4a" : "#e0e0e0"} color={theme === "dark" ? "#4a4a4a" : "#e0e0e0"} />
          <Text style={[styles.emptyStateTitle, theme === "dark" && globalStyles.darkText]}>No Favorites Yet</Text>
          <Text style={[styles.emptyStateText, theme === "dark" && globalStyles.darkText]}>
            Words you favorite will appear here
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    padding: 20,
   
  },
  wordList: {
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})