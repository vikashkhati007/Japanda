import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ArrowLeft, Star, Volume2 } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { globalStyles } from "../../styles/globalStyles";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { useState, useEffect } from "react";

interface Word {
  id?: string;
  kanji: string;
  hiragana?: string;
  romaji: string;
  meaning: string;
  sentence: string;
  audioUrl?: string; // Audio file URL if available
  additional_examples?: Array<{
    japanese: string;
    english: string;
  }>;
}

interface DetailScreenProps {
  selectedWord: Word;
  setSelectedWord: (word: Word | null) => void;
  favorites: Word[];
  toggleFavorite: (word: Word) => void;
  theme: "light" | "dark";
}

export default function DetailScreen({
  selectedWord,
  setSelectedWord,
  favorites,
  toggleFavorite,
  theme,
}: DetailScreenProps) {
  const isFavorite = favorites.some(
    (fav) => fav.id === selectedWord.id || fav.kanji === selectedWord.kanji
  );
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Function to play pronunciation
  const playPronunciation = async () => {
    // Agar audioUrl available hai, toh use expo-av se play karo
    if (selectedWord.audioUrl) {
      if (sound) {
        await sound.unloadAsync();
      }
      try {
        setIsPlaying(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: selectedWord.audioUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error("Error playing sound:", error);
        setIsPlaying(false);
      }
    } else {
      // Nahi toh, expo-speech ka use karke text ko voice mein convert karo
      const textToSpeak =
        selectedWord.kanji +
        " " +
        (selectedWord.hiragana ? selectedWord.hiragana + " " : "") +
        selectedWord.romaji;
      setIsPlaying(true);
      Speech.speak(textToSpeak, {
        language: "ja-JP", // Set Japanese language for better clarity
        onDone: () => setIsPlaying(false),
        onError: (error:any) => {
          console.error("Speech error:", error);
          setIsPlaying(false);
        },
      });
    }
  };

  return (
    <ScrollView
      style={[
        styles.detailContainer,
        theme === "dark" && globalStyles.darkBackground,
      ]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedWord(null)}
      >
        <ArrowLeft size={20} color={theme === "dark" ? "#fff" : "#333"} />
        <Text
          style={[
            styles.backButtonText,
            theme === "dark" && globalStyles.darkText,
          ]}
        >
          Back
        </Text>
      </TouchableOpacity>

      <View style={styles.detailHeader}>
        <Text
          style={[
            styles.detailKanji,
            theme === "dark" && globalStyles.darkText,
          ]}
        >
          {selectedWord.kanji}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.audioButton}
            onPress={playPronunciation}
            disabled={isPlaying}
          >
            <Volume2
              size={24}
              color={theme === "dark" ? "#fff" : "#333"}
              style={isPlaying ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(selectedWord)}
          >
            <Star
              size={24}
              fill={isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"}
              color={
                isFavorite ? "#FFD700" : theme === "dark" ? "#fff" : "#ccc"
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {selectedWord.hiragana && (
        <Text
          style={[
            styles.detailHiragana,
            theme === "dark" && globalStyles.darkText,
          ]}
        >
          {selectedWord.hiragana}
        </Text>
      )}
      <Text
        style={[styles.detailRomaji, theme === "dark" && globalStyles.darkText]}
      >
        {selectedWord.romaji}
      </Text>

      <View style={styles.meaningContainer}>
        <Text
          style={[
            styles.meaningLabel,
            theme === "dark" && globalStyles.darkText,
          ]}
        >
          Meaning
        </Text>
        <Text
          style={[
            styles.detailMeaning,
            theme === "dark" && globalStyles.darkText,
          ]}
        >
          {selectedWord.meaning}
        </Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text
          style={[
            styles.exampleLabel,
            theme === "dark" && globalStyles.darkText,
          ]}
        >
          Example Sentence
        </Text>
        <View
          style={[
            styles.exampleCard,
            theme === "dark" && globalStyles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.exampleJapanese,
              theme === "dark" && globalStyles.darkText,
            ]}
          >
            {selectedWord.sentence}
          </Text>
          <Text
            style={[
              styles.exampleRomaji,
              theme === "dark" && globalStyles.darkText,
            ]}
          >
            {selectedWord.romaji}
          </Text>
          <Text
            style={[
              styles.exampleEnglish,
              theme === "dark" && globalStyles.darkText,
            ]}
          >
            {selectedWord.meaning}
          </Text>
        </View>
      </View>

      {selectedWord.additional_examples &&
        selectedWord.additional_examples.length > 0 && (
          <View style={styles.exampleContainer}>
            <Text
              style={[
                styles.exampleLabel,
                theme === "dark" && globalStyles.darkText,
              ]}
            >
              Additional Examples
            </Text>
            {selectedWord.additional_examples.map((example, index) => (
              <View
                key={index}
                style={[
                  styles.exampleCard,
                  theme === "dark" && globalStyles.darkCard,
                ]}
              >
                <Text
                  style={[
                    styles.exampleJapanese,
                    theme === "dark" && globalStyles.darkText,
                  ]}
                >
                  {example.japanese}
                </Text>
                <Text
                  style={[
                    styles.exampleEnglish,
                    theme === "dark" && globalStyles.darkText,
                  ]}
                >
                  {example.english}
                </Text>
              </View>
            ))}
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 4,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailKanji: {
    fontSize: 36,
    fontWeight: "700",
    color: "#333",
  },
  favoriteButton: {
    padding: 8,
  },
  audioButton: {
    padding: 8,
    marginRight: 8,
  },
  detailHiragana: {
    fontSize: 20,
    color: "#666",
    marginBottom: 4,
  },
  detailRomaji: {
    fontSize: 18,
    color: "#888",
    marginBottom: 24,
    fontStyle: "italic",
  },
  meaningContainer: {
    marginBottom: 24,
  },
  meaningLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  detailMeaning: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
  },
  exampleContainer: {
    marginBottom: 24,
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  exampleCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  exampleJapanese: {
    fontSize: 18,
    color: "#333",
  },
  exampleRomaji: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  exampleEnglish: {
    fontSize: 16,
    color: "#333",
  },
});
