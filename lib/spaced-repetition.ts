// Spaced repetition algorithm based on SuperMemo-2
// https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

export interface ReviewItem {
    id: string
    easinessFactor: number // Initial value: 2.5
    interval: number // In days, initial value: 0
    repetitions: number // Initial value: 0
    dueDate: number // Timestamp
    lastReviewed: number // Timestamp
  }
  
  export enum ReviewGrade {
    AGAIN = 0, // Complete blackout, wrong answer
    HARD = 1, // Correct answer, but with much difficulty
    GOOD = 2, // Correct answer, with some difficulty
    EASY = 3, // Correct answer, perfect recall
  }
  
  // Initialize a new review item
  export function initializeReviewItem(id: string): ReviewItem {
    const now = Date.now()
    return {
      id,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: now,
      lastReviewed: now,
    }
  }
  
  // Calculate the next review date based on the user's grade
  export function calculateNextReview(item: ReviewItem, grade: ReviewGrade): ReviewItem {
    const now = Date.now()
  
    // Clone the item to avoid mutating the original
    const updatedItem: ReviewItem = { ...item }
  
    // Update easiness factor
    // Formula: EF := EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    const gradeFactor = Math.max(0, Math.min(3, grade)) // Ensure grade is between 0-3
    const newEF = item.easinessFactor + (0.1 - (3 - gradeFactor) * (0.08 + (3 - gradeFactor) * 0.02))
    updatedItem.easinessFactor = Math.max(1.3, newEF) // EF should not be less than 1.3
  
    // Update interval and repetitions
    if (gradeFactor < ReviewGrade.GOOD) {
      // If the answer was incorrect or very difficult, reset repetitions
      updatedItem.repetitions = 0
      updatedItem.interval = 1 // Review again in 1 day
    } else {
      // If the answer was correct
      updatedItem.repetitions += 1
  
      if (updatedItem.repetitions === 1) {
        updatedItem.interval = 1 // First correct answer: 1 day
      } else if (updatedItem.repetitions === 2) {
        updatedItem.interval = 6 // Second correct answer: 6 days
      } else {
        // For subsequent correct answers, use the formula: interval = interval * EF
        updatedItem.interval = Math.round(updatedItem.interval * updatedItem.easinessFactor)
      }
    }
  
    // Calculate the next due date
    const nextDueDate = now + updatedItem.interval * 24 * 60 * 60 * 1000 // Convert days to milliseconds
    updatedItem.dueDate = nextDueDate
    updatedItem.lastReviewed = now
  
    return updatedItem
  }
  
  // Check if an item is due for review
  export function isDue(item: ReviewItem): boolean {
    return Date.now() >= item.dueDate
  }
  
  // Get all items that are due for review
  export function getDueItems(items: ReviewItem[]): ReviewItem[] {
    return items.filter(isDue)
  }
  
  // Sort items by due date (earliest first)
  export function sortByDueDate(items: ReviewItem[]): ReviewItem[] {
    return [...items].sort((a, b) => a.dueDate - b.dueDate)
  }
  
  // Calculate study statistics
  export function calculateStats(items: ReviewItem[]) {
    const now = Date.now()
    const dueItems = items.filter((item) => item.dueDate <= now)
    const dueToday = dueItems.length
  
    // Calculate items due in the next 7 days
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000
    const dueThisWeek = items.filter((item) => item.dueDate <= oneWeekFromNow).length
  
    // Calculate average easiness factor
    const totalEF = items.reduce((sum, item) => sum + item.easinessFactor, 0)
    const averageEF = items.length > 0 ? totalEF / items.length : 0
  
    // Calculate retention rate (percentage of items with repetitions > 0)
    const learnedItems = items.filter((item) => item.repetitions > 0).length
    const retentionRate = items.length > 0 ? (learnedItems / items.length) * 100 : 0
  
    return {
      totalItems: items.length,
      dueToday,
      dueThisWeek,
      averageEF,
      retentionRate,
    }
  }
  