// Types for Jotoba API responses

export interface JotobaWordSearchResponse {
  words: JotobaWord[]
  kanji: any[] // We're not using kanji search results for now
  names: any[] // We're not using name search results for now
  sentences: any[] // We're not using sentence search results for now
}

export interface JotobaWord {
  common: boolean
  jlpt: string[] // JLPT levels like ["N5"]
  word: string // The word in kanji/kana
  reading: JotobaReading
  furigana: string
  pitch: any[] // Pitch accent information
  senses: JotobaSense[]
  audio?: string // URL to audio file if available
}

export interface JotobaReading {
  kanji?: string // The word in kanji if applicable
  kana: string // The word in kana (hiragana/katakana)
  romaji: string // Romanized version
}

export interface JotobaSense {
  glosses: string[] // Translations/meanings
  pos: string[] // Parts of speech
  language: string // Language of the glosses (e.g., "English")
  tags?: string[] // Additional tags like "formal", "colloquial", etc.
  dialect?: string[] // Dialect information if applicable
  field?: string[] // Field of usage like "medicine", "computing", etc.
  information?: string // Additional information
}

export interface JotobaSentenceSearchResponse {
  sentences: JotobaSentence[]
}

export interface JotobaSentence {
  content: string // The Japanese sentence
  translation: string // The translated sentence
  language: string // Language of the translation
  furigana?: string // Furigana reading if available
}
