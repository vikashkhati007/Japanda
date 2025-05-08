"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Animated } from "react-native"
import { WebView } from "react-native-webview"
import { ArrowLeft, ChevronDown } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { colors } from "../../styles/globalStyles"

interface LiveScreenProps {
  theme: string
  onClose: () => void
}

interface CityData {
  name: string
  url: string
}

// Timestamp storage key prefix
const TIMESTAMP_KEY_PREFIX = "japan_live_timestamp_"

export default function LiveScreen({ theme, onClose }: LiveScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [showQualityDropdown, setShowQualityDropdown] = useState(false)
  // Update the quality options array to include 1440p
  const qualityOptions = ["Auto", "4K", "1440p", "1080p", "720p"]
  // Change the initial quality state to default to a higher resolution
  const [currentQuality, setCurrentQuality] = useState<string>("1080p")
  const screenHeight = Dimensions.get("window").height
  const screenWidth = Dimensions.get("window").width
  const webViewRef = useRef<WebView>(null)
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0)

  // Add animation values for loading bar
  const loadingProgress = useRef(new Animated.Value(0)).current
  const loadingOpacity = useRef(new Animated.Value(1)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  // Define available cities
  const cities: CityData[] = [
    { name: "Tokyo Japan", url: "https://citywalks.live/city/japan-tokyo/" },
    { name: "Kobe Japan", url: "https://citywalks.live/city/japan-kobe/" },
    { name: "Kyoto Japan", url: "https://citywalks.live/city/japan-kyoto/" },
    { name: "Osaka Japan", url: "https://citywalks.live/city/japan-osaka/" },
    { name: "Sapporo Japan", url: "https://citywalks.live/city/japan-sapporo/" },
  ]

  // State to track the currently selected city
  const [selectedCity, setSelectedCity] = useState<CityData>(cities[0])

  // Load saved timestamp when component mounts or city changes
  useEffect(() => {
    const loadSavedTimestamp = async () => {
      try {
        const key = `${TIMESTAMP_KEY_PREFIX}${selectedCity.name}`
        const savedTimestamp = await AsyncStorage.getItem(key)
        if (savedTimestamp) {
          setCurrentTimestamp(Number.parseInt(savedTimestamp, 10))
          console.log(`Loaded timestamp for ${selectedCity.name}: ${savedTimestamp}s`)
        } else {
          setCurrentTimestamp(0)
        }
      } catch (error) {
        console.error("Error loading timestamp:", error)
      }
    }

    loadSavedTimestamp()
  }, [selectedCity.name])

  // Save timestamp when component unmounts or city changes
  useEffect(() => {
    return () => {
      saveCurrentTimestamp()
    }
  }, [currentTimestamp, selectedCity.name])

  // Save the current timestamp to AsyncStorage
  const saveCurrentTimestamp = async () => {
    if (currentTimestamp > 0) {
      try {
        const key = `${TIMESTAMP_KEY_PREFIX}${selectedCity.name}`
        await AsyncStorage.setItem(key, currentTimestamp.toString())
        console.log(`Saved timestamp for ${selectedCity.name}: ${currentTimestamp}s`)
      } catch (error) {
        console.error("Error saving timestamp:", error)
      }
    }
  }

  // Start loading animations
  useEffect(() => {
    if (isLoading) {
      // Reset progress
      loadingProgress.setValue(0)

      // Animate progress bar
      Animated.timing(loadingProgress, {
        toValue: 100,
        duration: 8000, // 8 seconds to simulate loading
        useNativeDriver: false,
      }).start()

      // Start pulse animation
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
    } else {
      // Fade out loading screen
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }
  }, [isLoading])

  // Auto-close quality dropdown after selection
  useEffect(() => {
    if (showQualityDropdown) {
      const timer = setTimeout(() => {
        setShowQualityDropdown(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showQualityDropdown])

  // Function to handle city selection
  const handleCitySelect = (city: CityData) => {
    // Save current timestamp before changing city
    saveCurrentTimestamp()

    setSelectedCity(city)
    setShowCityDropdown(false)
    setIsLoading(true) // Show loading indicator when changing cities

    // Reset animations
    loadingOpacity.setValue(1)
  }

  // Function to handle quality selection
  const handleQualitySelect = (quality: string) => {
    setCurrentQuality(quality)
    setShowQualityDropdown(false)

    // Send message to WebView to change quality
    webViewRef.current?.injectJavaScript(`
      (function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage("set-quality:${quality}");
        }
        true;
      })();
    `)
  }

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    const msg = event.nativeEvent.data
    console.log("🧠 Message received:", msg)

    if (msg === "loading-done") {
      setIsLoading(false)
    }

    if (msg === "night-toggle-clicked") {
      console.log("🌙 Night mode toggled")
    }

    if (msg === "sound-toggle-clicked") {
      console.log("🔊 Sound toggled")
    }

    if (msg === "quality-toggle-clicked") {
      setShowQualityDropdown(!showQualityDropdown)
    }

    // Handle timestamp updates from the WebView
    if (msg.startsWith("current-time:")) {
      const time = Number.parseInt(msg.split(":")[1], 10)
      if (!isNaN(time) && time > 0) {
        setCurrentTimestamp(time)
      }
    }

    // Add a handler for quality fallback messages in the handleWebViewMessage function
    if (msg.startsWith("quality-fallback:")) {
      const fallbackQuality = msg.split(":")[1]
      setCurrentQuality(fallbackQuality)
      console.log("🎥 Quality fallback to:", fallbackQuality)
    }
  }

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      {/* WebView takes up the entire screen */}
      <View style={[styles.webViewContainer, { width: screenWidth, height: screenHeight }]}>
        {/* Enhanced loading screen with animation */}
        {isLoading && (
          <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
            <LinearGradient
              colors={["rgb(0,0,0)", "rgb(0,0,0)", "rgb(0,0,0)"]}
              style={styles.loadingGradient}
            >
              <Animated.Image
                source={{ uri: "/placeholder.svg?height=80&width=80" }}
                style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}
              />

              <Text style={styles.loadingText}>Connecting to {selectedCity.name}</Text>

              <View style={styles.loadingBarContainer}>
                <Animated.View
                  style={[
                    styles.loadingBar,
                    {
                      width: loadingProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>

              <Text style={styles.loadingSubtext}>
                {currentTimestamp > 0
                  ? `Resuming from ${Math.floor(currentTimestamp / 60)}:${(currentTimestamp % 60).toString().padStart(2, "0")}...`
                  : "Preparing your immersive Japan experience..."}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Floating header overlay */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              saveCurrentTimestamp()
              onClose()
            }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.citySelector} onPress={() => setShowCityDropdown(!showCityDropdown)}>
            <Text style={styles.headerText}>{selectedCity.name}</Text>
            <ChevronDown size={20} color="#FFFFFF" style={styles.dropdownIcon} />
          </TouchableOpacity>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* City dropdown menu */}
        {showCityDropdown && (
          <View style={styles.dropdownContainer}>
            {cities.map((city, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dropdownItem, selectedCity.name === city.name && styles.dropdownItemSelected]}
                onPress={() => handleCitySelect(city)}
              >
                <Text
                  style={[styles.dropdownItemText, selectedCity.name === city.name && styles.dropdownItemTextSelected]}
                >
                  {city.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quality dropdown menu */}
        {showQualityDropdown && (
          <View style={styles.qualityDropdownContainer}>
            <Text style={styles.qualityDropdownTitle}>Video Quality</Text>
            {qualityOptions.map((quality, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dropdownItem, currentQuality === quality && styles.dropdownItemSelected]}
                onPress={() => handleQualitySelect(quality)}
              >
                <Text style={[styles.dropdownItemText, currentQuality === quality && styles.dropdownItemTextSelected]}>
                  {quality}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Removed the quality indicator that was blocking the view */}

        <WebView
          ref={webViewRef}
          source={{ uri: selectedCity.url }}
          style={styles.webView}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          onMessage={handleWebViewMessage}
          injectedJavaScript={`(function() {
          // Debug logging function
          const logDebug = (message) => {
            console.log("Debug:", message);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage("debug: " + message);
            }
          };
          
          // Track button states
          const buttonStates = {
            sound: true, // true = sound on, false = sound off
            mode: false,  // false = day mode, true = night mode
            quality: "Auto" // Auto, High, Medium, Low
          };
          
          // Track video state
          const videoState = {
            currentTime: 0,
            duration: 0,
            isPlaying: false,
            videoElement: null
          };
          
          // Initial timestamp to seek to (will be set from React Native)
          const initialTimestamp = ${currentTimestamp};
          let hasSetInitialTimestamp = false;
          
          // Utility function to safely toggle checkboxes and return the new state
          const safeToggleCheckbox = (id) => {
            try {
              const checkbox = document.getElementById(id);
              if (checkbox) {
                // Get current state before toggling
                const currentState = checkbox.checked;
                
                // Toggle the checkbox
                checkbox.checked = !currentState;
                
                // Dispatch change event
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
                
                // Return the new state (opposite of current)
                return !currentState;
              }
              return null;
            } catch (e) {
              logDebug("Error toggling checkbox: " + e.message);
              return null;
            }
          };
          
          // Create floating control button
          const createControlButton = (id, position, initialEmoji, clickHandler) => {
            try {
              // Check if button already exists
              const existing = document.getElementById(id);
              if (existing) return existing;
              
              // Create new button - UPDATED FOR SMALLER SIZE
              const button = document.createElement("button");
              button.id = id;
              Object.assign(button.style, {
                position: "fixed",
                right: "12px", // Moved closer to edge
                bottom: position + "px",
                zIndex: "9999",
                width: "40px", // Reduced from 56px
                height: "40px", // Reduced from 56px
                borderRadius: "20px", // Adjusted for smaller size
                background: "rgba(0, 0, 0, 0.4)", // More transparent
                color: "white",
                border: "none",
                fontSize: "20px", // Smaller font size
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Subtler shadow
                cursor: "pointer",
                transition: "all 0.3s ease",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                opacity: "0.7", // Start with lower opacity
              });
              button.innerHTML = initialEmoji;
              
              // Add hover/active effects
              button.addEventListener('mouseover', () => {
                button.style.transform = "scale(1.1)";
                button.style.background = "rgba(0, 0, 0, 0.7)";
                button.style.opacity = "1";
              });
              button.addEventListener('mouseout', () => {
                button.style.transform = "scale(1)";
                button.style.background = "rgba(0, 0, 0, 0.4)";
                button.style.opacity = "0.7";
              });
              button.addEventListener('click', clickHandler);
              
              document.body.appendChild(button);
              
              // Auto-hide buttons after 3 seconds of inactivity
              let fadeTimeout;
              const fadeButtons = () => {
                button.style.opacity = "0.3";
              };
              
              // Show buttons on any mouse movement or touch
              document.addEventListener('mousemove', () => {
                button.style.opacity = "0.7";
                clearTimeout(fadeTimeout);
                fadeTimeout = setTimeout(fadeButtons, 3000);
              });
              
              document.addEventListener('touchstart', () => {
                button.style.opacity = "0.7";
                clearTimeout(fadeTimeout);
                fadeTimeout = setTimeout(fadeButtons, 3000);
              });
              
              // Initial fade after 3 seconds
              fadeTimeout = setTimeout(fadeButtons, 3000);
              
              return button;
            } catch (e) {
              logDebug("Error creating button: " + e.message);
              return null;
            }
          };
          
          // Sound control functionality
          const setupSoundControl = () => {
            try {
              // First check if the sound checkbox exists and get its initial state
              const soundCheckbox = document.getElementById("citySoundsToggle");
              if (soundCheckbox) {
                buttonStates.sound = soundCheckbox.checked;
              }
              
              const initialEmoji = buttonStates.sound ? "🔊" : "🔇";
              
              const soundButton = createControlButton(
                "sound-toggle-btn",
                "180", // Moved up to make room for quality button
                initialEmoji,
                () => {
                  try {
                    // Toggle the checkbox and get the new state
                    const newState = safeToggleCheckbox("citySoundsToggle");
                    
                    // If we got a valid state back, update our tracking and the button
                    if (newState !== null) {
                      buttonStates.sound = newState;
                      
                      // Update button icon based on new state
                      const button = document.getElementById("sound-toggle-btn");
                      if (button) {
                        button.innerHTML = newState ? "🔊" : "🔇";
                        logDebug("Sound button updated to: " + (newState ? "on" : "off"));
                      }
                      
                      // Notify React Native
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage("sound-toggle-clicked");
                      }
                    }
                  } catch (e) {
                    logDebug("Error in sound button click handler: " + e.message);
                  }
                }
              );
              
              return soundButton;
            } catch (e) {
              logDebug("Error setting up sound control: " + e.message);
              return null;
            }
          };
          
          // Day/Night control functionality
          const setupDayNightControl = () => {
            try {
              // First check if the mode checkbox exists and get its initial state
              const modeCheckbox = document.getElementById("dayNightToggle");
              if (modeCheckbox) {
                buttonStates.mode = modeCheckbox.checked;
              }
              
              const initialEmoji = buttonStates.mode ? "🌙" : "☀️";
              
              const dayNightButton = createControlButton(
                "day-night-toggle-btn",
                "230", // Moved up to make room for quality button
                initialEmoji,
                () => {
                  try {
                    // Toggle the checkbox and get the new state
                    const newState = safeToggleCheckbox("dayNightToggle");
                    
                    // If we got a valid state back, update our tracking and the button
                    if (newState !== null) {
                      buttonStates.mode = newState;
                      
                      // Update button icon based on new state
                      const button = document.getElementById("day-night-toggle-btn");
                      if (button) {
                        button.innerHTML = newState ? "🌙" : "☀️";
                        logDebug("Mode button updated to: " + (newState ? "night" : "day"));
                      }
                      
                      // Notify React Native
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage("night-toggle-clicked");
                      }
                    }
                  } catch (e) {
                    logDebug("Error in mode button click handler: " + e.message);
                  }
                }
              );
              
              return dayNightButton;
            } catch (e) {
              logDebug("Error setting up day/night control: " + e.message);
              return null;
            }
          };
          
          // Quality control functionality
          const setupQualityControl = () => {
            try {
              const qualities = [
                { label: "Auto", value: "Auto", emoji: "🔄" },
                { label: "4K UHD", value: "4K", emoji: "🌟" },
                { label: "1440p", value: "1440p", emoji: "✨" },
                { label: "1080p", value: "1080p", emoji: "🔆" },
                { label: "720p", value: "720p", emoji: "🔅" }
              ];
              
              const qualityButton = createControlButton(
                "quality-toggle-btn",
                "130", // Position below sound button
                "🎥", // Video camera emoji
                () => {
                  try {
                    // Notify React Native to show quality dropdown
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage("quality-toggle-clicked");
                    }
                  } catch (e) {
                    logDebug("Error in quality button click handler: " + e.message);
                  }
                }
              );
              
              return qualityButton;
            } catch (e) {
              logDebug("Error setting up quality control: " + e.message);
              return null;
            }
          };
          
          // Function to set video quality
          const setVideoQuality = (quality) => {
            try {
              logDebug("Setting video quality to: " + quality);
              buttonStates.quality = quality;
              
              // Find quality selector in the video player
              // This is site-specific and may need to be adjusted
              const qualitySelectors = document.querySelectorAll('.vjs-quality-selector .vjs-menu-item, .quality-selector .quality-option, .ytp-settings-button');
              
              if (qualitySelectors && qualitySelectors.length > 0) {
                logDebug("Found " + qualitySelectors.length + " quality selectors");
                
                // Map our quality names to what might be in the player
                const qualityMap = {
                  "Auto": ["auto", "adaptive", "default"],
                  "4K": ["4k", "2160", "uhd", "ultra hd", "ultra-hd", "2160p"],
                  "1440p": ["1440", "1440p", "2k", "wqhd", "quad hd"],
                  "1080p": ["1080", "1080p", "full hd", "full-hd", "fhd"],
                  "720p": ["720", "720p", "hd"]
                };
                
                // Try to find and click the appropriate quality option
                let found = false;
                qualitySelectors.forEach(selector => {
                  const text = selector.textContent.toLowerCase();
                  if (qualityMap[quality].some(q => text.includes(q))) {
                    selector.click();
                    found = true;
                    logDebug("Clicked quality option: " + text);
                  }
                });
                
                if (!found) {
                  logDebug("Could not find matching quality option");
                  
                  // If requested quality is not available, try to select the next best available quality
                  if (quality === "4K") {
                    // Try 1440p first
                    let foundFallback = false;
                    qualitySelectors.forEach(selector => {
                      const text = selector.textContent.toLowerCase();
                      if (qualityMap["1440p"].some(q => text.includes(q))) {
                        selector.click();
                        logDebug("4K not found, selected 1440p instead");
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage("quality-fallback:1440p");
                        }
                        foundFallback = true;
                      }
                    });
                    
                    // If 1440p not found, try 1080p
                    if (!foundFallback) {
                      qualitySelectors.forEach(selector => {
                        const text = selector.textContent.toLowerCase();
                        if (qualityMap["1080p"].some(q => text.includes(q))) {
                          selector.click();
                          logDebug("4K and 1440p not found, selected 1080p instead");
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage("quality-fallback:1080p");
                          }
                        }
                      });
                    }
                  } else if (quality === "1440p") {
                    // Try 1080p as fallback
                    qualitySelectors.forEach(selector => {
                      const text = selector.textContent.toLowerCase();
                      if (qualityMap["1080p"].some(q => text.includes(q))) {
                        selector.click();
                        logDebug("1440p not found, selected 1080p instead");
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage("quality-fallback:1080p");
                        }
                      }
                    });
                  }
                }
              } else {
                logDebug("No quality selectors found");
              }
            } catch (e) {
              logDebug("Error setting video quality: " + e.message);
            }
          };
          
          // Function to find and track the video element
          const findVideoElement = () => {
            try {
              const videoElements = document.querySelectorAll('video');
              if (videoElements && videoElements.length > 0) {
                // Use the first video element found
                const video = videoElements[0];
                
                if (video !== videoState.videoElement) {
                  logDebug("Found video element");
                  videoState.videoElement = video;
                  
                  // Add event listeners to track video state
                  video.addEventListener('timeupdate', () => {
                    videoState.currentTime = Math.floor(video.currentTime);
                    
                    // Report current time to React Native every 5 seconds
                    if (videoState.currentTime % 5 === 0 && window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage("current-time:" + videoState.currentTime);
                    }
                  });
                  
                  video.addEventListener('play', () => {
                    videoState.isPlaying = true;
                  });
                  
                  video.addEventListener('pause', () => {
                    videoState.isPlaying = false;
                  });
                  
                  video.addEventListener('durationchange', () => {
                    videoState.duration = video.duration;
                  });
                  
                  // Set initial timestamp if we have one and haven't set it yet
                  if (initialTimestamp > 0 && !hasSetInitialTimestamp) {
                    logDebug("Setting initial timestamp to " + initialTimestamp);
                    setTimeout(() => {
                      try {
                        video.currentTime = initialTimestamp;
                        hasSetInitialTimestamp = true;
                      } catch (e) {
                        logDebug("Error setting initial timestamp: " + e.message);
                      }
                    }, 2000); // Wait a bit for the video to initialize
                  }
                }
                
                return video;
              }
              return null;
            } catch (e) {
              logDebug("Error finding video element: " + e.message);
              return null;
            }
          };
          
          // Clean up unwanted elements
          const cleanUpDOM = () => {
            try {
              // Remove popups and banners
              document.querySelectorAll('.popup-content, .power_stickybanner__wrapper, .ad-container, .cookie-notice, #cookie-notice, .gdpr-banner, .banner, .ads, .advertisement').forEach(el => {
                if (el) el.remove();
              });
              
              // Hide side menus and navigation elements
              document.querySelectorAll('#side-menu-content, #side-menu-control-btns, .navigation-menu, .site-header, .site-footer, .menu-toggle, .sidebar').forEach(el => {
                if (el) el.style.display = 'none';
              });
              
              // Ensure sound is enabled by default if needed
              const soundCheckbox = document.getElementById("citySoundsToggle");
              if (soundCheckbox && !soundCheckbox.checked && buttonStates.sound) {
                soundCheckbox.checked = true;
                const event = new Event('change', { bubbles: true });
                soundCheckbox.dispatchEvent(event);
              }
              
              // Ensure night mode is set correctly if needed
              const modeCheckbox = document.getElementById("dayNightToggle");
              if (modeCheckbox && modeCheckbox.checked !== buttonStates.mode) {
                modeCheckbox.checked = buttonStates.mode;
                const event = new Event('change', { bubbles: true });
                modeCheckbox.dispatchEvent(event);
              }
              
              // Add CSS to optimize video display for full screen vertical format
              const style = document.createElement('style');
              style.textContent = \`
                body, html {
                  overflow: hidden !important;
                  height: 100% !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #000 !important;
                }
                /* Hide any controls that might interfere with our custom UI */
                .video-controls, .player-controls {
                  opacity: 0 !important;
                  pointer-events: none !important;
                }
                /* Ensure video is centered */
                .video-js {
                  width: 100vw !important;
                  height: 100vh !important;
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                }
              \`;
              
              // Only add the style if it doesn't already exist
              if (!document.getElementById('optimized-video-style')) {
                style.id = 'optimized-video-style';
                document.head.appendChild(style);
              }
              
              // Find and track video element
              findVideoElement();
            } catch (e) {
              logDebug("DOM cleanup error: " + e.message);
            }
          };
          
          // Initialize controls
          const initializeControls = () => {
            try {
              logDebug("Initializing controls");
              
              // Check for existing checkboxes and set initial states
              const soundCheckbox = document.getElementById("citySoundsToggle");
              if (soundCheckbox) {
                buttonStates.sound = soundCheckbox.checked;
                logDebug("Initial sound state: " + (buttonStates.sound ? "on" : "off"));
              }
              
              const modeCheckbox = document.getElementById("dayNightToggle");
              if (modeCheckbox) {
                buttonStates.mode = modeCheckbox.checked;
                logDebug("Initial mode state: " + (buttonStates.mode ? "night" : "day"));
              }
              
              // Set up controls
              setupSoundControl();
              setupDayNightControl();
              setupQualityControl();
              cleanUpDOM();
              
              // Notify React Native that initialization is complete
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage("controls-initialized");
              }
            } catch (e) {
              logDebug("Error initializing controls: " + e.message);
            }
          };
          
          // Set up mutation observer to maintain controls and sync state
          const setupObserver = () => {
            try {
              const observer = new MutationObserver((mutations) => {
                // Check if our buttons still exist
                const soundButton = document.getElementById("sound-toggle-btn");
                const modeButton = document.getElementById("day-night-toggle-btn");
                const qualityButton = document.getElementById("quality-toggle-btn");
                
                // If buttons are missing, recreate them
                if (!soundButton || !modeButton || !qualityButton) {
                  logDebug("Controls missing, recreating");
                  initializeControls();
                }
                
                // Check if checkboxes exist and sync their state with our buttons
                const soundCheckbox = document.getElementById("citySoundsToggle");
                if (soundCheckbox && soundButton) {
                  // If checkbox state doesn't match our tracked state, update the button
                  if (soundCheckbox.checked !== buttonStates.sound) {
                    buttonStates.sound = soundCheckbox.checked;
                    soundButton.innerHTML = buttonStates.sound ? "🔊" : "🔇";
                    logDebug("Sound state synced to: " + (buttonStates.sound ? "on" : "off"));
                  }
                }
                
                const modeCheckbox = document.getElementById("dayNightToggle");
                if (modeCheckbox && modeButton) {
                  // If checkbox state doesn't match our tracked state, update the button
                  if (modeCheckbox.checked !== buttonStates.mode) {
                    buttonStates.mode = modeCheckbox.checked;
                    modeButton.innerHTML = buttonStates.mode ? "🌙" : "☀️";
                    logDebug("Mode state synced to: " + (buttonStates.mode ? "night" : "day"));
                  }
                }
                
                // Clean up DOM elements
                cleanUpDOM();
              });
              
              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
              });
              
              logDebug("Mutation observer set up");
            } catch (e) {
              logDebug("Error setting up observer: " + e.message);
            }
          };
          
          // Listen for messages from React Native
          window.addEventListener('message', (event) => {
            try {
              const message = event.data;
              logDebug("Received message: " + message);
              
              if (message.startsWith("set-quality:")) {
                const quality = message.split(":")[1];
                setVideoQuality(quality);
              }
            } catch (e) {
              logDebug("Error handling message: " + e.message);
            }
          });
          
          // Main initialization
          if (document.readyState === "complete" || document.readyState === "interactive") {
            logDebug("Document ready, initializing");
            initializeControls();
            setupObserver();
          } else {
            logDebug("Document not ready, waiting for DOMContentLoaded");
            document.addEventListener("DOMContentLoaded", () => {
              logDebug("DOMContentLoaded fired");
              initializeControls();
              setupObserver();
            });
          }
          
          // Fallback initialization after timeout
          setTimeout(() => {
            if (!document.getElementById("sound-toggle-btn")) {
              logDebug("Fallback initialization");
              initializeControls();
            }
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage("loading-done");
            }
          }, 2000);
          
          // Additional fallback - check every 5 seconds to ensure controls are present
          setInterval(() => {
            const soundButton = document.getElementById("sound-toggle-btn");
            const modeButton = document.getElementById("day-night-toggle-btn");
            const qualityButton = document.getElementById("quality-toggle-btn");
            
            if (!soundButton || !modeButton || !qualityButton) {
              logDebug("Periodic check: controls missing, recreating");
              initializeControls();
            } else {
              // Sync button states with checkboxes
              const soundCheckbox = document.getElementById("citySoundsToggle");
              if (soundCheckbox && soundButton) {
                if (soundCheckbox.checked !== buttonStates.sound) {
                  buttonStates.sound = soundCheckbox.checked;
                  soundButton.innerHTML = buttonStates.sound ? "🔊" : "🔇";
                  logDebug("Periodic sync: sound state updated to " + (buttonStates.sound ? "on" : "off"));
                }
              }
              
              const modeCheckbox = document.getElementById("dayNightToggle");
              if (modeCheckbox && modeButton) {
                if (modeCheckbox.checked !== buttonStates.mode) {
                  buttonStates.mode = modeCheckbox.checked;
                  modeButton.innerHTML = buttonStates.mode ? "🌙" : "☀️";
                  logDebug("Periodic sync: mode state updated to " + (buttonStates.mode ? "night" : "day"));
                }
              }
              
              // Find and track video element
              findVideoElement();
              
              // Report current timestamp to React Native
              if (videoState.videoElement && videoState.currentTime > 0 && window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage("current-time:" + videoState.currentTime);
              }
            }
          }, 5000);
        })();
        true;`}
        />
      </View>
    </View>
  )
}

// Update the styles to include the new loading animation styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "absolute",
    top: 0,
    left: 0,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 5,
  },
  floatingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF0000",
    marginRight: 5,
  },
  liveText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  webViewContainer: {
    position: "relative",
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Updated loading container styles
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    marginBottom: 30,
    opacity: 0.9,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  loadingSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  loadingBarContainer: {
    width: "80%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  dropdownContainer: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dropdownItemText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  dropdownItemTextSelected: {
    fontWeight: "bold",
  },
  qualityDropdownContainer: {
    position: "absolute",
    bottom: 180,
    right: 60,
    width: 150,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  qualityDropdownTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 4,
  },
  // Keeping the styles for the quality indicator in case we need them later,
  // but not using the component itself
  qualityIndicator: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 5,
  },
  qualityIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
})
