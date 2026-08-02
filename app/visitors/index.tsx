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
import { useData, VisitorRequest } from "@/context/DataContext";
import { sendNotification } from "@/lib/notifications";
import Colors from "@/constants/colors";

type Filter = "all" | "pending" | "approved" | "rejected";

export default function VisitorsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { visitorRequests, updateVisitorRequestStatus, addVisitorRequest } = useData();
  const [filter, setFilter] = useState<Filter>("pending");
  const [approveTarget, setApproveTarget] = useState<VisitorRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VisitorRequest | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "secretary";
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const myRequests = isStaff
    ? visitorRequests
    : visitorRequests.filter((v) => v.flatNumber === user?.flatNumber);

  const filtered = myRequests.filter((v) => filter === "all" ? true : v.status === filter);

  const pendingCount = myRequests.filter((v) => v.status === "pending").length;
  const approvedCount = myRequests.filter((v) => v.status === "approved").length;
  const rejectedCount = myRequests.filter((v) => v.status === "rejected").length;

  async function handleApprove(req: VisitorRequest) {
    const passCode = await updateVisitorRequestStatus(req.id, "approved", user?.name);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sendNotification(
      "✅ Visitor Approved",
      `${req.visitorName} for Flat ${req.flatNumber} is approved. Gate Pass: ${passCode}`
    );
    setApproveTarget(null);
  }

  async function handleReject(req: VisitorRequest, reason: string) {
    await updateVisitorRequestStatus(req.id, "rejected", user?.name, reason);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await sendNotification(
      "❌ Visitor Denied",
      `${req.visitorName}'s visit to Flat ${req.flatNumber} has been denied.`
    );
    setRejectTarget(null);
  }

  async function handleNewRequest(form: Omit<VisitorRequest, "id" | "requestedAt" | "status">) {
    await addVisitorRequest(form);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sendNotification(
      "🔔 Visitor Request Submitted",
      `Your request for ${form.visitorName} on ${form.expectedDate} is pending approval.`
    );
    setShowNewForm(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient
        colors={["#7C3AED", "#4F46E5"]}
        style={[styles.header, { paddingTop: topPadding + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Visitor Approvals</Text>
          {!isStaff && (
            <Pressable style={styles.addBtn} onPress={() => setShowNewForm(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          )}
          {isStaff && <View style={{ width: 36 }} />}
        </View>

        <View style={styles.statsRow}>
          <StatPill label="Pending" value={pendingCount} color="#FCD34D" />
          <StatPill label="Approved" value={approvedCount} color="#86EFAC" />
          <StatPill label="Denied" value={rejectedCount} color="#FCA5A5" />
        </View>

        {pendingCount > 0 && isStaff && (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={15} color="#FCD34D" />
            <Text style={styles.alertText}>{pendingCount} visitor request{pendingCount > 1 ? "s" : ""} awaiting approval</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && ` (${myRequests.filter((v) => v.status === f).length})`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-clock-outline" size={52} color={Colors.textLight} />
            <Text style={styles.emptyText}>No {filter === "all" ? "" : filter} visitor requests</Text>
            {!isStaff && (
              <Pressable style={styles.emptyAddBtn} onPress={() => setShowNewForm(true)}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.emptyAddText}>Request Visitor Entry</Text>
              </Pressable>
            )}
          </View>
        )}

        {filtered.map((req) => (
          <VisitorCard
            key={req.id}
            req={req}
            isStaff={isStaff}
            onApprove={() => setApproveTarget(req)}
            onReject={() => setRejectTarget(req)}
          />
        ))}
      </ScrollView>

      {!isStaff && (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => setShowNewForm(true)}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      )}

      {approveTarget && (
        <ApproveModal
          req={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={() => handleApprove(approveTarget)}
        />
      )}

      {rejectTarget && (
        <RejectModal
          req={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onReject={(reason) => handleReject(rejectTarget, reason)}
        />
      )}

      {showNewForm && (
        <NewVisitorModal
          flatNumber={user?.flatNumber ?? ""}
          residentName={user?.name ?? ""}
          onClose={() => setShowNewForm(false)}
          onSubmit={handleNewRequest}
        />
      )}
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: color + "20" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function VisitorCard({ req, isStaff, onApprove, onReject }: {
  req: VisitorRequest;
  isStaff: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusColor = req.status === "approved" ? Colors.success : req.status === "rejected" ? Colors.error : Colors.warning;
  const statusBg = req.status === "approved" ? Colors.successSoft : req.status === "rejected" ? Colors.errorSoft : Colors.warningSoft;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.visitorAvatar, { backgroundColor: statusColor + "18" }]}>
          <MaterialCommunityIcons name="account" size={26} color={statusColor} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.visitorName}>{req.visitorName}</Text>
          <Text style={styles.visitorPhone}>{req.visitorPhone}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{req.status}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <MetaRow icon="home-outline" text={`Flat ${req.flatNumber} · ${req.residentName}`} />
        <MetaRow icon="information-circle-outline" text={req.purpose} />
        <MetaRow icon="calendar-outline" text={`${req.expectedDate} at ${req.expectedTime}`} />
        {req.vehicleNumber && <MetaRow icon="car-outline" text={req.vehicleNumber} />}
      </View>

      {req.status === "approved" && req.gatePassCode && (
        <View style={styles.passCodeBanner}>
          <MaterialCommunityIcons name="qrcode-scan" size={18} color="#7C3AED" />
          <Text style={styles.passCodeText}>Gate Pass: </Text>
          <Text style={styles.passCode}>{req.gatePassCode}</Text>
          <Text style={styles.passCodeNote}> · Auto-generated</Text>
        </View>
      )}

      {req.status === "rejected" && req.rejectionReason && (
        <View style={styles.rejectionBanner}>
          <Ionicons name="close-circle-outline" size={15} color={Colors.error} />
          <Text style={styles.rejectionText} numberOfLines={2}>{req.rejectionReason}</Text>
        </View>
      )}

      {req.status === "approved" && req.approvedBy && (
        <View style={styles.approvalInfo}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.approvalInfoText}>Approved by {req.approvedBy}</Text>
        </View>
      )}

      {req.status === "pending" && isStaff && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={onApprove}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.rejectBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={onReject}
          >
            <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.rejectBtnText}>Deny</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MetaRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={Colors.textSecondary} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function ApproveModal({ req, onClose, onConfirm }: {
  req: VisitorRequest;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetIconWrap}>
          <View style={[styles.sheetIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="checkmark-circle" size={36} color={Colors.success} />
          </View>
          <Text style={styles.sheetTitle}>Approve Visitor</Text>
          <Text style={styles.sheetSubtitle}>
            {req.visitorName} for Flat {req.flatNumber}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <InfoRow icon="person-outline" label="Visitor" value={req.visitorName} />
          <InfoRow icon="call-outline" label="Phone" value={req.visitorPhone} />
          <InfoRow icon="home-outline" label="Flat" value={`${req.flatNumber} · ${req.residentName}`} />
          <InfoRow icon="information-circle-outline" label="Purpose" value={req.purpose} />
          <InfoRow icon="calendar-outline" label="Visit Date" value={`${req.expectedDate} at ${req.expectedTime}`} />
          {req.vehicleNumber && <InfoRow icon="car-outline" label="Vehicle" value={req.vehicleNumber} />}
        </View>

        <View style={styles.notificationNote}>
          <MaterialCommunityIcons name="qrcode-scan" size={16} color="#7C3AED" />
          <Text style={styles.notificationNoteText}>
            A Gate Pass will be auto-generated and a notification will be sent upon approval.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.confirmBtn, { backgroundColor: Colors.primary, opacity: pressed ? 0.88 : 1 }]}
          onPress={onConfirm}
          testID="confirm-approve-visitor"
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.confirmBtnText}>Approve & Generate Gate Pass</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function RejectModal({ req, onClose, onReject }: {
  req: VisitorRequest;
  onClose: () => void;
  onReject: (reason: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetIconWrap}>
          <View style={[styles.sheetIcon, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="close-circle" size={36} color={Colors.error} />
          </View>
          <Text style={styles.sheetTitle}>Deny Visitor</Text>
          <Text style={styles.sheetSubtitle}>{req.visitorName} · Flat {req.flatNumber}</Text>
        </View>
        <Text style={styles.formLabel}>Reason for denial *</Text>
        <TextInput
          style={[styles.formInput, { height: 100, textAlignVertical: "top" }]}
          placeholder="Briefly explain why this visitor is being denied entry..."
          placeholderTextColor={Colors.textTertiary}
          value={reason}
          onChangeText={setReason}
          multiline
        />
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, { backgroundColor: Colors.error, opacity: pressed ? 0.88 : 1 }]}
          onPress={() => { if (reason.trim()) onReject(reason.trim()); }}
          testID="confirm-deny-visitor"
        >
          <Ionicons name="close-circle" size={18} color="#fff" />
          <Text style={styles.confirmBtnText}>Deny Entry</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function NewVisitorModal({ flatNumber, residentName, onClose, onSubmit }: {
  flatNumber: string;
  residentName: string;
  onClose: () => void;
  onSubmit: (v: Omit<VisitorRequest, "id" | "requestedAt" | "status">) => void;
}) {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    visitorName: "",
    visitorPhone: "",
    purpose: "",
    expectedDate: today,
    expectedTime: "10:00",
    vehicleNumber: "",
  });

  function update(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function submit() {
    if (!form.visitorName.trim() || !form.visitorPhone.trim() || !form.purpose.trim()) return;
    onSubmit({
      flatNumber,
      residentName,
      visitorName: form.visitorName,
      visitorPhone: form.visitorPhone,
      purpose: form.purpose,
      expectedDate: form.expectedDate,
      expectedTime: form.expectedTime,
      vehicleNumber: form.vehicleNumber || undefined,
    });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24, flex: 1 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Request Visitor Entry</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Visitor Name *" placeholder="Full name" value={form.visitorName} onChange={(v) => update("visitorName", v)} />
            <Field label="Visitor Phone *" placeholder="+91 98765 43210" value={form.visitorPhone} onChange={(v) => update("visitorPhone", v)} keyboardType="phone-pad" />
            <Field label="Purpose *" placeholder="e.g. Family visit, Plumber, Delivery" value={form.purpose} onChange={(v) => update("purpose", v)} />
            <Field label="Expected Date *" placeholder="YYYY-MM-DD" value={form.expectedDate} onChange={(v) => update("expectedDate", v)} />
            <Field label="Expected Time *" placeholder="10:00" value={form.expectedTime} onChange={(v) => update("expectedTime", v)} />
            <Field label="Vehicle Number (optional)" placeholder="e.g. MH-01-AB-1234" value={form.vehicleNumber} onChange={(v) => update("vehicleNumber", v)} />
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.confirmBtn, { backgroundColor: "#7C3AED", opacity: pressed ? 0.88 : 1, marginTop: 12 }]}
            onPress={submit}
          >
            <MaterialCommunityIcons name="account-check" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>Submit Request</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, placeholder, value, onChange, keyboardType = "default" }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 10 },
  statPill: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", gap: 2 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  alertBanner: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "rgba(252,211,77,0.15)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(252,211,77,0.3)" },
  alertText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FCD34D", flex: 1 },
  filterScroll: { flexGrow: 0 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  filterChipTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary, textTransform: "capitalize" },
  emptyAddBtn: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4 },
  emptyAddText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  card: { backgroundColor: Colors.card, borderRadius: 18, marginBottom: 12, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 },
  visitorAvatar: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  visitorName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  visitorPhone: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statusChip: { flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  cardMeta: { gap: 6, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, flex: 1 },
  passCodeBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F5F3FF", borderRadius: 10, padding: 10, marginTop: 2, borderWidth: 1, borderColor: "#DDD6FE" },
  passCodeText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  passCode: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#7C3AED" },
  passCodeNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9333EA" },
  rejectionBanner: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: Colors.errorSoft, borderRadius: 10, padding: 10, marginTop: 2 },
  rejectionText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.error, lineHeight: 16 },
  approvalInfo: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  approvalInfoText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.success },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  approveBtn: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, paddingVertical: 11, borderRadius: 12 },
  approveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  rejectBtn: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.errorSoft, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.error },
  fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  sheet: { backgroundColor: Colors.card, borderRadius: 20, padding: 24 },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetIconWrap: { alignItems: "center", marginBottom: 20, gap: 8 },
  sheetIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  sheetSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  sheetHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  infoBox: { backgroundColor: Colors.background, borderRadius: 14, padding: 14, gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary, width: 60 },
  infoValue: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  notificationNote: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#F5F3FF", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#DDD6FE" },
  notificationNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#7C3AED", lineHeight: 18 },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  confirmBtn: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 16 },
  confirmBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { marginTop: 10, backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
});
