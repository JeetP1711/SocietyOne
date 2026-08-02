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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, SocietyRegistration, SocietyStatus } from "@/context/DataContext";
import Colors from "@/constants/colors";

type Filter = "all" | "pending" | "approved" | "rejected";

export default function SocietiesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { societies, updateSocietyStatus } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedSociety, setSelectedSociety] = useState<SocietyRegistration | null>(null);
  const [rejectModal, setRejectModal] = useState<SocietyRegistration | null>(null);
  const [approveModal, setApproveModal] = useState<SocietyRegistration | null>(null);

  const filtered = societies.filter((s) => filter === "all" ? true : s.status === filter);
  const totalApproved = societies.filter((s) => s.status === "approved").length;
  const totalPending = societies.filter((s) => s.status === "pending").length;
  const totalRejected = societies.filter((s) => s.status === "rejected").length;
  const totalFlats = societies.filter((s) => s.status === "approved").reduce((sum, s) => sum + s.totalFlats, 0);

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  function handleApprove(society: SocietyRegistration) {
    setApproveModal(society);
    setSelectedSociety(null);
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A"]}
        style={[styles.header, { paddingTop: topPadding + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Society Registry</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.platformStats}>
          <PlatformStat label="Approved" value={totalApproved} color="#86EFAC" icon="checkmark-circle" />
          <PlatformStat label="Pending" value={totalPending} color="#FCD34D" icon="time" />
          <PlatformStat label="Rejected" value={totalRejected} color="#FCA5A5" icon="close-circle" />
          <PlatformStat label="Total Flats" value={totalFlats} color="#93C5FD" icon="home" />
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            {f === "pending" && totalPending > 0 && (
              <View style={styles.filterDot} />
            )}
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && ` (${societies.filter((s) => s.status === f).length})`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {totalPending > 0 && filter !== "approved" && filter !== "rejected" && (
          <View style={styles.pendingAlert}>
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
            <Text style={styles.pendingAlertText}>
              {totalPending} societ{totalPending > 1 ? "ies" : "y"} awaiting your approval
            </Text>
          </View>
        )}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="office-building-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No societies found</Text>
          </View>
        )}

        {filtered.map((s) => (
          <SocietyCard
            key={s.id}
            item={s}
            onPress={() => setSelectedSociety(s)}
            onApprove={() => handleApprove(s)}
            onReject={() => setRejectModal(s)}
          />
        ))}
      </ScrollView>

      {selectedSociety && (
        <SocietyDetailModal
          society={selectedSociety}
          onClose={() => setSelectedSociety(null)}
          onApprove={() => handleApprove(selectedSociety)}
          onReject={() => { setSelectedSociety(null); setRejectModal(selectedSociety); }}
        />
      )}

      {approveModal && (
        <ApproveModal
          society={approveModal}
          onClose={() => setApproveModal(null)}
          onConfirm={async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await updateSocietyStatus(approveModal.id, "approved", user?.name ?? "Admin");
            setApproveModal(null);
          }}
        />
      )}

      {rejectModal && (
        <RejectModal
          society={rejectModal}
          onClose={() => setRejectModal(null)}
          onReject={async (reason) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await updateSocietyStatus(rejectModal.id, "rejected", user?.name ?? "Admin", reason);
            setRejectModal(null);
          }}
        />
      )}
    </View>
  );
}

function PlatformStat({ label, value, color, icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <View style={styles.platformStatItem}>
      <View style={[styles.platformStatIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.platformStatValue, { color }]}>{value}</Text>
      <Text style={styles.platformStatLabel}>{label}</Text>
    </View>
  );
}

