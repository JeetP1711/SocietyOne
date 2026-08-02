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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, Complaint, ComplaintStatus } from "@/context/DataContext";
import Colors from "@/constants/colors";

type Filter = "all" | "open" | "in-progress" | "resolved" | "closed";

export default function ComplaintsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { complaints, addComplaint, updateComplaintStatus } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const canManage = user?.role === "admin" || user?.role === "secretary";
  const myComplaints = canManage
    ? complaints
    : complaints.filter((c) => c.flatNumber === user?.flatNumber);

  const filtered = myComplaints.filter((c) => filter === "all" ? true : c.status === filter);

  const counts = {
    open: myComplaints.filter((c) => c.status === "open").length,
    "in-progress": myComplaints.filter((c) => c.status === "in-progress").length,
    resolved: myComplaints.filter((c) => c.status === "resolved").length,
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#7F1D1D", "#DC2626"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Complaints</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <StatChip label="Open" value={counts.open} color="#FCA5A5" />
          <StatChip label="In Progress" value={counts["in-progress"]} color="#FCD34D" />
          <StatChip label="Resolved" value={counts.resolved} color="#86EFAC" />
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {(["all", "open", "in-progress", "resolved", "closed"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No complaints here</Text>
          </View>
        )}
        {filtered.map((c) => (
          <ComplaintCard
            key={c.id}
            item={c}
            canManage={canManage}
            onPress={() => setSelectedComplaint(c)}
          />
        ))}
      </ScrollView>

      {showAdd && (
        <AddComplaintModal
          user={user}
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addComplaint({
              ...data,
              flatNumber: user?.flatNumber ?? "Admin",
              residentName: user?.name ?? "Admin",
            });
            setShowAdd(false);
          }}
        />
      )}

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          canManage={canManage}
          user={user}
          onClose={() => setSelectedComplaint(null)}
          onUpdateStatus={async (status, comment) => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await updateComplaintStatus(selectedComplaint.id, status, comment, user?.name);
            setSelectedComplaint(null);
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

function ComplaintCard({ item, canManage, onPress }: { item: Complaint; canManage: boolean; onPress: () => void }) {
  const statusColor = getStatusColor(item.status);
  const priorityColor = getPriorityColor(item.priority);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketText}>{item.ticketNo}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: getPriorityBg(item.priority) }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>{item.priority}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusBg(item.status) }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>{(item.status ?? "open").replace("-", " ")}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name={getCategoryIcon(item.category) as any} size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="home-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.flatNumber}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      {item.assignedTo && (
        <View style={styles.assignedRow}>
          <Ionicons name="person-outline" size={13} color={Colors.primary} />
          <Text style={styles.assignedText}>Assigned to: {item.assignedTo}</Text>
        </View>
      )}
    </Pressable>
  );
}

