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
import Svg, { Rect, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, GatePass } from "@/context/DataContext";
import Colors from "@/constants/colors";

function QRCodeDisplay({ passCode, size = 100 }: { passCode: string; size?: number }) {
  const hash = passCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cellSize = size / 10;
  const pattern: boolean[][] = Array.from({ length: 10 }, (_, i) =>
    Array.from({ length: 10 }, (_, j) => {
      const v = (hash * (i + 1) * (j + 1) + i * 31 + j * 17) % 7;
      return v < 3;
    })
  );
  pattern[0][0] = pattern[0][1] = pattern[1][0] = pattern[1][1] = true;
  pattern[0][8] = pattern[0][9] = pattern[1][8] = pattern[1][9] = true;
  pattern[8][0] = pattern[8][1] = pattern[9][0] = pattern[9][1] = true;

  return (
    <Svg width={size} height={size}>
      <Rect width={size} height={size} fill="white" rx={4} />
      {pattern.map((row, i) =>
        row.map((cell, j) =>
          cell ? (
            <Rect
              key={`${i}-${j}`}
              x={j * cellSize + 1}
              y={i * cellSize + 1}
              width={cellSize - 1}
              height={cellSize - 1}
              fill="#1A1A1A"
              rx={1}
            />
          ) : null
        )
      )}
    </Svg>
  );
}

export default function GatePassScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { gatePasses, addGatePass } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);

  const canViewAll = user?.role === "admin" || user?.role === "secretary";
  const myPasses = gatePasses.filter((g) => canViewAll ? true : g.flatNumber === user?.flatNumber);
  const today = new Date().toISOString().split("T")[0];
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4C1D95", "#7C3AED"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Gate Pass</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <StatChip label="Active" value={myPasses.filter((p) => p.status === "active").length} color="#C4B5FD" />
          <StatChip label="Used" value={myPasses.filter((p) => p.status === "used").length} color="#A5B4FC" />
          <StatChip label="Total" value={myPasses.length} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {myPasses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="qrcode-scan" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No gate passes generated</Text>
            <Pressable style={styles.createPassBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.createPassText}>Create Pass</Text>
            </Pressable>
          </View>
        )}
        {myPasses.map((p) => (
          <Pressable
            key={p.id}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
            onPress={() => setSelectedPass(p)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.qrThumb}>
                <QRCodeDisplay passCode={p.passCode} size={64} />
              </View>
              <View style={styles.passInfo}>
                <Text style={styles.passCode}>{p.passCode}</Text>
                <Text style={styles.visitorName}>{p.visitorName}</Text>
                <Text style={styles.visitorPhone}>{p.visitorPhone}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(p.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>{p.status}</Text>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="home-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{p.flatNumber} — {p.residentName}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{p.purpose}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>Valid: {p.validFrom} to {p.validTill}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {selectedPass && (
        <PassDetailModal pass={selectedPass} onClose={() => setSelectedPass(null)} />
      )}

      {showAdd && (
        <AddPassModal
          user={user}
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addGatePass({
              ...data,
              flatNumber: user?.flatNumber ?? "Admin",
              residentName: user?.name ?? "Admin",
              status: "active",
            });
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

function PassDetailModal({ pass, onClose }: { pass: GatePass; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.detailModal, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <View style={styles.passCard}>
          <LinearGradient colors={["#4C1D95", "#7C3AED"]} style={styles.passCardHeader}>
            <MaterialCommunityIcons name="office-building" size={20} color="#fff" />
            <Text style={styles.passCardTitle}>GREEN VALLEY CHS</Text>
            <Text style={styles.passCardSubtitle}>VISITOR GATE PASS</Text>
          </LinearGradient>
          <View style={styles.passCardBody}>
            <View style={styles.passQrSection}>
              <View style={styles.qrContainer}>
                <QRCodeDisplay passCode={pass.passCode} size={140} />
              </View>
              <Text style={styles.passCodeText}>{pass.passCode}</Text>
              <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusBg(pass.status) }]}>
                <Text style={[styles.statusTextLarge, { color: getStatusColor(pass.status) }]}>
                  {(pass.status ?? "active").toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.passDivider} />
            <View style={styles.passDetails}>
              <PassRow icon="person" label="Visitor" value={pass.visitorName} />
              <PassRow icon="call" label="Phone" value={pass.visitorPhone} />
              <PassRow icon="home" label="Flat" value={`${pass.flatNumber} (${pass.residentName})`} />
              <PassRow icon="information-circle" label="Purpose" value={pass.purpose} />
              <PassRow icon="calendar" label="Valid" value={`${pass.validFrom} — ${pass.validTill}`} />
              {pass.vehicleNumber && <PassRow icon="car" label="Vehicle" value={pass.vehicleNumber} />}
            </View>
          </View>
        </View>
        <Pressable style={styles.closePassBtn} onPress={onClose}>
          <Text style={styles.closePassBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function PassRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.passRow}>
      <Ionicons name={`${icon}-outline` as any} size={16} color={Colors.primary} />
      <View style={styles.passRowContent}>
        <Text style={styles.passRowLabel}>{label}</Text>
        <Text style={styles.passRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function AddPassModal({ user, onClose, onAdd }: any) {
  const insets = useSafeAreaInsets();
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validTill, setValidTill] = useState(new Date().toISOString().split("T")[0]);
  const [vehicleNumber, setVehicleNumber] = useState("");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Generate Gate Pass</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14 }}>
              <View>
                <Text style={styles.formLabel}>Visitor Name *</Text>
                <TextInput style={styles.formInput} placeholder="Full name" placeholderTextColor={Colors.textTertiary} value={visitorName} onChangeText={setVisitorName} />
              </View>
              <View>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <TextInput style={styles.formInput} placeholder="+91 98765 43210" placeholderTextColor={Colors.textTertiary} value={visitorPhone} onChangeText={setVisitorPhone} keyboardType="phone-pad" />
              </View>
              <View>
                <Text style={styles.formLabel}>Purpose of Visit *</Text>
                <TextInput style={styles.formInput} placeholder="Guest, Delivery, Repair..." placeholderTextColor={Colors.textTertiary} value={purpose} onChangeText={setPurpose} />
              </View>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Valid From</Text>
                  <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} value={validFrom} onChangeText={setValidFrom} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Valid Till</Text>
                  <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} value={validTill} onChangeText={setValidTill} />
                </View>
              </View>
              <View>
                <Text style={styles.formLabel}>Vehicle Number (Optional)</Text>
                <TextInput style={styles.formInput} placeholder="MH-01-AB-1234" placeholderTextColor={Colors.textTertiary} value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.generateBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => { if (visitorName && visitorPhone && purpose) onAdd({ visitorName, visitorPhone, purpose, validFrom, validTill, vehicleNumber: vehicleNumber || undefined }); }}
          >
            <MaterialCommunityIcons name="qrcode" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Pass</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStatusColor(s: string) {
  if (s === "active") return Colors.success;
  if (s === "used") return Colors.secondary;
  return Colors.textSecondary;
}

