// Utility functions for working with kanji data

/**
 * Extracts kanji characters from a string
 * @param text The text to extract kanji from
 * @returns An array of kanji characters
 */
export const extractKanji = (text: string): string[] => {
    if (!text) return []
  
    // Regular expression to match kanji characters
    const kanjiRegex = /[\u4e00-\u9faf]/g
  
    // Find all matches
    const matches = text.match(kanjiRegex)
  
    // Return unique kanji characters
    return matches ? [...new Set(matches)] : []
  }
  
  /**
   * Fetches kanji data for a given kanji character
   * @param kanji The kanji character to fetch data for
   * @returns Promise resolving to kanji data
   */
  export const fetchKanjiData = async (kanji: string) => {
    try {
      // In a real app, this would be an API call
      // For now, we'll return mock data
      return {
        literal: kanji,
        meanings: ["meaning1", "meaning2", "meaning3"],
        grade: Math.floor(Math.random() * 5) + 1,
        stroke_count: Math.floor(Math.random() * 15) + 5,
        jlpt: Math.floor(Math.random() * 5) + 1,
        onyomi: ["オン", "ヨミ"],
        kunyomi: ["くん", "よみ"],
      }
    } catch (error) {
      console.error("Error fetching kanji data:", error)
      throw error
    }
  }
  
  /**
   * Gets the JLPT level name from a number
   * @param level JLPT level number (1-5)
   * @returns JLPT level name (N1-N5)
   */
  export const getJlptLevelName = (level: number): string => {
    if (level >= 1 && level <= 5) {
      return `N${level}`
    }
    return "Unknown"
  }
  
  /**
   * Gets the school grade name from a number
   * @param grade School grade number
   * @returns Grade name
   */
  export const getGradeName = (grade: number): string => {
    if (grade === 8) return "Secondary School"
    if (grade === 9) return "High School"
    if (grade === 10) return "University"
    if (grade >= 1 && grade <= 6) return `Elementary School Grade ${grade}`
    return "Unknown"
  }
  
  