import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, Booking } from "@/context/DataContext";
import Colors from "@/constants/colors";

const AMENITIES = [
  { name: "Clubhouse", icon: "home-group", color: "#7C3AED", capacity: "100 people", hours: "8AM–10PM" },
  { name: "Swimming Pool", icon: "pool", color: "#0891B2", capacity: "Open pool", hours: "6AM–9PM" },
  { name: "Gym", icon: "dumbbell", color: "#DC2626", capacity: "20 people", hours: "24/7" },
  { name: "Badminton Court", icon: "badminton", color: "#16A34A", capacity: "4 people", hours: "6AM–10PM" },
  { name: "Party Hall", icon: "party-popper", color: "#D97706", capacity: "50 people", hours: "10AM–11PM" },
];

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bookings, addBooking, cancelBooking } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];
  const canViewAll = user?.role === "admin" || user?.role === "secretary";
  const myBookings = bookings.filter((b) => canViewAll ? true : b.flatNumber === user?.flatNumber);
  const upcoming = myBookings.filter((b) => b.date >= today && b.status !== "cancelled");
  const past = myBookings.filter((b) => b.date < today || b.status === "cancelled");
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#155E75", "#0891B2"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Amenity Booking</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.tabBar}>
          <Pressable style={[styles.tabBtn, tab === "upcoming" && styles.tabBtnActive]} onPress={() => setTab("upcoming")}>
            <Text style={[styles.tabBtnText, tab === "upcoming" && styles.tabBtnTextActive]}>Upcoming ({upcoming.length})</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, tab === "past" && styles.tabBtnActive]} onPress={() => setTab("past")}>
            <Text style={[styles.tabBtnText, tab === "past" && styles.tabBtnTextActive]}>Past ({past.length})</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        <Text style={styles.sectionTitle}>Available Amenities</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
          {AMENITIES.map((a) => (
            <Pressable
              key={a.name}
              style={({ pressed }) => [styles.amenityChip, { borderColor: a.color, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowAdd(true)}
            >
              <View style={[styles.amenityChipIcon, { backgroundColor: a.color + "15" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.amenityChipName, { color: a.color }]}>{a.name}</Text>
              <Text style={styles.amenityChipHours}>{a.hours}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{tab === "upcoming" ? "My Upcoming Bookings" : "Past Bookings"}</Text>
        {(tab === "upcoming" ? upcoming : past).length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No {tab} bookings</Text>
          </View>
        )}
        {(tab === "upcoming" ? upcoming : past).map((b) => (
          <BookingCard
            key={b.id}
            item={b}
            amenityData={AMENITIES.find((a) => a.name === b.amenity)}
            canCancel={tab === "upcoming" && (b.flatNumber === user?.flatNumber || canViewAll)}
            onCancel={() => {
              Alert.alert("Cancel Booking", "Are you sure?", [
                { text: "No", style: "cancel" },
                { text: "Yes, Cancel", style: "destructive", onPress: async () => {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  await cancelBooking(b.id);
                }},
              ]);
            }}
          />
        ))}
      </ScrollView>

      {showAdd && (
        <AddBookingModal
          user={user}
          amenities={AMENITIES}
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addBooking({ ...data, flatNumber: user?.flatNumber ?? "Admin", residentName: user?.name ?? "Admin", status: "confirmed" });
            setShowAdd(false);
          }}
        />
      )}
    </View>
  );
}

function BookingCard({ item, amenityData, canCancel, onCancel }: { item: Booking; amenityData: any; canCancel: boolean; onCancel: () => void }) {
  const statusColor = item.status === "confirmed" ? Colors.success : item.status === "cancelled" ? Colors.error : Colors.warning;
  const statusBg = item.status === "confirmed" ? Colors.successSoft : item.status === "cancelled" ? Colors.errorSoft : Colors.warningSoft;
  const color = amenityData?.color ?? Colors.secondary;

  return (
    <View style={styles.bookingCard}>
      <View style={[styles.bookingLeftBar, { backgroundColor: color }]} />
      <View style={styles.bookingContent}>
        <View style={styles.bookingTop}>
          <View style={styles.bookingIconWrap}>
            <MaterialCommunityIcons name={amenityData?.icon ?? "bookmark"} size={24} color={color} />
          </View>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingAmenity}>{item.amenity}</Text>
            <Text style={styles.bookingFlat}>{item.residentName} • {item.flatNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.bookingMeta}>
          <View style={styles.bookingMetaRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.bookingMetaText}>{item.date}</Text>
          </View>
          <View style={styles.bookingMetaRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.bookingMetaText}>{item.startTime} – {item.endTime}</Text>
          </View>
          {item.purpose && (
            <View style={styles.bookingMetaRow}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.bookingMetaText}>{item.purpose}</Text>
            </View>
          )}
        </View>
        {canCancel && (
          <Pressable
            style={({ pressed }) => [styles.cancelBookingBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={onCancel}
          >
            <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.cancelBookingText}>Cancel Booking</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function AddBookingModal({ user, amenities, onClose, onAdd }: any) {
  const insets = useSafeAreaInsets();
  const [amenity, setAmenity] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Amenity</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.formLabel}>Select Amenity</Text>
            <View style={styles.amenitySelectGrid}>
              {amenities.map((a: any) => (
                <Pressable
                  key={a.name}
                  style={[styles.amenitySelectBtn, amenity === a.name && { backgroundColor: a.color, borderColor: a.color }]}
                  onPress={() => setAmenity(a.name)}
                >
                  <MaterialCommunityIcons name={a.icon} size={20} color={amenity === a.name ? "#fff" : a.color} />
                  <Text style={[styles.amenitySelectText, amenity === a.name && { color: "#fff" }]}>{a.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.formInput} placeholder="2026-03-20" placeholderTextColor={Colors.textTertiary} value={date} onChangeText={setDate} />
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput style={styles.formInput} placeholder="09:00" placeholderTextColor={Colors.textTertiary} value={startTime} onChangeText={setStartTime} />
              </View>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput style={styles.formInput} placeholder="11:00" placeholderTextColor={Colors.textTertiary} value={endTime} onChangeText={setEndTime} />
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Purpose (Optional)</Text>
              <TextInput style={styles.formInput} placeholder="Birthday party, yoga class..." placeholderTextColor={Colors.textTertiary} value={purpose} onChangeText={setPurpose} />
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => { if (amenity && date && startTime && endTime) onAdd({ amenity, date, startTime, endTime, purpose }); }}
          >
            <Text style={styles.submitBtnText}>Confirm Booking</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  tabBar: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  tabBtnActive: { backgroundColor: "#fff" },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  tabBtnTextActive: { color: "#155E75", fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 12 },
  amenityChip: { width: 130, backgroundColor: Colors.card, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1.5, alignItems: "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  amenityChipIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  amenityChipName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  amenityChipHours: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  bookingCard: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, flexDirection: "row", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  bookingLeftBar: { width: 4 },
  bookingContent: { flex: 1, padding: 14 },
  bookingTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  bookingIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  bookingInfo: { flex: 1 },
  bookingAmenity: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  bookingFlat: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bookingMeta: { gap: 6 },
  bookingMetaRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  bookingMetaText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  cancelBookingBtn: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 },
  cancelBookingText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.error },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  amenitySelectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  amenitySelectBtn: { flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  amenitySelectText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  formField: { marginBottom: 14 },
  formRow: { flexDirection: "row", gap: 10 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  submitBtn: { backgroundColor: "#0891B2", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
