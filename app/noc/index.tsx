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
import { useData, NOCRequest, NOCStatus } from "@/context/DataContext";
import Colors from "@/constants/colors";

export default function NOCScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { nocRequests, addNOCRequest, updateNOCStatus } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedNOC, setSelectedNOC] = useState<NOCRequest | null>(null);

  const canManage = user?.role === "admin" || user?.role === "secretary";
  const myNOCs = canManage
    ? nocRequests
    : nocRequests.filter((n) => n.flatNumber === user?.flatNumber || n.tenantName === user?.name);

  const pending = myNOCs.filter((n) => n.status === "pending").length;
  const approved = myNOCs.filter((n) => n.status === "approved").length;

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1E293B", "#475569"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>NOC Management</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <StatChip label="Total" value={myNOCs.length} color="#fff" />
          <StatChip label="Pending" value={pending} color="#FCD34D" />
          <StatChip label="Approved" value={approved} color="#86EFAC" />
        </View>
      </LinearGradient>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {myNOCs.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-certificate" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No NOC requests found</Text>
            <Pressable style={styles.createBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.createBtnText}>New Request</Text>
            </Pressable>
          </View>
        )}

        {pending > 0 && canManage && (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
            <Text style={styles.alertText}>{pending} NOC request{pending > 1 ? "s" : ""} pending review</Text>
          </View>
        )}

        {myNOCs.map((n) => (
          <NOCCard
            key={n.id}
            item={n}
            canManage={canManage}
            onPress={() => setSelectedNOC(n)}
            onApprove={canManage ? async () => {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await updateNOCStatus(n.id, "approved", user?.name, "NOC approved.");
            } : undefined}
            onReject={canManage ? async () => {
              Alert.alert("Reject NOC", "Are you sure you want to reject this NOC?", [
                { text: "Cancel", style: "cancel" },
                { text: "Reject", style: "destructive", onPress: async () => {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  await updateNOCStatus(n.id, "rejected", user?.name, "NOC rejected.");
                }},
              ]);
            } : undefined}
          />
        ))}
      </ScrollView>

      {showAdd && (
        <AddNOCModal
          user={user}
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addNOCRequest(data);
            setShowAdd(false);
          }}
        />
      )}

      {selectedNOC && (
        <NOCDetailModal noc={selectedNOC} onClose={() => setSelectedNOC(null)} />
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

function NOCCard({ item, canManage, onPress, onApprove, onReject }: any) {
  const statusColor = getStatusColor(item.status);
  const statusBg = getStatusBg(item.status);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.flatChip}>
          <Ionicons name="home" size={14} color={Colors.primary} />
          <Text style={styles.flatText}>{item.flatNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.tenantName}</Text>
      <Text style={styles.cardSubtitle}>Owner: {item.ownerName}</Text>
      <View style={styles.cardMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.tenantPhone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.validFrom} → {item.validTill}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.purpose}</Text>
        </View>
      </View>
      {item.status === "pending" && canManage && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={(e) => { e.stopPropagation(); onApprove?.(); }}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.rejectBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={(e) => { e.stopPropagation(); onReject?.(); }}
          >
            <Ionicons name="close" size={16} color={Colors.error} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </Pressable>
        </View>
      )}
      {item.status === "approved" && item.approvedBy && (
        <View style={styles.approvedInfo}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.approvedInfoText}>Approved by {item.approvedBy} on {item.approvedAt}</Text>
        </View>
      )}
    </Pressable>
  );
}

