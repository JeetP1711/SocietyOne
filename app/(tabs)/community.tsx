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

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { members, workers, complaints, nocRequests } = useData();

  const openComplaints = complaints.filter((c) => c.status === "open" || c.status === "in-progress").length;
  const pendingNOC = nocRequests.filter((n) => n.status === "pending").length;

  const canManage = user?.role === "admin" || user?.role === "secretary";
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const cards = [
    {
      label: "Member Directory",
      subtitle: `${members.length} residents`,
      icon: "account-group",
      color: "#059669",
      bg: "#ECFDF5",
      route: "/members",
      count: null,
      show: true,
    },
    {
      label: "Society Workers",
      subtitle: `${workers.filter((w) => w.isActive).length} active staff`,
      icon: "hard-hat",
      color: "#2563EB",
      bg: "#EFF6FF",
      route: "/members",
      count: null,
      show: canManage,
    },
    {
      label: "Complaints",
      subtitle: "Raise & track issues",
      icon: "alert-circle-outline",
      color: "#DC2626",
      bg: "#FEF2F2",
      route: "/complaints",
      count: openComplaints,
      show: true,
    },
    {
      label: "NOC Management",
      subtitle: "Rental approvals",
      icon: "file-certificate",
      color: "#64748B",
      bg: "#F8FAFC",
      route: "/noc",
      count: canManage ? pendingNOC : null,
      show: true,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <LinearGradient
        colors={["#059669", "#2563EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>Members, staff & society management</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatBox label="Residents" value={members.length} color={Colors.primary} />
          <StatBox label="Staff" value={workers.filter((w) => w.isActive).length} color={Colors.secondary} />
          <StatBox label="Open Tickets" value={openComplaints} color={Colors.error} />
          <StatBox label="Pending NOC" value={pendingNOC} color={Colors.warning} />
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        {cards.filter((c) => c.show).map((c) => (
          <Pressable
            key={c.label}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push(c.route as any)}
          >
            <View style={[styles.cardIcon, { backgroundColor: c.bg }]}>
              <MaterialCommunityIcons name={c.icon as any} size={28} color={c.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardSubtitle}>{c.subtitle}</Text>
            </View>
            {c.count !== null && c.count > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{c.count}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Complaints</Text>
        {complaints.slice(0, 4).map((c) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [styles.complaintCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/complaints")}
          >
            <View style={[styles.complaintStatus, { backgroundColor: getStatusColor(c.status) + "20" }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(c.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(c.status) }]}>{(c.status ?? "open").replace("-", " ")}</Text>
            </View>
            <Text style={styles.complaintTitle} numberOfLines={1}>{c.title}</Text>
            <Text style={styles.complaintMeta}>{c.flatNumber} • {c.ticketNo}</Text>
          </Pressable>
        ))}
        {complaints.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>No complaints raised</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statBox, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getStatusColor(status: string) {
  if (status === "open") return Colors.error;
  if (status === "in-progress") return Colors.warning;
  if (status === "resolved") return Colors.success;
  return Colors.textSecondary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 4 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  body: { padding: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.textSecondary, textAlign: "center", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cardSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  countBadge: { backgroundColor: Colors.error, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  countBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  complaintCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  complaintStatus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginBottom: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  complaintTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  complaintMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 3 },
  emptyState: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
});
