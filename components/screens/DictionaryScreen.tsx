import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { StyleSheet } from "react-native";
import { globalStyles } from "../../styles/globalStyles";
import { useState, useEffect } from "react";
import vocal from "../../data/vocab.json";

interface Vocabulary {
  word: string;
  meaning: string;
  furigana: string;
  romaji: string;
  level: number;
}

export default function DictionaryScreen({ theme }: any) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Vocabulary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    handleSearch();
  }, [selectedLevel, page]);

  const toggleLevel = (level: string) => {
    setSelectedLevel((prev) => (prev === level ? null : level));
    setPage(1);
  };

  const handleSearch = async () => {
    setLoading(true);
    const filteredResults = vocal.filter((item: Vocabulary) => {
      const levelMatch =
        !selectedLevel || selectedLevel === `N${item.level}`;
      return levelMatch;
    });

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    setSearchResults((prevResults) =>
      page === 1 ? paginatedResults : [...prevResults, ...paginatedResults]
    );
    setLoading(false);
  };

  const getLevelString = (level: number) => {
    return `N${level}`;
  };

  const loadMore = () => {
    if (!loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const renderItem = ({ item }: { item: Vocabulary }) => (
    <View style={styles.resultItem}>
      <Text
        style={[styles.resultText, theme === "dark" && globalStyles.darkText]}
      >
        {item.word} ({item.furigana}) - {item.meaning} ({item.romaji})
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.dictionaryContainer,
        theme === "dark" && globalStyles.darkBackground,
      ]}
    >
      <View style={styles.categorySection}>
        <Text
          style={[styles.categoryTitle, theme === "dark" && globalStyles.darkText]}
        >
          JLPT Levels
        </Text>
        <View style={styles.categoryGrid}>
          {[5, 4, 3, 2, 1].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.categoryCard,
                theme === "dark" && globalStyles.darkCard,
                selectedLevel === `N${level}` && styles.selectedCategory,
              ]}
              onPress={() => toggleLevel(`N${level}`)}
            >
              <Text
                style={[
                  styles.categoryText,
                  theme === "dark" && globalStyles.darkText,
                ]}
              >
                {`N${level}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </View>
      <View>
      <Text
          style={[styles.categoryTitle, theme === "dark" && globalStyles.darkText]}
        >
          Verbs Results: {searchResults.length}
        </Text>
      </View>
      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <Text>Loading...</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dictionaryContainer: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: "center",
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
  selectedCategory: {
    backgroundColor: "#493D9E", // Light Blue
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  resultText: {
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  searchButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