function ComplaintDetailModal({ complaint, canManage, user, onClose, onUpdateStatus }: any) {
  const insets = useSafeAreaInsets();
  const [comment, setComment] = useState("");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.detailModal, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.modalHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTicket}>{complaint.ticketNo}</Text>
              <Text style={styles.detailTitle}>{complaint.title}</Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.detailBadges}>
            <View style={[styles.badge, { backgroundColor: getStatusBg(complaint.status) }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(complaint.status) }]}>{(complaint.status ?? "open").replace("-", " ")}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getPriorityBg(complaint.priority) }]}>
              <Text style={[styles.badgeText, { color: getPriorityColor(complaint.priority) }]}>{complaint.priority} priority</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{complaint.category}</Text>
            </View>
          </View>
          <Text style={styles.detailDesc}>{complaint.description}</Text>
          <View style={styles.detailMeta}>
            <DetailRow label="Raised by" value={`${complaint.residentName} (${complaint.flatNumber})`} />
            <DetailRow label="Created" value={formatDate(complaint.createdAt)} />
            {complaint.assignedTo && <DetailRow label="Assigned to" value={complaint.assignedTo} />}
            {complaint.resolvedAt && <DetailRow label="Resolved on" value={formatDate(complaint.resolvedAt)} />}
          </View>
          {complaint.comments.length > 0 && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Updates</Text>
              {complaint.comments.map((c: any, i: number) => (
                <View key={i} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentBy}>{c.by}</Text>
                    <Text style={styles.commentAt}>{formatDate(c.at)}</Text>
                  </View>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              ))}
            </View>
          )}
          {canManage && complaint.status !== "resolved" && complaint.status !== "closed" && (
            <View style={styles.updateSection}>
              <Text style={styles.updateTitle}>Update Status</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textTertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
              />
              <View style={styles.statusBtnRow}>
                {(["in-progress", "resolved", "closed"] as ComplaintStatus[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.statusActionBtn, { backgroundColor: getStatusBg(s) }]}
                    onPress={() => onUpdateStatus(s, comment)}
                  >
                    <Text style={[styles.statusActionText, { color: getStatusColor(s) }]}>
                      {s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function AddComplaintModal({ user, onClose, onAdd }: any) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("plumbing");
  const [priority, setPriority] = useState<string>("medium");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Raise Complaint</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14 }}>
              <View>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput style={styles.formInput} placeholder="Brief issue title" placeholderTextColor={Colors.textTertiary} value={title} onChangeText={setTitle} />
              </View>
              <View>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.optionGrid}>
                  {["plumbing", "electrical", "civil", "security", "cleanliness", "other"].map((c) => (
                    <Pressable key={c} style={[styles.optionBtn, category === c && styles.optionBtnActive]} onPress={() => setCategory(c)}>
                      <MaterialCommunityIcons name={getCategoryIcon(c) as any} size={16} color={category === c ? "#fff" : Colors.textSecondary} />
                      <Text style={[styles.optionBtnText, category === c && { color: "#fff" }]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.optionRow}>
                  {(["low", "medium", "high"] as const).map((p) => (
                    <Pressable key={p} style={[styles.optionBtn, priority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }]} onPress={() => setPriority(p)}>
                      <Text style={[styles.optionBtnText, priority === p && { color: "#fff" }]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput style={[styles.formInput, { height: 100, textAlignVertical: "top" }]} placeholder="Describe the issue in detail..." placeholderTextColor={Colors.textTertiary} value={description} onChangeText={setDescription} multiline />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => { if (title && description) onAdd({ title, description, category, priority }); }}
          >
            <Text style={styles.submitBtnText}>Submit Complaint</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStatusColor(s: string) {
  if (s === "open") return Colors.error;
  if (s === "in-progress") return Colors.warning;
  if (s === "resolved") return Colors.success;
  return Colors.textSecondary;
}

function getStatusBg(s: string) {
  if (s === "open") return Colors.errorSoft;
  if (s === "in-progress") return Colors.warningSoft;
  if (s === "resolved") return Colors.successSoft;
  return Colors.divider;
}

function getPriorityColor(p: string) {
  if (p === "high") return Colors.error;
  if (p === "medium") return Colors.warning;
  return Colors.primary;
}

function getPriorityBg(p: string) {
  if (p === "high") return Colors.errorSoft;
  if (p === "medium") return Colors.warningSoft;
  return Colors.primarySoft;
}

function getCategoryIcon(c: string) {
  if (c === "plumbing") return "pipe-leak";
  if (c === "electrical") return "flash";
  if (c === "civil") return "hammer-screwdriver";
  if (c === "security") return "shield-alert";
  if (c === "cleanliness") return "broom";
  return "alert-circle";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 24, justifyContent: "center" },
  statChip: { alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  filterScroll: { flexGrow: 0 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.error, borderColor: Colors.error },
  filterBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  filterBtnTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  ticketBadge: { backgroundColor: Colors.divider, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  ticketText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.textSecondary },
  badgeRow: { flexDirection: "row", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.divider },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  cardMeta: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", gap: 5, alignItems: "center" },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textTransform: "capitalize" },
  assignedRow: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  assignedText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  detailModal: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  detailTicket: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  detailTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text, marginTop: 4 },
  detailBadges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  detailDesc: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  detailMeta: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
  detailRow: { flexDirection: "row", gap: 8 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, width: 90 },
  detailValue: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  commentsSection: { marginBottom: 16 },
  commentsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 10 },
  commentItem: { backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  commentBy: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  commentAt: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  commentText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  updateSection: { marginBottom: 10 },
  updateTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 10 },
  commentInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text, height: 80, textAlignVertical: "top", marginBottom: 12 },
  statusBtnRow: { flexDirection: "row", gap: 8 },
  statusActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  statusActionText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionRow: { flexDirection: "row", gap: 8 },
  optionBtn: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  optionBtnActive: { backgroundColor: Colors.error, borderColor: Colors.error },
  optionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  submitBtn: { backgroundColor: Colors.error, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
