import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";
import { LOCATION_KEY, type LocationData } from "@/lib/location";

const DEMO_CREDS = [
  { role: "Admin", username: "admin", password: "admin123", icon: "shield-crown" as const, color: "#DC2626" },
  { role: "Secretary", username: "secretary", password: "sec123", icon: "account-tie" as const, color: "#2563EB" },
  { role: "Member", username: "rajesh", password: "pass123", icon: "home-account" as const, color: "#16A34A" },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(true);

  useEffect(() => {
    async function checkLocation() {
      const raw = await AsyncStorage.getItem(LOCATION_KEY);
      if (!raw) {
        router.replace("/select-location");
        return;
      }
      setLocation(JSON.parse(raw));
      setCheckingLocation(false);
    }
    checkLocation();
  }, []);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your username and password.");
      return;
    }
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      router.replace("/(tabs)");
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid Credentials", "Please check your username and password.");
    }
  }

  function quickLogin(u: string, p: string) {
    setUsername(u);
    setPassword(p);
  }

  async function handleChangeLocation() {
    await AsyncStorage.removeItem(LOCATION_KEY);
    router.replace("/select-location");
  }

  if (checkingLocation) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + 34 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#0F172A", "#1E3A8A", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoIconWrap}>
              <MaterialCommunityIcons name="office-building" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>SocietyOne</Text>
          </View>

          {location && (
            <View style={styles.locationBanner}>
              <View style={styles.locationLeft}>
                <Ionicons name="location" size={15} color="#93C5FD" />
                <View>
                  <Text style={styles.locationCity}>{location.city}</Text>
                  <Text style={styles.locationSociety}>{location.society}</Text>
                </View>
              </View>
              <Pressable style={styles.changeBtn} onPress={handleChangeLocation}>
                <Ionicons name="swap-horizontal" size={13} color="#93C5FD" />
                <Text style={styles.changeBtnText}>Change</Text>
              </Pressable>
            </View>
          )}
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your society account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={["#16A34A", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Quick Access</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoGrid}>
            {DEMO_CREDS.map((cred) => (
              <Pressable
                key={cred.role}
                style={({ pressed }) => [styles.demoBtn, { borderColor: cred.color, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => quickLogin(cred.username, cred.password)}
              >
                <View style={[styles.demoIconWrap, { backgroundColor: cred.color + "20" }]}>
                  <MaterialCommunityIcons name={cred.icon} size={22} color={cred.color} />
                </View>
                <Text style={[styles.demoBtnText, { color: cred.color }]}>{cred.role}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.demoHint}>Tap a role above to auto-fill credentials</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 16,
  },
  logoContainer: {
    alignItems: "center",
    gap: 8,
  },
  logoIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.3)",
  },
  locationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  locationCity: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.65)",
    lineHeight: 16,
  },
  locationSociety: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(147,197,253,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.3)",
  },
  changeBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#93C5FD",
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    padding: 28,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loginBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  demoGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  demoBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  demoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  demoHint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
});
