// @ts-nocheck
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import { toRomaji } from "wanakana"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to check if text contains only hiragana and katakana
export const isOnlyKana = (text: string): boolean => {
  // Regex for hiragana and katakana (excluding kanji)
  return /^[\u3040-\u309F\u30A0-\u30FF\s。、！？.]+$/.test(text)
}

// Function to convert hiragana/katakana text to romaji
export const convertToRomaji = async (japaneseText: string): Promise<string> => {
  try {
    if (!japaneseText) return "No text provided"

    // If the text is already only kana, convert it directly
    if (isOnlyKana(japaneseText)) {
      let romaji = toRomaji(japaneseText)
      // Add spaces between words for better readability
      romaji = romaji.replace(/([a-z])([A-Z])/g, "$1 $2")
      return romaji
    }

    // For text that contains kanji, we need to extract the readings
    // This is a simplified approach - in a real app, you'd need a more sophisticated parser
    // that understands the specific format of your furigana data

    // Replace any non-kana characters with spaces to preserve word boundaries
    const kanaOnly = japaneseText.replace(/[^\u3040-\u309F\u30A0-\u30FF\s。、！？.]/g, " ")

    // Remove extra spaces
    const cleanedKana = kanaOnly.replace(/\s+/g, " ").trim()

    if (cleanedKana.length === 0) {
      return "Romaji unavailable (no kana found)"
    }

    // Convert to romaji
    let romaji = toRomaji(cleanedKana)

    // Add spaces between words for better readability
    romaji = romaji.replace(/([a-z])([A-Z])/g, "$1 $2")

    return romaji
  } catch (error) {
    console.error("Error converting to romaji:", error)
    return japaneseText + " (romaji conversion failed)"
  }
}

export const convertToHiraganaKatakana = (input: any) => {
  // Regular expression to match the pattern [kanji|furigana]
  const regex = /\[([^|]+)\|([^\]]+)\]/g

  // Replace the matched pattern with hiragana and katakana
  const hiragana = input.replace(regex, "$2")
  const katakana = hiragana.replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))

  return { hiragana, katakana }
}

