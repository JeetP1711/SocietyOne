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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, Meeting, MeetingType } from "@/context/DataContext";
import Colors from "@/constants/colors";

export default function MeetingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { meetings, addMeeting, rsvpMeeting } = useData();
  const [showAdd, setShowAdd] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today);

  const canManage = user?.role === "admin" || user?.role === "secretary";
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1E3A8A", "#2563EB"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Meetings</Text>
          {canManage ? (
            <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
        <View style={styles.statsRow}>
          <StatChip label="Upcoming" value={upcoming.length} color="#93C5FD" />
          <StatChip label="Past" value={past.length} color="rgba(255,255,255,0.7)" />
        </View>
      </LinearGradient>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcoming.map((m) => (
              <MeetingCard key={m.id} item={m} user={user} onRSVP={rsvpMeeting} />
            ))}
          </>
        )}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Past Meetings</Text>
            {past.map((m) => (
              <MeetingCard key={m.id} item={m} user={user} onRSVP={rsvpMeeting} isPast />
            ))}
          </>
        )}
        {meetings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No meetings scheduled</Text>
          </View>
        )}
      </ScrollView>

      {showAdd && (
        <AddMeetingModal
          user={user}
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addMeeting({ ...data, rsvpYes: [], rsvpNo: [], createdBy: user?.name ?? "Admin" });
            setShowAdd(false);
          }}
        />
      )}
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function MeetingCard({ item, user, onRSVP, isPast = false }: { item: Meeting; user: any; onRSVP: Function; isPast?: boolean }) {
  const myFlat = user?.flatNumber;
  const myRSVP = myFlat ? (item.rsvpYes.includes(myFlat) ? "yes" : item.rsvpNo.includes(myFlat) ? "no" : null) : null;
  const typeColor = getMeetingTypeColor(item.type);

  async function handleRSVP(attending: boolean) {
    if (!myFlat) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRSVP(item.id, myFlat, attending);
  }

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={[styles.cardLeftBar, { backgroundColor: typeColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{item.type}</Text>
          </View>
          {!isPast && (
            <View style={styles.upcomingBadge}>
              <Ionicons name="time-outline" size={12} color={Colors.primary} />
              <Text style={styles.upcomingText}>Upcoming</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(item.date)} at {item.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.rsvpYes.length} attending</Text>
          </View>
        </View>

        {item.agenda.length > 0 && (
          <View style={styles.agendaSection}>
            <Text style={styles.agendaTitle}>Agenda</Text>
            {item.agenda.slice(0, 3).map((a, i) => (
              <View key={i} style={styles.agendaItem}>
                <Text style={styles.agendaNum}>{i + 1}.</Text>
                <Text style={styles.agendaText}>{a}</Text>
              </View>
            ))}
            {item.agenda.length > 3 && (
              <Text style={styles.agendaMore}>+{item.agenda.length - 3} more</Text>
            )}
          </View>
        )}

        {myFlat && !isPast && (
          <View style={styles.rsvpSection}>
            <Text style={styles.rsvpLabel}>Your RSVP</Text>
            <View style={styles.rsvpBtns}>
              <Pressable
                style={[styles.rsvpBtn, myRSVP === "yes" && styles.rsvpBtnYes]}
                onPress={() => handleRSVP(true)}
              >
                <Ionicons name="checkmark-circle" size={16} color={myRSVP === "yes" ? "#fff" : Colors.success} />
                <Text style={[styles.rsvpBtnText, { color: myRSVP === "yes" ? "#fff" : Colors.success }]}>Attending</Text>
              </Pressable>
              <Pressable
                style={[styles.rsvpBtn, myRSVP === "no" && styles.rsvpBtnNo]}
                onPress={() => handleRSVP(false)}
              >
                <Ionicons name="close-circle" size={16} color={myRSVP === "no" ? "#fff" : Colors.error} />
                <Text style={[styles.rsvpBtnText, { color: myRSVP === "no" ? "#fff" : Colors.error }]}>Not Attending</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function AddMeetingModal({ user, onClose, onAdd }: any) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("Clubhouse");
  const [type, setType] = useState<string>("General");
  const [agendaText, setAgendaText] = useState("");

  function handleAdd() {
    if (!title || !date) return;
    const agenda = agendaText.split("\n").filter((a) => a.trim().length > 0);
    onAdd({ title, description, date, time, location, type, agenda });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Schedule Meeting</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14 }}>
              <View>
                <Text style={styles.formLabel}>Meeting Title *</Text>
                <TextInput style={styles.formInput} placeholder="Meeting title" placeholderTextColor={Colors.textTertiary} value={title} onChangeText={setTitle} />
              </View>
              <View>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeRow}>
                  {(["General", "AGM", "Emergency", "Committee"] as MeetingType[]).map((t) => (
                    <Pressable key={t} style={[styles.typeBtn, type === t && { backgroundColor: getMeetingTypeColor(t), borderColor: getMeetingTypeColor(t) }]} onPress={() => setType(t)}>
                      <Text style={[styles.typeBtnText, type === t && { color: "#fff" }]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Date *</Text>
                  <TextInput style={styles.formInput} placeholder="2026-03-25" placeholderTextColor={Colors.textTertiary} value={date} onChangeText={setDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Time</Text>
                  <TextInput style={styles.formInput} placeholder="18:00" placeholderTextColor={Colors.textTertiary} value={time} onChangeText={setTime} />
                </View>
              </View>
              <View>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput style={styles.formInput} placeholder="Clubhouse" placeholderTextColor={Colors.textTertiary} value={location} onChangeText={setLocation} />
              </View>
              <View>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, { height: 80, textAlignVertical: "top" }]} placeholder="Meeting description..." placeholderTextColor={Colors.textTertiary} value={description} onChangeText={setDescription} multiline />
              </View>
              <View>
                <Text style={styles.formLabel}>Agenda (one item per line)</Text>
                <TextInput style={[styles.formInput, { height: 100, textAlignVertical: "top" }]} placeholder={"Review accounts\nNew projects\nOpen forum"} placeholderTextColor={Colors.textTertiary} value={agendaText} onChangeText={setAgendaText} multiline />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={handleAdd}
          >
            <Text style={styles.submitBtnText}>Schedule Meeting</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getMeetingTypeColor(t: string) {
  if (t === "AGM") return Colors.primary;
  if (t === "Emergency") return Colors.error;
  if (t === "Committee") return Colors.secondary;
  return Colors.warning;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 30, justifyContent: "center" },
  statChip: { alignItems: "center" },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 10 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, flexDirection: "row", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardPast: { opacity: 0.75 },
  cardLeftBar: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  upcomingBadge: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: Colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  upcomingText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  infoSection: { gap: 6, marginBottom: 10 },
  infoRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  agendaSection: { backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginBottom: 10 },
  agendaTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.textSecondary, marginBottom: 8 },
  agendaItem: { flexDirection: "row", gap: 8, marginBottom: 4 },
  agendaNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.secondary, width: 18 },
  agendaText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  agendaMore: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginTop: 4 },
  rsvpSection: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 12 },
  rsvpLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  rsvpBtns: { flexDirection: "row", gap: 10 },
  rsvpBtn: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  rsvpBtnYes: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rsvpBtnNo: { backgroundColor: Colors.error, borderColor: Colors.error },
  rsvpBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  typeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  rowFields: { flexDirection: "row", gap: 10 },
  submitBtn: { backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
