import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const SERVICES = [
  {
    id: "maintenance",
    label: "Maintenance",
    subtitle: "Monthly fees & payments",
    icon: "cash-multiple",
    color: "#16A34A",
    bg: "#F0FDF4",
    route: "/maintenance",
  },
  {
    id: "festivals",
    label: "Festival Funds",
    subtitle: "Society celebrations",
    icon: "party-popper",
    color: "#D97706",
    bg: "#FFFBEB",
    route: "/festivals",
  },
  {
    id: "meetings",
    label: "Meetings",
    subtitle: "Schedule & RSVP",
    icon: "calendar-check",
    color: "#2563EB",
    bg: "#EFF6FF",
    route: "/meetings",
  },
  {
    id: "bookings",
    label: "Amenity Booking",
    subtitle: "Clubhouse, gym, pool...",
    icon: "bookmark-multiple",
    color: "#0891B2",
    bg: "#ECFEFF",
    route: "/bookings",
  },
  {
    id: "gatepass",
    label: "Gate Pass",
    subtitle: "Visitor QR pass",
    icon: "qrcode-scan",
    color: "#7C3AED",
    bg: "#F5F3FF",
    route: "/gatepass",
  },
  {
    id: "visitors",
    label: "Visitors",
    subtitle: "Approve visitor entry",
    icon: "account-clock",
    color: "#0891B2",
    bg: "#ECFEFF",
    route: "/visitors",
  },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { maintenance, festivals, bookings, gatePasses, visitorRequests } = useData();

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "secretary";
  const today = new Date().toISOString().split("T")[0];
  const pendingMaint = user?.flatNumber
    ? maintenance.filter((m) => m.flatNumber === user.flatNumber && m.status !== "paid").length
    : maintenance.filter((m) => m.status !== "paid").length;
  const activeFestivals = festivals.filter((f) => f.status === "active").length;
  const myBookings = user?.flatNumber
    ? bookings.filter((b) => b.flatNumber === user.flatNumber && b.date >= today).length
    : bookings.filter((b) => b.date >= today).length;
  const activeGatePasses = user?.flatNumber
    ? gatePasses.filter((g) => g.flatNumber === user.flatNumber && g.status === "active").length
    : gatePasses.filter((g) => g.status === "active").length;
  const pendingVisitors = isStaff
    ? visitorRequests.filter((v) => v.status === "pending").length
    : visitorRequests.filter((v) => v.flatNumber === user?.flatNumber && v.status === "pending").length;

  const counts: Record<string, number | null> = {
    maintenance: pendingMaint,
    festivals: activeFestivals,
    meetings: null,
    bookings: myBookings,
    gatepass: activeGatePasses,
    visitors: pendingVisitors,
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <LinearGradient
        colors={["#16A34A", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <Text style={styles.headerTitle}>Services</Text>
        <Text style={styles.headerSubtitle}>Manage your society services</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.grid}>
          {SERVICES.filter((s) => !isAdmin || !["festivals", "bookings"].includes(s.id)).map((s) => {
            const count = counts[s.id];
            return (
              <Pressable
                key={s.id}
                style={({ pressed }) => [styles.serviceCard, { opacity: pressed ? 0.88 : 1 }]}
                onPress={() => router.push(s.route as any)}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: s.bg }]}>
                  <MaterialCommunityIcons name={s.icon as any} size={32} color={s.color} />
                  {count !== null && count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceLabel}>{s.label}</Text>
                <Text style={styles.serviceSubtitle}>{s.subtitle}</Text>
                <View style={[styles.serviceArrow, { backgroundColor: s.bg }]}>
                  <Ionicons name="arrow-forward" size={14} color={s.color} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {!isAdmin && <View style={styles.amenitySection}>
          <Text style={styles.sectionTitle}>Available Amenities</Text>
          {AMENITIES.map((a) => (
            <Pressable
              key={a.name}
              style={({ pressed }) => [styles.amenityCard, { opacity: pressed ? 0.9 : 1 }]}
              onPress={() => router.push("/bookings")}
            >
              <View style={[styles.amenityIcon, { backgroundColor: a.color + "15" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={24} color={a.color} />
              </View>
              <View style={styles.amenityInfo}>
                <Text style={styles.amenityName}>{a.name}</Text>
                <Text style={styles.amenityMeta}>{a.meta}</Text>
              </View>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>Available</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </Pressable>
          ))}
        </View>}
      </View>
    </ScrollView>
  );
}

const AMENITIES = [
  { name: "Clubhouse", icon: "home-group", color: "#7C3AED", meta: "Capacity: 100 | Mon–Sun, 8AM–10PM" },
  { name: "Swimming Pool", icon: "pool", color: "#0891B2", meta: "Mon–Sun, 6AM–9PM" },
  { name: "Gym", icon: "dumbbell", color: "#DC2626", meta: "24/7 Access" },
  { name: "Badminton Court", icon: "badminton", color: "#16A34A", meta: "Mon–Sun, 6AM–10PM" },
  { name: "Party Hall", icon: "party-popper", color: "#D97706", meta: "Capacity: 50 | Mon–Sun, 10AM–11PM" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 4 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  body: { padding: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  serviceCard: {
    width: "47%",
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  serviceIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  serviceLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  serviceSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  serviceArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 12 },
  amenitySection: { marginTop: 8 },
  amenityCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  amenityIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  amenityInfo: { flex: 1 },
  amenityName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  amenityMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  availableDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  availableText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.success },
});
