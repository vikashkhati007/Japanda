"use client"

import { useRef, useEffect, useState } from "react"
import { TouchableOpacity, Image, StyleSheet, Animated, View, Dimensions, Text } from "react-native"
import { colors } from "../styles/globalStyles"
import { CHARACTER_DATA, type CharacterType, getUserProfile } from "../lib/user-store"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Constants for timing and thresholds
const INTERACTION_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds
const LONG_ABSENCE_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const MESSAGE_DURATION = 6000 // 6 seconds
const MESSAGE_INTERVAL_MIN = 3 * 60 * 1000 // 3 minutes
const MESSAGE_INTERVAL_MAX = 8 * 60 * 1000 // 8 minutes
const EMOTION_TRANSITION_DURATION = 300 // 300ms for emotion transitions

// Define emotion types
type EmotionType = "happy" | "thinking" | "excited" | "angry" | "crying"

// Define message categories
type MessageCategory =
  | "welcome"
  | "reminder"
  | "longAbsence"
  | "tip"
  | "encouragement"
  | "question"
  | "progress"
  | "vocabulary"
  | "grammar"
  | "correction"
  | "achievement"
  | "challenge"

interface FloatingAssistantButtonProps {
  onPress: () => void
  theme: "light" | "dark"
  character: CharacterType
}

const { width } = Dimensions.get("window")

