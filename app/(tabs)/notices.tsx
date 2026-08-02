import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useData, Announcement, Meeting } from "@/context/DataContext";
import Colors from "@/constants/colors";

type Tab = "announcements" | "meetings";

export default function NoticesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { announcements, meetings, addAnnouncement, addMeeting, rsvpMeeting } = useData();
  const [activeTab, setActiveTab] = useState<Tab>("announcements");
  const [showAddModal, setShowAddModal] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "secretary";
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1E3A8A", "#2563EB"]} style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notices</Text>
          {canManage && (
            <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          )}
        </View>
        <View style={styles.tabBar}>
          {(["announcements", "meetings"] as Tab[]).map((t) => (
            <Pressable key={t} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                {t === "announcements" ? "Announcements" : "Meetings"}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {activeTab === "announcements"
          ? announcements.map((a) => <AnnouncementCard key={a.id} item={a} />)
          : meetings.map((m) => <MeetingCard key={m.id} item={m} user={user} onRSVP={rsvpMeeting} />)}
        {activeTab === "announcements" && announcements.length === 0 && <EmptyState icon="megaphone-outline" text="No announcements yet" />}
        {activeTab === "meetings" && meetings.length === 0 && <EmptyState icon="calendar-outline" text="No meetings scheduled" />}
      </ScrollView>

      {showAddModal && (
        <AddNoticeModal
          type={activeTab}
          user={user}
          onClose={() => setShowAddModal(false)}
          onAddAnnouncement={addAnnouncement}
          onAddMeeting={addMeeting}
        />
      )}
    </View>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor = getPriorityColor(item.priority);
  const categoryIcon = getCategoryIcon(item.category);

  return (
    <Pressable style={styles.card} onPress={() => setExpanded(!expanded)}>
      <View style={[styles.cardPriorityBar, { backgroundColor: priorityColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <View style={[styles.badge, { backgroundColor: priorityColor + "20" }]}>
              <Text style={[styles.badgeText, { color: priorityColor }]}>{item.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.secondarySoft }]}>
              <Ionicons name={categoryIcon} size={12} color={Colors.secondary} />
              <Text style={[styles.badgeText, { color: Colors.secondary }]}>{item.category}</Text>
            </View>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardText} numberOfLines={expanded ? undefined : 2}>{item.content}</Text>
        <View style={styles.cardFooter}>
          <Ionicons name="person-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.cardAuthor}>{item.createdBy}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
        </View>
      </View>
    </Pressable>
  );
}

function MeetingCard({ item, user, onRSVP }: { item: Meeting; user: any; onRSVP: Function }) {
  const isUpcoming = item.date >= new Date().toISOString().split("T")[0];
  const myFlat = user?.flatNumber;
  const myRSVP = myFlat ? (item.rsvpYes.includes(myFlat) ? "yes" : item.rsvpNo.includes(myFlat) ? "no" : null) : null;

  async function handleRSVP(attending: boolean) {
    if (!myFlat) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRSVP(item.id, myFlat, attending);
  }

  return (
    <View style={styles.card}>
      <View style={[styles.cardPriorityBar, { backgroundColor: getMeetingTypeColor(item.type) }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: getMeetingTypeColor(item.type) + "20" }]}>
            <Text style={[styles.badgeText, { color: getMeetingTypeColor(item.type) }]}>{item.type}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isUpcoming ? Colors.successSoft : Colors.divider }]}>
            <Text style={[styles.badgeText, { color: isUpcoming ? Colors.success : Colors.textSecondary }]}>
              {isUpcoming ? "Upcoming" : "Past"}
            </Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.meetingInfo}>
          <View style={styles.meetingInfoRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.meetingInfoText}>{formatDate2(item.date)} at {item.time}</Text>
          </View>
          <View style={styles.meetingInfoRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.meetingInfoText}>{item.location}</Text>
          </View>
          <View style={styles.meetingInfoRow}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.meetingInfoText}>{item.rsvpYes.length} attending</Text>
          </View>
        </View>
        {item.agenda.length > 0 && (
          <View style={styles.agendaWrap}>
            <Text style={styles.agendaTitle}>Agenda</Text>
            {item.agenda.map((a, i) => (
              <View key={i} style={styles.agendaItem}>
                <Text style={styles.agendaNum}>{i + 1}.</Text>
                <Text style={styles.agendaText}>{a}</Text>
              </View>
            ))}
          </View>
        )}
        {myFlat && isUpcoming && (
          <View style={styles.rsvpRow}>
            <Text style={styles.rsvpLabel}>Your RSVP:</Text>
            <Pressable
              style={[styles.rsvpBtn, myRSVP === "yes" && styles.rsvpBtnActiveGreen]}
              onPress={() => handleRSVP(true)}
            >
              <Ionicons name="checkmark" size={14} color={myRSVP === "yes" ? "#fff" : Colors.success} />
              <Text style={[styles.rsvpBtnText, { color: myRSVP === "yes" ? "#fff" : Colors.success }]}>Attending</Text>
            </Pressable>
            <Pressable
              style={[styles.rsvpBtn, myRSVP === "no" && styles.rsvpBtnActiveRed]}
              onPress={() => handleRSVP(false)}
            >
              <Ionicons name="close" size={14} color={myRSVP === "no" ? "#fff" : Colors.error} />
              <Text style={[styles.rsvpBtnText, { color: myRSVP === "no" ? "#fff" : Colors.error }]}>Not Attending</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function AddNoticeModal({ type, user, onClose, onAddAnnouncement, onAddMeeting }: any) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [category, setCategory] = useState<string>("general");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("Clubhouse");
  const [meetingType, setMeetingType] = useState<string>("General");

  async function handleSubmit() {
    if (!title.trim()) return;
    if (type === "announcements") {
      await onAddAnnouncement({ title, content, priority, category, createdBy: user?.name || "Admin" });
    } else {
      await onAddMeeting({ title, description: content, date, time, location, type: meetingType, agenda: [], rsvpYes: [], rsvpNo: [], createdBy: user?.name || "Admin" });
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{type === "announcements" ? "New Announcement" : "Schedule Meeting"}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput style={styles.formInput} placeholder="Enter title..." placeholderTextColor={Colors.textTertiary} value={title} onChangeText={setTitle} />
            </View>
            {type === "announcements" ? (
              <>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Priority</Text>
                  <View style={styles.optionRow}>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <Pressable key={p} style={[styles.optionBtn, priority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }]} onPress={() => setPriority(p)}>
                        <Text style={[styles.optionBtnText, priority === p && { color: "#fff" }]}>{p}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Category</Text>
                  <View style={styles.optionRow}>
                    {["general", "maintenance", "event", "emergency"].map((c) => (
                      <Pressable key={c} style={[styles.optionBtn, category === c && styles.optionBtnActive]} onPress={() => setCategory(c)}>
                        <Text style={[styles.optionBtnText, category === c && { color: "#fff" }]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput style={styles.formInput} placeholder="2026-03-25" placeholderTextColor={Colors.textTertiary} value={date} onChangeText={setDate} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Time (HH:MM)</Text>
                  <TextInput style={styles.formInput} placeholder="18:00" placeholderTextColor={Colors.textTertiary} value={time} onChangeText={setTime} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput style={styles.formInput} placeholder="Clubhouse" placeholderTextColor={Colors.textTertiary} value={location} onChangeText={setLocation} />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Type</Text>
                  <View style={styles.optionRow}>
                    {["AGM", "Emergency", "Committee", "General"].map((t) => (
                      <Pressable key={t} style={[styles.optionBtn, meetingType === t && styles.optionBtnActive]} onPress={() => setMeetingType(t)}>
                        <Text style={[styles.optionBtnText, meetingType === t && { color: "#fff" }]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.formInput, styles.formTextArea]} placeholder="Enter description..." placeholderTextColor={Colors.textTertiary} value={content} onChangeText={setContent} multiline numberOfLines={4} />
            </View>
          </ScrollView>
          <Pressable style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.88 : 1 }]} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyState({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={48} color={Colors.textLight} />
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

function getPriorityColor(p: string) {
  if (p === "urgent") return Colors.error;
  if (p === "high") return Colors.warning;
  if (p === "medium") return Colors.secondary;
  return Colors.primary;
}

function getCategoryIcon(c: string): any {
  if (c === "maintenance") return "construct-outline";
  if (c === "event") return "calendar-outline";
  if (c === "emergency") return "warning-outline";
  return "megaphone-outline";
}

function getMeetingTypeColor(t: string) {
  if (t === "AGM") return Colors.primary;
  if (t === "Emergency") return Colors.error;
  if (t === "Committee") return Colors.secondary;
  return Colors.warning;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDate2(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  tabBtnActive: { backgroundColor: "#fff" },
  tabBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  tabBtnTextActive: { color: Colors.secondaryDark, fontFamily: "Inter_600SemiBold" },
  list: { flex: 1 },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginHorizontal: 16, marginTop: 14, flexDirection: "row", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardPriorityBar: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 6 },
  cardHeader: { flexDirection: "row", gap: 6, alignItems: "center" },
  cardMeta: { flexDirection: "row", gap: 6, flex: 1 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cardText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardAuthor: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  meetingInfo: { gap: 6 },
  meetingInfoRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  meetingInfoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  agendaWrap: { backgroundColor: Colors.background, borderRadius: 10, padding: 12, gap: 6 },
  agendaTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 4 },
  agendaItem: { flexDirection: "row", gap: 8 },
  agendaNum: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.secondary, width: 20 },
  agendaText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  rsvpRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  rsvpLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  rsvpBtn: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border },
  rsvpBtnActiveGreen: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rsvpBtnActiveRed: { backgroundColor: Colors.error, borderColor: Colors.error },
  rsvpBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyStateText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  formField: { marginBottom: 18 },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  formTextArea: { height: 100, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
