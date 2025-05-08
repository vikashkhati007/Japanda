export interface Word {
    id: string
    reading: {
      kanji: string
      kana: string
      romaji: string
    }
    senses: Array<{
      glosses: string[]
    }>
    common: boolean
    jlpt?: string
    audio?: string
  }
  
  export interface LearningProgress {
    favorites?: string[]
    mastered?: string[]
    weakPoints?: string[]
  }