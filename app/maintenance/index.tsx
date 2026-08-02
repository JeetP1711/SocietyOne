import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, MaintenanceRecord } from "@/context/DataContext";
import Colors from "@/constants/colors";

type Filter = "all" | "paid" | "pending" | "overdue";

export default function MaintenanceScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { maintenance, payMaintenance } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [payModal, setPayModal] = useState<MaintenanceRecord | null>(null);

  const canViewAll = user?.role === "admin" || user?.role === "secretary";

  const filtered = maintenance
    .filter((m) => (canViewAll ? true : m.flatNumber === user?.flatNumber))
    .filter((m) => (filter === "all" ? true : m.status === filter));

  const total = canViewAll ? maintenance.length : maintenance.filter((m) => m.flatNumber === user?.flatNumber).length;
  const paid = maintenance.filter((m) => (canViewAll ? true : m.flatNumber === user?.flatNumber) && m.status === "paid").length;
  const pending = maintenance.filter((m) => (canViewAll ? true : m.flatNumber === user?.flatNumber) && m.status === "pending").length;
  const overdue = maintenance.filter((m) => (canViewAll ? true : m.flatNumber === user?.flatNumber) && m.status === "overdue").length;

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0F4C2E", "#16A34A"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Maintenance</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryChip label="Total" value={total} color="#fff" bg="rgba(255,255,255,0.2)" />
          <SummaryChip label="Paid" value={paid} color="#4ADE80" bg="rgba(74,222,128,0.2)" />
          <SummaryChip label="Pending" value={pending} color="#FCD34D" bg="rgba(252,211,77,0.2)" />
          <SummaryChip label="Overdue" value={overdue} color="#F87171" bg="rgba(248,113,113,0.2)" />
        </View>
        <View style={styles.filterRow}>
          {(["all", "paid", "pending", "overdue"] as Filter[]).map((f) => (
            <Pressable key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No records found</Text>
          </View>
        )}
        {filtered.map((m) => (
          <MaintenanceCard
            key={m.id}
            item={m}
            canPay={!canViewAll || m.flatNumber === user?.flatNumber}
            onPay={() => setPayModal(m)}
          />
        ))}
      </ScrollView>

      {payModal && (
        <PayModal
          item={payModal}
          onClose={() => setPayModal(null)}
          onPay={async (method) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await payMaintenance(payModal.id, method);
            setPayModal(null);
          }}
        />
      )}
    </View>
  );
}

function SummaryChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.summaryChip, { backgroundColor: bg }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

function MaintenanceCard({ item, canPay, onPay }: { item: MaintenanceRecord; canPay: boolean; onPay: () => void }) {
  const statusColor = item.status === "paid" ? Colors.success : item.status === "overdue" ? Colors.error : Colors.warning;
  const statusBg = item.status === "paid" ? Colors.successSoft : item.status === "overdue" ? Colors.errorSoft : Colors.warningSoft;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={styles.flatBadge}>
            <MaterialCommunityIcons name="home" size={16} color={Colors.primary} />
            <Text style={styles.flatNumber}>{item.flatNumber}</Text>
          </View>
          <Text style={styles.residentName}>{item.residentName}</Text>
          <Text style={styles.period}>{item.month}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.metaLabel}>Due Date</Text>
          <Text style={styles.metaValue}>{item.dueDate}</Text>
        </View>
        {item.paidDate && (
          <View>
            <Text style={styles.metaLabel}>Paid On</Text>
            <Text style={styles.metaValue}>{item.paidDate}</Text>
          </View>
        )}
        {item.paymentMethod && (
          <View>
            <Text style={styles.metaLabel}>Method</Text>
            <Text style={styles.metaValue}>{item.paymentMethod}</Text>
          </View>
        )}
        {item.status !== "paid" && canPay && (
          <Pressable style={({ pressed }) => [styles.payBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={onPay}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.payBtnText}>Pay Now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PayModal({ item, onClose, onPay }: { item: MaintenanceRecord; onClose: () => void; onPay: (method: string) => void }) {
  const insets = useSafeAreaInsets();
  const methods = ["UPI", "Bank Transfer", "Cash", "Cheque", "NEFT"];

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Pay Maintenance</Text>
        <View style={styles.payInfo}>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Flat</Text>
            <Text style={styles.payInfoValue}>{item.flatNumber}</Text>
          </View>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Month</Text>
            <Text style={styles.payInfoValue}>{item.month}</Text>
          </View>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Amount</Text>
            <Text style={[styles.payInfoValue, { color: Colors.primary, fontFamily: "Inter_700Bold", fontSize: 20 }]}>₹{item.amount.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.methodTitle}>Choose Payment Method</Text>
        <View style={styles.methodGrid}>
          {methods.map((m) => (
            <Pressable key={m} style={({ pressed }) => [styles.methodBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={() => onPay(m)}>
              <MaterialCommunityIcons name={getPayIcon(m) as any} size={24} color={Colors.primary} />
              <Text style={styles.methodText}>{m}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function getPayIcon(method: string) {
  if (method === "UPI") return "cellphone";
  if (method === "Bank Transfer") return "bank-transfer";
  if (method === "Cash") return "cash";
  if (method === "Cheque") return "checkbook";
  return "bank";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  summaryChip: { flex: 1, borderRadius: 10, padding: 8, alignItems: "center" },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  filterRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 3, gap: 2 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  filterBtnActive: { backgroundColor: "#fff" },
  filterBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  filterBtnTextActive: { color: Colors.primaryDark, fontFamily: "Inter_600SemiBold" },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  cardLeft: { gap: 4 },
  flatBadge: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: Colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  flatNumber: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.primary },
  residentName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  period: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  cardRight: { alignItems: "flex-end", gap: 8 },
  amount: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  cardDivider: { height: 1, backgroundColor: Colors.divider },
  cardBottom: { flexDirection: "row", padding: 14, gap: 16, flexWrap: "wrap", alignItems: "center" },
  metaLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  metaValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  payBtn: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: "auto" },
  payBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 20 },
  payInfo: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, gap: 12, marginBottom: 24 },
  payInfoRow: { flexDirection: "row", justifyContent: "space-between" },
  payInfoLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  payInfoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  methodTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 14 },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  methodBtn: { width: "30%", backgroundColor: Colors.primarySoft, borderRadius: 14, padding: 14, alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: Colors.primaryBorder },
  methodText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  cancelBtn: { backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
});