function SocietyCard({ item, onPress, onApprove, onReject }: {
  item: SocietyRegistration;
  onPress: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusColor = getStatusColor(item.status);
  const statusBg = getStatusBg(item.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.societyAvatar, { backgroundColor: getAvatarBg(item.status) }]}>
          <MaterialCommunityIcons name="office-building" size={24} color={statusColor} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardAddress}>{item.city}, {item.state} — {item.pincode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <StatPill icon="home-outline" value={`${item.totalFlats} Flats`} />
        <StatPill icon="layers-outline" value={item.wings} />
        <StatPill icon="calendar-outline" value={String(item.establishedYear)} />
      </View>

      <View style={styles.secretaryRow}>
        <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
        <Text style={styles.secretaryText}>{item.secretaryName} — {item.secretaryPhone}</Text>
      </View>

      <View style={styles.regRow}>
        <Ionicons name="document-text-outline" size={13} color={Colors.textSecondary} />
        <Text style={styles.regText}>{item.registrationNumber}</Text>
        <Text style={styles.appliedDate}>Applied: {item.appliedDate}</Text>
      </View>

      {item.status === "pending" && (
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={(e) => { e.stopPropagation(); onApprove(); }}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.rejectBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={(e) => { e.stopPropagation(); onReject(); }}
          >
            <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </Pressable>
        </View>
      )}

      {item.status === "approved" && (
        <View style={styles.approvedInfo}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.approvedInfoText}>
            Approved by {item.approvedBy} on {item.approvedDate}
          </Text>
        </View>
      )}

      {item.status === "rejected" && (
        <View style={styles.rejectedInfo}>
          <Ionicons name="close-circle" size={14} color={Colors.error} />
          <Text style={styles.rejectedInfoText} numberOfLines={2}>
            {item.rejectionReason}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function StatPill({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={12} color={Colors.textSecondary} />
      <Text style={styles.statPillText}>{value}</Text>
    </View>
  );
}

function SocietyDetailModal({ society, onClose, onApprove, onReject }: {
  society: SocietyRegistration;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const insets = useSafeAreaInsets();
  const statusColor = getStatusColor(society.status);
  const statusBg = getStatusBg(society.status);

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.detailModal, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <View style={styles.detailHeaderRow}>
          <Text style={styles.detailTitle}>Society Details</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.detailStatusCard, { backgroundColor: statusBg, borderColor: statusColor + "40" }]}>
            <MaterialCommunityIcons name="office-building" size={36} color={statusColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailSocietyName, { color: statusColor }]}>{society.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "25", alignSelf: "flex-start", marginTop: 4 }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{(society.status ?? "pending").toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Society Information</Text>
            <DetailRow label="Registration No." value={society.registrationNumber} />
            <DetailRow label="Established" value={String(society.establishedYear)} />
            <DetailRow label="Total Flats" value={`${society.totalFlats} flats`} />
            <DetailRow label="Wings / Blocks" value={society.wings} />
            <DetailRow label="Applied Date" value={society.appliedDate} />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Address</Text>
            <DetailRow label="Street" value={society.address} />
            <DetailRow label="City" value={society.city} />
            <DetailRow label="State" value={society.state} />
            <DetailRow label="Pincode" value={society.pincode} />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Secretary / Contact Person</Text>
            <DetailRow label="Name" value={society.secretaryName} />
            <DetailRow label="Phone" value={society.secretaryPhone} />
            <DetailRow label="Email" value={society.secretaryEmail} />
          </View>

          {society.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{society.notes}</Text>
            </View>
          )}

          {society.status === "approved" && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Approval Info</Text>
              <DetailRow label="Approved By" value={society.approvedBy ?? "-"} />
              <DetailRow label="Approved On" value={society.approvedDate ?? "-"} />
            </View>
          )}

          {society.status === "rejected" && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Rejection Info</Text>
              <DetailRow label="Rejected By" value={society.rejectedBy ?? "-"} />
              <DetailRow label="Rejected On" value={society.rejectedDate ?? "-"} />
              <DetailRow label="Reason" value={society.rejectionReason ?? "-"} />
            </View>
          )}
        </ScrollView>

        {society.status === "pending" && (
          <View style={styles.detailActions}>
            <Pressable
              style={({ pressed }) => [styles.approveBtn, { flex: 1, justifyContent: "center", opacity: pressed ? 0.8 : 1 }]}
              onPress={onApprove}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.rejectBtn, { flex: 1, justifyContent: "center", opacity: pressed ? 0.8 : 1 }]}
              onPress={onReject}
            >
              <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ApproveModal({ society, onClose, onConfirm }: {
  society: SocietyRegistration;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.rejectModalContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <View style={styles.rejectModalHeader}>
          <View style={[styles.rejectIconWrap, { backgroundColor: Colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
          </View>
          <Text style={styles.rejectModalTitle}>Approve Society</Text>
          <Text style={styles.rejectModalSubtitle}>{society.name}</Text>
        </View>
        <View style={styles.approveInfoBox}>
          <View style={styles.approveInfoRow}>
            <Ionicons name="business-outline" size={16} color={Colors.success} />
            <Text style={styles.approveInfoText}>{society.totalFlats} flats · {society.wings}</Text>
          </View>
          <View style={styles.approveInfoRow}>
            <Ionicons name="location-outline" size={16} color={Colors.success} />
            <Text style={styles.approveInfoText}>{society.city}, {society.state} — {society.pincode}</Text>
          </View>
          <View style={styles.approveInfoRow}>
            <Ionicons name="document-text-outline" size={16} color={Colors.success} />
            <Text style={styles.approveInfoText}>{society.registrationNumber}</Text>
          </View>
          <View style={styles.approveInfoRow}>
            <Ionicons name="person-outline" size={16} color={Colors.success} />
            <Text style={styles.approveInfoText}>{society.secretaryName} · {society.secretaryPhone}</Text>
          </View>
        </View>
        <Text style={styles.approveNote}>
          Approving this society will allow its members and secretary to use the SocietyOne platform.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.confirmApproveBtn, { opacity: pressed ? 0.88 : 1 }]}
          onPress={onConfirm}
          testID="confirm-approve-btn"
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.confirmRejectBtnText}>Confirm Approval</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function RejectModal({ society, onClose, onReject }: {
  society: SocietyRegistration;
  onClose: () => void;
  onReject: (reason: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.rejectModalContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <View style={styles.rejectModalHeader}>
          <View style={styles.rejectIconWrap}>
            <Ionicons name="close-circle" size={32} color={Colors.error} />
          </View>
          <Text style={styles.rejectModalTitle}>Reject Society</Text>
          <Text style={styles.rejectModalSubtitle}>{society.name}</Text>
        </View>
        <Text style={styles.formLabel}>Reason for Rejection *</Text>
        <TextInput
          style={[styles.formInput, { height: 120, textAlignVertical: "top" }]}
          placeholder="Provide a clear reason for rejection. This will be visible to the applicant."
          placeholderTextColor={Colors.textTertiary}
          value={reason}
          onChangeText={setReason}
          multiline
        />
        <Pressable
          style={({ pressed }) => [styles.confirmRejectBtn, { opacity: pressed ? 0.88 : 1 }]}
          onPress={() => { if (reason.trim()) onReject(reason.trim()); }}
        >
          <Ionicons name="close-circle" size={18} color="#fff" />
          <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function getStatusColor(s: string) {
  if (s === "approved") return Colors.success;
  if (s === "rejected") return Colors.error;
  return Colors.warning;
}

function getStatusBg(s: string) {
  if (s === "approved") return Colors.successSoft;
  if (s === "rejected") return Colors.errorSoft;
  return Colors.warningSoft;
}

function getAvatarBg(s: string) {
  if (s === "approved") return "#DCFCE7";
  if (s === "rejected") return "#FEE2E2";
  return "#FEF9C3";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  platformStats: { flexDirection: "row", gap: 10 },
  platformStatItem: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  platformStatIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  platformStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  platformStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", textAlign: "center" },
  filterScroll: { flexGrow: 0 },
  filterBtn: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  filterBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  filterBtnTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  filterDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.warning },
  pendingAlert: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: Colors.warningSoft, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#FDE68A" },
  pendingAlertText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.warning },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  card: { backgroundColor: Colors.card, borderRadius: 18, marginBottom: 12, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 },
  societyAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  cardAddress: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  cardStats: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  statPill: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statPillText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  secretaryRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 6 },
  secretaryText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  regRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  regText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.secondary, flex: 1 },
  appliedDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  actionButtons: { flexDirection: "row", gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  approveBtn: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  approveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  rejectBtn: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: Colors.errorSoft, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.error },
  approvedInfo: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  approvedInfoText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.success },
  rejectedInfo: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  rejectedInfoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.error, lineHeight: 16 },
  detailModal: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  detailHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  detailStatusCard: { flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  detailSocietyName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  detailSection: { marginBottom: 20 },
  detailSectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingBottom: 6 },
  detailRow: { flexDirection: "row", marginBottom: 10 },
  detailLabel: { width: 110, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  detailValue: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20 },
  detailActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  rejectModalContainer: { flex: 1, backgroundColor: Colors.card, padding: 24 },
  rejectModalHeader: { alignItems: "center", marginBottom: 24, gap: 8 },
  rejectIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.errorSoft, alignItems: "center", justifyContent: "center" },
  rejectModalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  rejectModalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  approveInfoBox: { backgroundColor: Colors.successSoft, borderRadius: 14, padding: 14, gap: 10, marginBottom: 16, borderWidth: 1, borderColor: "#BBF7D0" },
  approveInfoRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  approveInfoText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.success, flex: 1 },
  approveNote: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  confirmApproveBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 12 },
  confirmRejectBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.error, borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  confirmRejectBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border, marginTop: 10 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
});