function NOCDetailModal({ noc, onClose }: { noc: NOCRequest; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const statusColor = getStatusColor(noc.status);
  const statusBg = getStatusBg(noc.status);

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.detailModal, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <View style={styles.detailHeaderRow}>
          <Text style={styles.detailTitle}>NOC Details</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={[styles.nocStatusCard, { backgroundColor: statusBg, borderColor: statusColor + "40" }]}>
          <MaterialCommunityIcons name="file-certificate" size={36} color={statusColor} />
          <View>
            <Text style={[styles.nocStatusLabel, { color: statusColor }]}>{(noc.status ?? "pending").toUpperCase()}</Text>
            <Text style={styles.nocStatusSub}>{noc.flatNumber} • {noc.tenantName}</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailGrid}>
            <DetailItem label="Flat Number" value={noc.flatNumber} />
            <DetailItem label="Owner Name" value={noc.ownerName} />
            <DetailItem label="Tenant Name" value={noc.tenantName} />
            <DetailItem label="Tenant Phone" value={noc.tenantPhone} />
            <DetailItem label="Tenant Email" value={noc.tenantEmail} />
            <DetailItem label="Purpose" value={noc.purpose} />
            <DetailItem label="Valid From" value={noc.validFrom} />
            <DetailItem label="Valid Till" value={noc.validTill} />
            <DetailItem label="Request Date" value={noc.requestDate} />
            {noc.approvedBy && <DetailItem label="Approved By" value={noc.approvedBy} />}
            {noc.approvedAt && <DetailItem label="Approved On" value={noc.approvedAt} />}
            {noc.remarks && <DetailItem label="Remarks" value={noc.remarks} />}
          </View>
        </ScrollView>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function AddNOCModal({ user, onClose, onAdd }: any) {
  const insets = useSafeAreaInsets();
  const [flatNumber, setFlatNumber] = useState(user?.flatNumber ?? "");
  const [ownerName, setOwnerName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [purpose, setPurpose] = useState("Residential rental");
  const [validFrom, setValidFrom] = useState("");
  const [validTill, setValidTill] = useState("");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>New NOC Request</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14 }}>
              <FormField label="Flat Number" value={flatNumber} onChange={setFlatNumber} placeholder="A-101" />
              <FormField label="Owner Name" value={ownerName} onChange={setOwnerName} placeholder="Full owner name" />
              <FormField label="Tenant Name" value={tenantName} onChange={setTenantName} placeholder="Full tenant name" />
              <FormField label="Tenant Phone" value={tenantPhone} onChange={setTenantPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              <FormField label="Tenant Email" value={tenantEmail} onChange={setTenantEmail} placeholder="tenant@email.com" keyboardType="email-address" />
              <FormField label="Purpose" value={purpose} onChange={setPurpose} placeholder="Residential rental" />
              <FormField label="Valid From (YYYY-MM-DD)" value={validFrom} onChange={setValidFrom} placeholder="2026-04-01" />
              <FormField label="Valid Till (YYYY-MM-DD)" value={validTill} onChange={setValidTill} placeholder="2028-03-31" />
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => {
              if (flatNumber && tenantName && ownerName) {
                onAdd({ flatNumber, ownerName, tenantName, tenantPhone, tenantEmail, purpose, validFrom, validTill });
              }
            }}
          >
            <Text style={styles.submitBtnText}>Submit NOC Request</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({ label, value, onChange, placeholder, keyboardType = "default" }: any) {
  return (
    <View>
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
  alertBanner: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: Colors.warningSoft, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#FDE68A" },
  alertText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.warning },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  createBtn: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#475569", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  createBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  flatChip: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: Colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  flatText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.primary },
  statusBadge: { flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  cardSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 10 },
  cardMeta: { gap: 6 },
  metaRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  approveBtn: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10 },
  approveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  rejectBtn: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: Colors.errorSoft, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#FECACA" },
  rejectBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.error },
  approvedInfo: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  approvedInfoText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.success },
  detailModal: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  detailHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  nocStatusCard: { flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  nocStatusLabel: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  nocStatusSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  detailGrid: { gap: 12 },
  detailItem: { borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingBottom: 12 },
  detailLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  detailValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 3 },
  closeBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 16 },
  closeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  submitBtn: { backgroundColor: "#475569", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
