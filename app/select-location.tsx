import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  ScrollView,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { LOCATION_KEY } from "@/lib/location";

const CITIES_DATA: { city: string; icon: string; societies: string[] }[] = [
  {
    city: "Mumbai",
    icon: "city",
    societies: ["Green Valley CHS", "Sea Breeze Apartments", "Marine Heights", "Bandra Garden Estate", "Powai Lake View"],
  },
  {
    city: "Delhi",
    icon: "office-building-marker",
    societies: ["Dwarka Heights", "Vasant Kunj Enclave", "Rohini Greens", "South City Residency", "Mayur Vihar Complex"],
  },
  {
    city: "Bangalore",
    icon: "city-variant",
    societies: ["Whitefield Residency", "Koramangala CHS", "Electronic City Heights", "Indiranagar Square", "Bellandur Lakeside"],
  },
  {
    city: "Pune",
    icon: "home-city",
    societies: ["Aundh Garden Society", "Baner Heights", "Wakad Prime", "Kothrud Residency", "Hinjewadi Greens"],
  },
  {
    city: "Chennai",
    icon: "beach",
    societies: ["Adyar Green View", "Anna Nagar Heights", "Velachery Residency", "T Nagar Premier", "Besant Nagar Beach CHS"],
  },
  {
    city: "Hyderabad",
    icon: "domain",
    societies: ["Hitech City Heights", "Gachibowli Greens", "Madhapur Elite", "Kondapur Residency", "Banjara Hills Crown"],
  },
  {
    city: "Kolkata",
    icon: "flag",
    societies: ["Salt Lake Residency", "Rajarhat New Town", "Alipore Gardens", "Ballygunge Heights", "New Town Crown"],
  },
  {
    city: "Ahmedabad",
    icon: "bridge",
    societies: ["SG Highway Heights", "Prahlad Nagar Elite", "Satellite Residency", "Navrangpura Crown", "Vastrapur Lake View"],
  },
  {
    city: "Jaipur",
    icon: "castle",
    societies: ["C-Scheme Residency", "Vaishali Nagar Heights", "Mansarovar Elite", "Malviya Nagar Greens", "Jagatpura Crown"],
  },
  {
    city: "Surat",
    icon: "diamond-stone",
    societies: ["Vesu Heights", "Adajan Prime", "Katargam Residency", "Althan Greens", "Pal Elite"],
  },
];

type Step = "city" | "society";

export default function SelectLocationScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("city");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSociety, setSelectedSociety] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [societySearch, setSocietySearch] = useState("");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const filteredCities = CITIES_DATA.filter((c) =>
    c.city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const currentCityData = CITIES_DATA.find((c) => c.city === selectedCity);
  const filteredSocieties = (currentCityData?.societies ?? []).filter((s) =>
    s.toLowerCase().includes(societySearch.toLowerCase())
  );

  async function handleCitySelect(city: string) {
    await Haptics.selectionAsync();
    setSelectedCity(city);
    setSelectedSociety(null);
    setSocietySearch("");
    setStep("society");
  }

  function handleBackToCity() {
    setStep("city");
    setSelectedSociety(null);
    setSocietySearch("");
  }

  async function handleSocietySelect(society: string) {
    await Haptics.selectionAsync();
    setSelectedSociety(society);
  }

  async function handleContinue() {
    if (!selectedCity || !selectedSociety) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data: LocationData = { city: selectedCity, society: selectedSociety };
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(data));
    router.replace("/");
  }

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 20 }]}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="office-building" size={28} color="#fff" />
          </View>
          <Text style={styles.logoText}>SocietyOne</Text>
        </View>

        <Text style={styles.headerTitle}>
          {step === "city" ? "Select Your City" : "Select Your Society"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {step === "city"
            ? "Choose the city where your society is located"
            : `Societies in ${selectedCity}`}
        </Text>

        <View style={styles.stepIndicator}>
          <StepDot active={true} done={step === "society"} label="City" num={1} />
          <View style={[styles.stepLine, step === "society" && styles.stepLineDone]} />
          <StepDot active={step === "society"} done={false} label="Society" num={2} />
        </View>
      </LinearGradient>

      {step === "city" ? (
        <CityStep
          search={citySearch}
          onSearch={setCitySearch}
          cities={filteredCities}
          onSelect={handleCitySelect}
        />
      ) : (
        <SocietyStep
          cityName={selectedCity!}
          search={societySearch}
          onSearch={setSocietySearch}
          societies={filteredSocieties}
          selected={selectedSociety}
          onSelect={handleSocietySelect}
          onBack={handleBackToCity}
          onContinue={handleContinue}
          canContinue={!!selectedSociety}
        />
      )}
    </View>
  );
}