function getStatusBg(s: string) {
  if (s === "active") return Colors.successSoft;
  if (s === "used") return Colors.secondarySoft;
  return Colors.divider;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 20, justifyContent: "center" },
  statChip: { alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  createPassBtn: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#7C3AED", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  createPassText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", gap: 12, padding: 14, alignItems: "center" },
  qrThumb: { width: 64, height: 64, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  passInfo: { flex: 1 },
  passCode: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#7C3AED", letterSpacing: 1 },
  visitorName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  visitorPhone: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardDivider: { height: 1, backgroundColor: Colors.divider },
  cardMeta: { padding: 14, gap: 6 },
  metaItem: { flexDirection: "row", gap: 8, alignItems: "center" },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  detailModal: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  passCard: { backgroundColor: Colors.card, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8, marginBottom: 20 },
  passCardHeader: { paddingVertical: 14, paddingHorizontal: 20, alignItems: "center", gap: 4 },
  passCardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 2 },
  passCardSubtitle: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", letterSpacing: 1 },
  passCardBody: { padding: 20 },
  passQrSection: { alignItems: "center", gap: 12 },
  qrContainer: { width: 156, height: 156, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, padding: 8, backgroundColor: "#fff" },
  passCodeText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#7C3AED", letterSpacing: 3 },
  statusBadgeLarge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  statusTextLarge: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  passDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 16 },
  passDetails: { gap: 12 },
  passRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  passRowContent: { flex: 1 },
  passRowLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  passRowValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 1 },
  closePassBtn: { backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  closePassBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 20 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  formRow: { flexDirection: "row", gap: 10 },
  generateBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  generateBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