// Update the searchWord function to use more Jotoba API features
export const searchWord = async (query: string) => {
  // Jotoba API endpoint for word search
  const url = "https://jotoba.de/api/search/words"

  // Determine if the query is in Japanese or English
  const isJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(query)

  // Prepare the request data according to Jotoba API requirements
  const requestData = {
    query: query.trim(),
    language: "English", // Target language for translations
    no_english: false, // Include English results
    sort_mode: {
      mode: "relevance", // Sort by relevance
    },
    search_opts: {
      // Set the appropriate search type based on query language
      japanese_script: isJapanese ? "auto" : "romaji",
      language: isJapanese ? "Japanese" : "English",
      common_only: false,
      sentence_search: false,
    },
  }

  try {
    // Make the API request for words
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Check if we have results
    if (!response.data.words || response.data.words.length === 0) {
      throw new Error("No results found")
    }

    // Process the results to match the desired format
    const processedResults = await Promise.all(
      response.data.words.map(async (wordData, index) => {
        // Extract basic word information
        const reading = wordData.reading || {}
        const word = reading.kanji || reading.kana || ""
        const hiragana = reading.kana || ""

        // Use the API's romaji if available, otherwise convert hiragana to romaji
        let romaji = reading.romaji || ""
        if (!romaji && hiragana) {
          romaji = await convertToRomaji(hiragana)
        } else if (!romaji) {
          romaji = "Romaji unavailable"
        }

        // Extract meaning
        const senses = wordData.senses || []
        const meanings = senses.map((sense) => {
          const glosses = sense.glosses || []
          return glosses.join("; ")
        })
        const meaning = meanings.join(". ")

        // Create a unique ID
        const id = `jotoba-${word}-${Date.now()}-${index}`

        // Get example sentences
        let sentence = ""
        let sentence_furigana = "" // Store furigana version of sentence if available
        let sentence_romaji = ""
        let sentence_translation = ""
        let additional_examples = []

        try {
          // Make a separate request to get example sentences
          const sentencesUrl = "https://jotoba.de/api/search/sentences"
          const sentenceResponse = await axios.post(
            sentencesUrl,
            {
              query: word,
              language: "English",
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          )

          if (sentenceResponse.data.sentences && sentenceResponse.data.sentences.length > 0) {
            // Get the first sentence as the main example
            const firstSentence = sentenceResponse.data.sentences[0]
            sentence = firstSentence.content || `${word}を使った例文です。`
            sentence_translation =
              firstSentence.translation || `This is an example sentence using ${meaning.split(";")[0]}.`

            // Use furigana if available, otherwise use the original sentence
            sentence_furigana = firstSentence.furigana || sentence

            // Convert to romaji
            sentence_romaji = await convertToRomaji(sentence_furigana)

            // Get additional examples (up to 2)
            if (sentenceResponse.data.sentences.length > 1) {
              additional_examples = await Promise.all(
                sentenceResponse.data.sentences.slice(1, 3).map(async (s) => {
                  const example_furigana = s.furigana || s.content
                  const example_romaji = await convertToRomaji(example_furigana)

                  return {
                    japanese: s.content,
                    furigana: example_furigana,
                    english: s.translation,
                    romaji: example_romaji,
                  }
                }),
              )
            }
          }
        } catch (error) {
          console.log("Error fetching sentences:", error)
          // Use placeholder if sentence fetch fails
          sentence = `${word}を使った例文です。`
          sentence_furigana = hiragana ? `${hiragana}を つかった れいぶん です。` : sentence
          sentence_romaji = await convertToRomaji(sentence_furigana)
          sentence_translation = `This is an example sentence using ${meaning.split(";")[0]}.`
        }

        // Get kanji information if the word contains kanji
        const kanjiInfo = []
        if (/[\u4E00-\u9FAF]/.test(word)) {
          try {
            const kanjiUrl = "https://jotoba.de/api/search/kanji"
            const kanjiChars = word.match(/[\u4E00-\u9FAF]/g) || []

            for (const kanjiChar of kanjiChars) {
              const kanjiResponse = await axios.post(
                kanjiUrl,
                {
                  query: kanjiChar,
                  language: "English",
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                },
              )

              if (kanjiResponse.data.kanji && kanjiResponse.data.kanji.length > 0) {
                kanjiInfo.push(kanjiResponse.data.kanji[0])
              }
            }
          } catch (error) {
            console.log("Error fetching kanji data:", error)
          }
        }

        // Format the result to match the desired structure
        return {
          id,
          word,
          kanji: word, // For compatibility with existing code
          meaning,
          romaji,
          hiragana,
          sentence,
          sentence_furigana,
          sentence_romaji,
          sentence_translation,
          additional_examples,
          // Additional metadata that might be useful
          common: wordData.common,
          audio: wordData.audio ? `https://jotoba.de${wordData.audio}` : null,
          jlpt: getJlptLevel(word, response.data.kanji),
          kanjiInfo,
          partOfSpeech: senses[0]?.pos?.join(", ") || "Unknown",
          tags: senses[0]?.tags || [],
          pitch: wordData.pitch || [],
        }
      }),
    )

    return {
      result: response.data, // Return the original API result for reference
      formattedResult: processedResults[0], // Return the first (most relevant) result
      allResults: processedResults, // Return all results for potential use
    }
  } catch (error) {
    console.error("Error fetching data from Jotoba API:", error)
    throw error
  }
}

// Add a new function to search for kanji by radical
export const searchKanjiByRadical = async (radicals: string[]) => {
  const url = "https://jotoba.de/api/radicals/find"

  try {
    const response = await axios.post(
      url,
      {
        radicals: radicals,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("Error searching kanji by radical:", error)
    throw error
  }
}

// Add a new function to get kanji details
export const getKanjiDetails = async (kanji: string) => {
  const url = "https://jotoba.de/api/search/kanji"

  try {
    const response = await axios.post(
      url,
      {
        query: kanji,
        language: "English",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.data.kanji || response.data.kanji.length === 0) {
      throw new Error("No kanji found")
    }

    return response.data.kanji[0]
  } catch (error) {
    console.error("Error getting kanji details:", error)
    throw error
  }
}

// Add a new function to search for sentences
export const searchSentences = async (query: string) => {
  const url = "https://jotoba.de/api/search/sentences"

  try {
    const response = await axios.post(
      url,
      {
        query: query,
        language: "English",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    return response.data.sentences || []
  } catch (error) {
    console.error("Error searching sentences:", error)
    throw error
  }
}

// Add a new function to get word completions
export const getWordCompletions = async (query: string) => {
  const url = "https://jotoba.de/api/complete"

  try {
    const response = await axios.post(
      url,
      {
        query: query,
        language: "English",
        no_english: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    return response.data || []
  } catch (error) {
    console.error("Error getting word completions:", error)
    throw error
  }
}

// Add a new function to get news from Jotoba
export const getJotobaNews = async () => {
  const url = "https://jotoba.de/api/news"

  try {
    const response = await axios.get(url)
    return response.data || []
  } catch (error) {
    console.error("Error getting Jotoba news:", error)
    throw error
  }
}

// Helper function to get JLPT level from kanji data
const getJlptLevel = (word, kanjiData) => {
  if (!kanjiData || kanjiData.length === 0) return null

  // Try to find matching kanji
  for (const kanji of word) {
    const matchingKanji = kanjiData.find((k) => k.literal === kanji)
    if (matchingKanji && matchingKanji.jlpt) {
      return matchingKanji.jlpt
    }
  }

  return null
}

// Helper function to check if a string contains Japanese characters
export const containsJapanese = (text: string) => {
  return /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(text)
}

// Utility function to convert between different Japanese scripts if needed
export const convertScript = (text: string, targetScript: "hiragana" | "katakana" | "romaji") => {
  // This would require a more complex implementation with a conversion library
  // For now, we'll return the original text
  return text
}

// Other utility functions from your original utils.ts file can remain here
