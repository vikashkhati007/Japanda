import { StyleSheet } from "react-native"

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkBackground: {
    backgroundColor: "#1a1a1a",
  },
  darkCard: {
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
  },
  darkText: {
    color: "#fff",
  },
  darkTag: {
    backgroundColor: "#333",
  },
  darkSearchBar: {
    backgroundColor: "#333",
  },
  darkButton: {
    backgroundColor: "#4a4a4a",
  },
  darkButtonText: {
    color: "#fff",
  },
  darkTabBar: {
    borderTopColor: "#333",
  },
  darkHeader: {
    borderBottomColor: "#333",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    // paddingBottom: 20, // For safe area on iOS
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: "#333",
  },
  tabText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  activeTabText: {
    color: "#333",
    fontWeight: "500",
  },
  wordCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  kanjiText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  hiraganaText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  romajiText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
    fontStyle: "italic",
  },
  meaningText: {
    fontSize: 16,
    color: "#333",
  },
  wordListContent: {
    gap: 16,
  },
})