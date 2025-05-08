"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, StyleSheet, Animated, Easing } from "react-native"

interface SkeletonLoaderProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: any
  theme?: "light" | "dark"
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
  theme = "light",
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    )

    shimmerLoop.start()

    return () => {
      shimmerLoop.stop()
    }
  }, [])

  const shimmerGradient = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.2)"],
  })

  const darkShimmerGradient = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.03)", "rgba(255, 255, 255, 0.15)"],
  })

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: theme === "dark" ? darkShimmerGradient : shimmerGradient,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

export default SkeletonLoader

