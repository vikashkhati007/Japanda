import axios from "axios"
import { JapaneseCode } from "./query"

// Japanese code query from the provided code
// export const JapaneseCode = `You are a Japanese language assistant. Respond with a JSON object containing:
// - word: the Japanese word or phrase
// - meaning: the English meaning
// - romaji: the romanized pronunciation
// - sentence: an example sentence using the word
// - additional_examples: an array of objects with 'japanese' and 'english' properties for more examples

// Only respond with valid JSON. For example:
// {
//   "word": "水",
//   "meaning": "water",
//   "romaji": "mizu",
//   "sentence": "水を飲みます。",
//   "additional_examples": [
//     {"japanese": "水がきれいです。", "english": "The water is clean."},
//     {"japanese": "水を飲みたいです。", "english": "I want to drink water."}
//   ]
// }`

export const searchWord = async (query:string) => {
  const options = {
    method: "POST",
    url: "https://chatgpt-gpt-3-5.p.rapidapi.com/ask",
    headers: {
      "x-rapidapi-key": "6eab60dbd1mshb3fc9aaa2e46d43p1858bajsncb1d0d099d75",
      "x-rapidapi-host": "chatgpt-gpt-3-5.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: { query: JapaneseCode + query },
  }

  try {
    const response = await axios.request(options)
    const parsedResponse = JSON.parse(response.data.response)
    
    // Format the result for the list view and detail view
    const formattedResult = {
      id: response.data.conversationId, // Use conversationId as a unique identifier
      kanji: parsedResponse.word,
      hiragana: "", // API doesn't provide hiragana separately
      romaji: parsedResponse.romaji,
      meaning: parsedResponse.meaning,
      tags: ["api"],
      sentence: parsedResponse.sentence,
      additional_examples: parsedResponse.additional_examples || [],
    }

    return { result: parsedResponse, formattedResult }
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error
  }
}