export default function FloatingAssistantButton({
  onPress,
  theme,
  character = "mira", // Default value
}: FloatingAssistantButtonProps) {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(0)).current
  const bubbleAnim = useRef(new Animated.Value(0)).current
  const emotionScaleAnim = useRef(new Animated.Value(1)).current

  // State variables
  const [showMessage, setShowMessage] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [emotion, setEmotion] = useState<EmotionType>("happy")
  const [isNewUser, setIsNewUser] = useState(false)
  const [userName, setUserName] = useState("")
  const [userLevel, setUserLevel] = useState(0)
  const [lastCategory, setLastCategory] = useState<MessageCategory | null>(null)
  const [consecutiveIgnores, setConsecutiveIgnores] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Refs for timeouts
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nextMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const emotionTransitionRef = useRef<NodeJS.Timeout | null>(null)
  const ignoreCounterRef = useRef<NodeJS.Timeout | null>(null)

  // Get character data
  const characterData = CHARACTER_DATA[character]

  // Message database - organized by character and category
  const messages = {
    mira: {
      welcome: [
        "こんにちは！一緒に日本語を勉強しましょう！ (Hello! Let's study Japanese together!)",
        "タップして会話を始めましょう！ (Tap to start a conversation!)",
        "日本語の質問がありますか？お手伝いします！ (Do you have any Japanese questions? I'll help!)",
        "はじめまして！ミラです。日本語を学びましょう！ (Nice to meet you! I'm Mira. Let's learn Japanese!)",
      ],
      reminder: [
        `${userName ? `${userName}、` : ""}久しぶり！また話しましょう！ (${userName ? `${userName}, ` : ""}It's been a while! Let's talk again!)`,
        "学習を続けましょう！ (Let's continue your learning!)",
        "日本語の練習をしませんか？ (Would you like to practice Japanese?)",
        "今日は何を学びたいですか？ (What would you like to learn today?)",
      ],
      longAbsence: [
        "おかえりなさい！お久しぶりです！ (Welcome back! It's been a long time!)",
        "また会えて嬉しいです！日本語を続けましょう！ (I'm glad to see you again! Let's continue with Japanese!)",
        "お久しぶりです！学習を再開しましょうか？ (It's been a while! Shall we resume your studies?)",
        "お待ちしておりました！また一緒に勉強しましょう！ (I've been waiting! Let's study together again!)",
      ],
      tip: [
        "日本語の勉強は毎日少しずつがコツですよ！ (The key to studying Japanese is a little bit every day!)",
        "単語を覚えるなら、文脈で使うのが効果的です！ (To memorize vocabulary, using it in context is effective!)",
        "発音を練習するなら、ネイティブの音声を聞きましょう！ (To practice pronunciation, listen to native speakers!)",
        "漢字は部首ごとに覚えると効率的ですよ！ (Learning kanji by radicals is efficient!)",
      ],
      encouragement: [
        "頑張っていますね！素晴らしいです！ (You're working hard! That's wonderful!)",
        "日本語の上達が見えますよ！ (I can see your Japanese improving!)",
        "その調子！毎日の努力が実を結びます！ (Keep it up! Daily effort will bear fruit!)",
        "あきらめないで！日本語は時間がかかりますが、価値があります！ (Don't give up! Japanese takes time, but it's worth it!)",
      ],
      question: [
        "今日は何を学びたいですか？ (What would you like to learn today?)",
        "どんな日本語の質問がありますか？ (What Japanese questions do you have?)",
        "特に難しいと感じる文法はありますか？ (Is there any grammar you find particularly difficult?)",
        "日本の文化について知りたいことはありますか？ (Is there anything about Japanese culture you'd like to know?)",
      ],
      progress: [
        "学習の進み具合はどうですか？ (How is your learning progress?)",
        "最近、新しい単語をいくつ覚えましたか？ (How many new words have you learned recently?)",
        "日本語で何か読んでみましたか？ (Have you tried reading anything in Japanese?)",
        "日本語の目標は何ですか？ (What are your Japanese language goals?)",
      ],
      vocabulary: [
        "今日の単語：「楽しい」(たのしい) - fun, enjoyable",
        "今日の単語：「頑張る」(がんばる) - to do one's best",
        "今日の単語：「綺麗」(きれい) - beautiful, clean",
        "今日の単語：「懐かしい」(なつかしい) - nostalgic",
      ],
      grammar: [
        "「〜てみる」は「try to do」という意味です！ (〜temiru means 'try to do'!)",
        "「〜ながら」で「while doing」を表現できます！ (You can express 'while doing' with 〜nagara!)",
        "「〜ばよかった」は「should have done」の意味です！ (〜ba yokatta means 'should have done'!)",
        "「〜ことがある」で経験を表現できます！ (You can express experiences with 〜koto ga aru!)",
      ],
      correction: [
        "その表現は少し違います。こう言ってみましょう... (That expression is a bit off. Let's try saying it this way...)",
        "いい質問です！正しくは... (Good question! The correct way is...)",
        "ほぼ正解です！少し修正すると... (Almost correct! With a small adjustment...)",
        "日本語では通常このように表現します... (In Japanese, we usually express it like this...)",
      ],
      achievement: [
        "素晴らしい進歩です！次のレベルに進みましょう！ (Wonderful progress! Let's move to the next level!)",
        "目標達成おめでとうございます！ (Congratulations on reaching your goal!)",
        "あなたの努力が実を結んでいますね！ (Your efforts are bearing fruit!)",
        "上達が目に見えて分かります！ (Your improvement is visible!)",
      ],
      challenge: [
        "新しいチャレンジに挑戦してみませんか？ (Would you like to try a new challenge?)",
        "この文章を日本語に訳してみましょうか？ (Shall we try translating this sentence to Japanese?)",
        "今日は少し難しい文法に挑戦してみましょう！ (Let's try some challenging grammar today!)",
        "この漢字の読み方が分かりますか？ (Do you know how to read this kanji?)",
      ],
      ignored: [
        "お手伝いが必要でしたら、いつでもどうぞ。 (If you need any help, please let me know anytime.)",
        "質問があればいつでも聞いてくださいね。 (Feel free to ask if you have any questions.)",
        "学習のサポートをいつでも提供できます。 (I'm available to support your learning anytime.)",
        "何かお手伝いできることがあれば、お知らせください。 (Please let me know if there's anything I can help with.)",
      ],
    },
    jun: {
      welcome: [
        "よう！日本語を練習しようぜ！ (Hey! Let's practice Japanese!)",
        "何か質問ある？タップしてみて！ (Got any questions? Try tapping!)",
        "一緒に日本語を勉強しよう！ (Let's study Japanese together!)",
        "やあ、ジュンだ。日本語を教えるよ！ (Hey, I'm Jun. I'll teach you Japanese!)",
      ],
      reminder: [
        `${userName ? `${userName}、` : ""}久しぶりだな！また話そうぜ！ (${userName ? `${userName}, ` : ""}It's been a while! Let's talk again!)`,
        "学習を続けようぜ！ (Let's continue your learning!)",
        "日本語の練習、続けようぜ！ (Let's keep practicing Japanese!)",
        "今日は何を学びたい？ (What do you want to learn today?)",
      ],
      longAbsence: [
        "おっ、戻ってきたな！久しぶりじゃないか！ (Oh, you're back! It's been a while!)",
        "また会えて良かった！続きをやろうぜ！ (Good to see you again! Let's continue!)",
        "久しぶりだな！学習を再開するか？ (It's been a while! Shall we resume your studies?)",
        "おかえり！また一緒に勉強しようぜ！ (Welcome back! Let's study together again!)",
      ],
      tip: [
        "日本語は毎日少しずつ勉強するのがコツだぞ！ (The trick to Japanese is studying a little every day!)",
        "単語は文の中で使うと覚えやすいぞ！ (Words are easier to remember when used in sentences!)",
        "発音を良くしたいなら、アニメを見るのもいいぞ！ (Watching anime is good for improving pronunciation!)",
        "漢字は似たようなものをグループにして覚えるといいぞ！ (It's good to memorize similar kanji in groups!)",
      ],
      encouragement: [
        "いいぞ、その調子だ！ (Good, keep it up!)",
        "上達してるな！このまま続けろ！ (You're improving! Keep going!)",
        "諦めるな！努力は必ず報われる！ (Don't give up! Your efforts will definitely pay off!)",
        "よくやってる！日本語はすぐには身につかないが、価値はある！ (You're doing well! Japanese doesn't come quickly, but it's worth it!)",
      ],
      question: [
        "今日は何を学びたい？ (What do you want to learn today?)",
        "何か質問あるか？ (Do you have any questions?)",
        "どの文法が難しいと感じてる？ (Which grammar do you find difficult?)",
        "日本の何について知りたい？ (What do you want to know about Japan?)",
      ],
      progress: [
        "勉強の調子はどうだ？ (How's your studying going?)",
        "最近、新しい言葉をいくつ覚えた？ (How many new words have you learned recently?)",
        "日本語で何か読んでみたか？ (Have you tried reading anything in Japanese?)",
        "日本語の目標は何だ？ (What are your Japanese language goals?)",
      ],
      vocabulary: [
        "今日の単語：「かっこいい」- cool, stylish",
        "今日の単語：「本気」(ほんき) - serious, earnest",
        "今日の単語：「すごい」- amazing, incredible",
        "今日の単語：「懐かしい」(なつかしい) - nostalgic",
      ],
      grammar: [
        "「〜てみる」は「try to do」って意味だぞ！ (〜temiru means 'try to do'!)",
        "「〜ながら」は「while doing」を表すんだ！ (〜nagara expresses 'while doing'!)",
        "「〜ばよかった」は「should have done」の意味だ！ (〜ba yokatta means 'should have done'!)",
        "「〜ことがある」で経験を表現できるぞ！ (You can express experiences with 〜koto ga aru!)",
      ],
      correction: [
        "その言い方は少し違うな。こう言ってみろ... (That saying is a bit off. Try saying it this way...)",
        "いい質問だ！正しくは... (Good question! The correct way is...)",
        "ほぼ合ってる！少し直すと... (Almost right! With a small fix...)",
        "日本語では普通こう言うんだ... (In Japanese, we usually say it like this...)",
      ],
      achievement: [
        "すごい進歩だな！次のレベルに行こうぜ！ (Great progress! Let's go to the next level!)",
        "目標達成おめでとう！ (Congratulations on reaching your goal!)",
        "努力が実を結んでるな！ (Your efforts are paying off!)",
        "上達してるのが分かるぞ！ (I can see you're improving!)",
      ],
      challenge: [
        "新しいチャレンジに挑戦してみるか？ (Want to try a new challenge?)",
        "この文を日本語に訳してみるか？ (Want to try translating this sentence to Japanese?)",
        "今日は少し難しい文法に挑戦してみようぜ！ (Let's try some challenging grammar today!)",
        "この漢字の読み方、分かるか？ (Do you know how to read this kanji?)",
      ],
      ignored: [
        "何か手伝えることがあれば言ってくれよ。 (Let me know if there's anything I can help with.)",
        "質問があればいつでも聞いてくれ。 (Feel free to ask if you have any questions.)",
        "学習のサポートはいつでもするぞ。 (I'm here to support your learning anytime.)",
        "何か必要なことがあれば教えてくれ。 (Tell me if you need anything.)",
      ],
    },
  }

  // Load user data and interaction history
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile()
        setUserName(profile.name || "")

        // Simulate user level based on profile data
        // In a real app, this would come from actual user progress
        setUserLevel(Math.floor(Math.random() * 5) + 1)

        // Check if this is a new user
        const lastInteraction = await AsyncStorage.getItem("lastAssistantInteraction")
        if (!lastInteraction) {
          setIsNewUser(true)
          // Show welcome message after a short delay for new users
          setTimeout(() => {
            showMessageWithEmotion("welcome", "excited")
          }, 2000)
        } else {
          // Check when was the last interaction
          const lastTime = Number.parseInt(lastInteraction, 10)
          const now = Date.now()

          if (now - lastTime > LONG_ABSENCE_THRESHOLD) {
            // It's been a very long time, show a special welcome back message
            setTimeout(() => {
              showMessageWithEmotion("longAbsence", "excited")
            }, 2000)
          } else if (now - lastTime > INTERACTION_THRESHOLD) {
            // It's been a while, show a reminder message
            setTimeout(() => {
              showMessageWithEmotion("reminder", "thinking")
            }, 3000)
          } else {
            // Schedule next message after a random interval
            scheduleNextMessage()
          }
        }

        // Load consecutive ignores count
        const ignores = await AsyncStorage.getItem("consecutiveIgnores")
        if (ignores) {
          setConsecutiveIgnores(Number.parseInt(ignores, 10))
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Default to showing a generic message after a delay
        setTimeout(() => {
          showMessageWithEmotion("welcome", "happy")
        }, 5000)
      }
    }

    loadUserData()

    // Clean up timeouts when component unmounts
    return () => {
      clearAllTimeouts()
    }
  }, [character])

  // Animation effects
  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Subtle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Occasional wiggle animation
    const startWiggle = () => {
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: -0.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -0.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Schedule next wiggle after random delay
        setTimeout(startWiggle, Math.random() * 10000 + 5000)
      })
    }

    // Start first wiggle after a delay
    const timeout = setTimeout(startWiggle, 3000)

    // Start emotion changes
    scheduleEmotionChange()

    return () => clearTimeout(timeout)
  }, [])

  // Ensure component updates when character changes
  useEffect(() => {
    // This empty useEffect with character as dependency
    // ensures the component re-renders when character changes
  }, [character])

  // Clear all timeouts to prevent memory leaks
  const clearAllTimeouts = () => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    if (nextMessageTimeoutRef.current) {
      clearTimeout(nextMessageTimeoutRef.current)
    }
    if (emotionTransitionRef.current) {
      clearTimeout(emotionTransitionRef.current)
    }
    if (ignoreCounterRef.current) {
      clearTimeout(ignoreCounterRef.current)
    }
  }

  // Transition between emotions with animation
  const transitionToEmotion = (newEmotion: EmotionType) => {
    // Only animate if changing to a different emotion
    if (emotion !== newEmotion) {
      // Scale down
      Animated.timing(emotionScaleAnim, {
        toValue: 0.8,
        duration: EMOTION_TRANSITION_DURATION / 2,
        useNativeDriver: true,
      }).start(() => {
        // Change emotion
        setEmotion(newEmotion)

        // Scale back up
        Animated.timing(emotionScaleAnim, {
          toValue: 1,
          duration: EMOTION_TRANSITION_DURATION / 2,
          useNativeDriver: true,
        }).start()
      })
    }
  }

  // Show message with appropriate emotion
  const showMessageWithEmotion = (category: MessageCategory, newEmotion: EmotionType = "happy") => {
    // Get messages for this character and category
    const messageList = messages[character][category] || messages[character].welcome

    // Don't repeat the last category unless we have to
    let selectedCategory = category
    if (category === lastCategory && Math.random() > 0.3) {
      // Pick a different category
      const categories: MessageCategory[] = [
        "tip",
        "encouragement",
        "question",
        "progress",
        "vocabulary",
        "grammar",
        "achievement",
        "challenge",
      ]
      selectedCategory = categories[Math.floor(Math.random() * categories.length)]
    }

    // Get messages for the selected category
    const selectedMessages = messages[character][selectedCategory] || messageList

    // Pick a random message
    const randomMessage = selectedMessages[Math.floor(Math.random() * selectedMessages.length)]

    // Update state
    setCurrentMessage(randomMessage)
    setShowMessage(true)
    setLastCategory(selectedCategory)

    // For ignored messages, use a more professional emotion
    if (category === "ignored") {
      // Use a mix of emotions for ignored messages to seem more natural
      const ignoredEmotions: EmotionType[] = ["thinking", "happy"]
      newEmotion = ignoredEmotions[Math.floor(Math.random() * ignoredEmotions.length)]
    }

    // Map categories to appropriate emotions more dynamically
    if (category === "welcome" || category === "longAbsence") {
      // Excited or happy for greetings
      newEmotion = Math.random() > 0.6 ? "excited" : "happy"
    } else if (category === "achievement") {
      // Always excited for achievements
      newEmotion = "excited"
    } else if (category === "correction") {
      // Thinking for corrections
      newEmotion = "thinking"
    } else if (category === "reminder" && consecutiveIgnores > 2) {
      // Show slight sadness if being ignored repeatedly
      newEmotion = Math.random() > 0.7 ? "crying" : "thinking"
    }

    // Add occasional random emotions to make the assistant feel more alive
    if (Math.random() > 0.9 && category !== "ignored") {
      const randomEmotions: EmotionType[] = ["happy", "thinking", "excited"]
      newEmotion = randomEmotions[Math.floor(Math.random() * randomEmotions.length)]
    }

    // Transition to the new emotion
    transitionToEmotion(newEmotion)

    // Animate the bubble
    Animated.sequence([
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(MESSAGE_DURATION - 600),
      Animated.timing(bubbleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    // Hide message after duration
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }

    messageTimeoutRef.current = setTimeout(() => {
      setShowMessage(false)

      // If this was an ignored message, increment the counter
      if (category === "ignored") {
        incrementIgnoreCounter()
      }

      // Return to happy after a delay
      emotionTransitionRef.current = setTimeout(() => {
        transitionToEmotion("happy")
      }, 1000)
    }, MESSAGE_DURATION)

    // Schedule next message
    scheduleNextMessage()
  }

  // Schedule the next message
  const scheduleNextMessage = () => {
    if (nextMessageTimeoutRef.current) {
      clearTimeout(nextMessageTimeoutRef.current)
    }

    // Random interval between min and max
    const nextInterval = Math.floor(
      Math.random() * (MESSAGE_INTERVAL_MAX - MESSAGE_INTERVAL_MIN) + MESSAGE_INTERVAL_MIN,
    )

    nextMessageTimeoutRef.current = setTimeout(() => {
      // If user has been ignoring us, show an ignored message
      if (consecutiveIgnores >= 3) {
        showMessageWithEmotion("ignored", "thinking")
      } else {
        showRandomMessage()
      }
    }, nextInterval)
  }

  // Occasionally change emotions even without messages to seem more alive
  const scheduleEmotionChange = () => {
    // Random interval between 8-20 seconds
    const nextInterval = Math.floor(Math.random() * 12000) + 8000

    setTimeout(() => {
      // Only change emotions if not speaking and no message is showing
      if (!showMessage && !isSpeaking) {
        // 30% chance to change emotion
        if (Math.random() > 0.7) {
          const randomEmotions: EmotionType[] = ["happy", "thinking"]
          // Rarely show excited (10% of the time)
          if (Math.random() > 0.9) {
            randomEmotions.push("excited")
          }

          const newEmotion = randomEmotions[Math.floor(Math.random() * randomEmotions.length)]
          if (newEmotion !== emotion) {
            transitionToEmotion(newEmotion)
          }
        }
      }

      // Schedule next emotion change
      scheduleEmotionChange()
    }, nextInterval)
  }

  // Show a random message from various categories
  const showRandomMessage = () => {
    // Categories with weights (higher number = more likely)
    const weightedCategories: [MessageCategory, number][] = [
      ["tip", 3],
      ["encouragement", 2],
      ["question", 2],
      ["progress", 2],
      ["vocabulary", 4],
      ["grammar", 3],
      ["achievement", 1],
      ["challenge", 1],
    ]

    // Calculate total weight
    const totalWeight = weightedCategories.reduce((sum, [_, weight]) => sum + weight, 0)

    // Pick a random number between 0 and totalWeight
    let random = Math.random() * totalWeight

    // Find the category that corresponds to this random number
    let selectedCategory: MessageCategory = "tip"
    for (const [category, weight] of weightedCategories) {
      random -= weight
      if (random <= 0) {
        selectedCategory = category
        break
      }
    }

    // Determine emotion based on category - more professional mapping
    let emotion: EmotionType = "happy"

    switch (selectedCategory) {
      case "encouragement":
      case "achievement":
        emotion = Math.random() > 0.7 ? "excited" : "happy"
        break
      case "question":
      case "grammar":
      case "tip":
        emotion = Math.random() > 0.6 ? "thinking" : "happy"
        break
      case "challenge":
        emotion = Math.random() > 0.8 ? "thinking" : "happy"
        break
      case "correction":
        emotion = "thinking"
        break
      case "longAbsence":
        emotion = Math.random() > 0.7 ? "excited" : "happy"
        break
      default:
        emotion = "happy"
    }

    // Show the message
    showMessageWithEmotion(selectedCategory, emotion)
  }

  // Increment the ignore counter
  const incrementIgnoreCounter = async () => {
    // Only increment up to a reasonable limit (5)
    const newCount = Math.min(consecutiveIgnores + 1, 5)
    setConsecutiveIgnores(newCount)

    try {
      await AsyncStorage.setItem("consecutiveIgnores", newCount.toString())
    } catch (error) {
      console.error("Error saving ignore counter:", error)
    }
  }

  // Reset the ignore counter
  const resetIgnoreCounter = async () => {
    setConsecutiveIgnores(0)

    try {
      await AsyncStorage.setItem("consecutiveIgnores", "0")
    } catch (error) {
      console.error("Error resetting ignore counter:", error)
    }
  }

  // Handle button press
  const handlePress = async () => {
    // Update last interaction time
    try {
      await AsyncStorage.setItem("lastAssistantInteraction", Date.now().toString())

      // Reset ignore counter when user interacts
      resetIgnoreCounter()
    } catch (error) {
      console.error("Error saving interaction time:", error)
    }

    // Clear any scheduled messages
    clearAllTimeouts()

    // Hide message bubble
    setShowMessage(false)

    // Call the original onPress handler
    onPress()
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-30deg", "30deg"],
  })

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        {
          transform: [{ scale: pulseAnim }, { rotate }, { translateY: bounceAnim }],
        },
      ]}
    >
      {/* Message Bubble */}
      {showMessage && (
        <Animated.View
          style={[
            styles.messageBubble,
            theme === "dark" && styles.messageBubbleDark,
            {
              opacity: bubbleAnim,
              transform: [
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.messageText, theme === "dark" && styles.messageTextDark]}>{currentMessage}</Text>
          <View style={[styles.bubbleTail, theme === "dark" && styles.bubbleTailDark]} />
        </Animated.View>
      )}

      {/* Assistant Button */}
      <TouchableOpacity
        style={[
          styles.button,
          theme === "dark" && styles.buttonDark,
          { backgroundColor: characterData.themeColors.primary },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonInner}>
          <Animated.View style={{ transform: [{ scale: emotionScaleAnim }] }}>
            <Image source={characterData.images[emotion]} style={styles.image} />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Update the styles to include new components
const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    bottom: 80,
    right: 20,
    alignItems: "flex-end",
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: "hidden",
  },
  buttonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.9)",
    overflow: "hidden",
  },
  buttonDark: {
    shadowColor: "rgba(0, 0, 0, 0.5)",
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  indicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  messageBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    maxWidth: 220,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  messageBubbleDark: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    borderColor: "rgba(60, 60, 60, 0.8)",
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextDark: {
    color: colors.darkText,
  },
  bubbleTail: {
    position: "absolute",
    bottom: -8,
    right: 20,
    width: 16,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    transform: [{ rotate: "45deg" }],
  },
  bubbleTailDark: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
  },
})
