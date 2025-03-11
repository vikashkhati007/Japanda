import { View, Text, TouchableOpacity } from "react-native"
import { Sun, Moon } from "lucide-react-native"
import { StyleSheet } from "react-native"
import { globalStyles } from "../../styles/globalStyles"

export default function SettingsScreen({ theme, toggleTheme }:any) {
  return (
    <View style={[styles.settingsContainer, theme === "dark" && globalStyles.darkBackground]}>
      <View style={styles.settingSection}>
        <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>Display</Text>
        <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
          <Text style={[styles.settingLabel, theme === "dark" && globalStyles.darkText]}>Theme</Text>
          <View style={styles.themeToggle}>
            {theme === "light" ? <Sun size={20} color="#333" /> : <Moon size={20} color="#fff" />}
            <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>
              {theme === "light" ? "Light" : "Dark"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={[styles.settingLabel, theme === "dark" && globalStyles.darkText]}>Font Size</Text>
          <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>Medium</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingSection}>
        <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>Language</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={[styles.settingLabel, theme === "dark" && globalStyles.darkText]}>Interface Language</Text>
          <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>English</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingSection}>
        <Text style={[styles.settingSectionTitle, theme === "dark" && globalStyles.darkText]}>About</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={[styles.settingLabel, theme === "dark" && globalStyles.darkText]}>Version</Text>
          <Text style={[styles.settingValue, theme === "dark" && globalStyles.darkText]}>1.0.0</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  settingValue: {
    fontSize: 16,
    color: "#888",
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
})