function StepDot({ active, done, label, num }: {
  active: boolean;
  done: boolean;
  label: string;
  num: number;
}) {
  return (
    <View style={styles.stepDotWrap}>
      <View style={[
        styles.stepDot,
        active && styles.stepDotActive,
        done && styles.stepDotDone,
      ]}>
        {done ? (
          <Ionicons name="checkmark" size={12} color="#fff" />
        ) : (
          <Text style={[styles.stepDotNum, active && { color: "#fff" }]}>{num}</Text>
        )}
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function CityStep({ search, onSearch, cities, onSelect }: {
  search: string;
  onSearch: (v: string) => void;
  cities: typeof CITIES_DATA;
  onSelect: (city: string) => void;
}) {
  return (
    <View style={styles.body}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search city..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={onSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => onSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={cities}
        keyExtractor={(item) => item.city}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.cityCard, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => onSelect(item.city)}
          >
            <View style={styles.cityIconWrap}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color="#2563EB" />
            </View>
            <View style={styles.cityInfo}>
              <Text style={styles.cityName}>{item.city}</Text>
              <Text style={styles.cityMeta}>{item.societies.length} societies</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </Pressable>
        )}
      />
    </View>
  );
}

function SocietyStep({ cityName, search, onSearch, societies, selected, onSelect, onBack, onContinue, canContinue }: {
  cityName: string;
  search: string;
  onSearch: (v: string) => void;
  societies: string[];
  selected: string | null;
  onSelect: (s: string) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <View style={styles.body}>
      <Pressable style={styles.backRow} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={22} color={Colors.primary} />
        <Text style={styles.backText}>Back to Cities</Text>
      </Pressable>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search societies in ${cityName}...`}
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={onSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => onSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={societies}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        renderItem={({ item }) => {
          const isSelected = selected === item;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.societyCard,
                isSelected && styles.societyCardSelected,
                { opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => onSelect(item)}
            >
              <View style={[styles.societyIconWrap, isSelected && styles.societyIconWrapSelected]}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={22}
                  color={isSelected ? "#fff" : Colors.primary}
                />
              </View>
              <Text style={[styles.societyName, isSelected && styles.societyNameSelected]}>
                {item}
              </Text>
              {isSelected && (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <Pressable
        style={({ pressed }) => [styles.continueBtn, !canContinue && styles.continueBtnDisabled, { opacity: pressed && canContinue ? 0.88 : 1 }]}
        onPress={handleContinuePress}
        disabled={!canContinue}
      >
        <LinearGradient
          colors={canContinue ? ["#16A34A", "#2563EB"] : ["#D1D5DB", "#D1D5DB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueBtnGradient}
        >
          <Text style={[styles.continueBtnText, !canContinue && styles.continueBtnTextDisabled]}>
            {canContinue ? `Continue to Login` : "Select a Society"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={canContinue ? "#fff" : "#9CA3AF"} />
        </LinearGradient>
      </Pressable>
    </View>
  );

  function handleContinuePress() {
    if (canContinue) onContinue();
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.72)",
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  stepDotWrap: {
    alignItems: "center",
    gap: 4,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  stepDotActive: {
    backgroundColor: "#2563EB",
    borderColor: "#93C5FD",
  },
  stepDotDone: {
    backgroundColor: "#16A34A",
    borderColor: "#86EFAC",
  },
  stepDotNum: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.6)",
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
  },
  stepLabelActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
    marginHorizontal: 6,
  },
  stepLineDone: {
    backgroundColor: "#86EFAC",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cityIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cityInfo: { flex: 1 },
  cityName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 2,
  },
  cityMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  societyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  societyCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0FDF4",
  },
  societyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  societyIconWrapSelected: {
    backgroundColor: Colors.primary,
  },
  societyName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  societyNameSelected: {
    color: Colors.primary,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  continueBtnTextDisabled: {
    color: "#9CA3AF",
  },
});
