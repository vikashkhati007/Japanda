import axios from "axios"

interface KanjiData {
  literal: string
  meanings: string[]
  grade?: number
  stroke_count?: number
  jlpt?: number
  onyomi?: string[]
  kunyomi?: string[]
  examples?: Array<{
    word: string
    reading: string
    meaning: string
  }>
}

/**
 * Fetches kanji data from the Jotoba API
 * @param kanjiChar The kanji character to fetch data for
 * @returns Promise resolving to kanji data
 */
export const fetchKanjiData = async (kanjiChar: string): Promise<KanjiData | null> => {
  if (!kanjiChar || !/[\u4e00-\u9faf]/.test(kanjiChar)) {
    return null
  }

  try {
    // Fetch kanji information
    const response = await axios.get(`https://jotoba.de/api/search/kanji?keyword=${encodeURIComponent(kanjiChar)}`)

    if (!response.data || !response.data.kanji || response.data.kanji.length === 0) {
      return null
    }

    const kanjiInfo = response.data.kanji[0]

    // Format the kanji data
    const formattedKanjiData: KanjiData = {
      literal: kanjiInfo.literal,
      meanings: kanjiInfo.meanings || [],
      grade: kanjiInfo.grade,
      stroke_count: kanjiInfo.stroke_count,
      jlpt: kanjiInfo.jlpt,
      onyomi: kanjiInfo.onyomi,
      kunyomi: kanjiInfo.kunyomi,
      examples: [],
    }

    // Try to get examples
    try {
      const examplesResponse = await axios.get(
        `https://jotoba.de/api/search/words?keyword=${encodeURIComponent(kanjiChar)}&language=English`,
      )

      if (examplesResponse.data && examplesResponse.data.words) {
        formattedKanjiData.examples = examplesResponse.data.words.slice(0, 3).map((word) => ({
          word: word.reading?.kanji || word.reading?.kana,
          reading: word.reading?.kana,
          meaning: word.senses?.[0]?.glosses?.join(", ") || "",
        }))
      }
    } catch (exampleError) {
      console.error("Error fetching kanji examples:", exampleError)
    }

    return formattedKanjiData
  } catch (error) {
    console.error("Error fetching kanji data:", error)
    return null
  }
}

/**
 * Creates mock kanji data when API fails
 * @param kanjiChar The kanji character
 * @param meaning The meaning to use for the mock data
 * @returns Mock kanji data
 */
export const createMockKanjiData = (kanjiChar: string, meaning: string): KanjiData => {
  return {
    literal: kanjiChar,
    meanings: meaning
      .split(/[,;]/)
      .map((m) => m.trim())
      .slice(0, 3),
    grade: Math.floor(Math.random() * 5) + 1,
    stroke_count: Math.floor(Math.random() * 15) + 5,
    jlpt: Math.floor(Math.random() * 5) + 1,
    onyomi: ["オン", "ヨミ"],
    kunyomi: ["くん", "よみ"],
    examples: [],
  }
}

